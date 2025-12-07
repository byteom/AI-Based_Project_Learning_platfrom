'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, StopCircle, Waves, History, Wand2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { emotions, type Emotion } from '@/lib/accent-ace-config';
import { generateEmotionPhrase } from '@/ai/flows/generate-emotion-phrase';
import { analyzeTone, type AnalyzeToneOutput } from '@/ai/flows/analyze-tone';
import { Progress } from '@/components/ui/progress';
import { addHistoryItem, getHistoryItems, updateHistoryItem } from '@/services/pitchPerfectHistoryService';
import type { PitchPerfectHistoryItem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/hooks/use-auth';
import { useTokenUsage } from '@/hooks/use-token-usage';

export default function PitchPerfectPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addTokens } = useTokenUsage();
  
  // Get API key from localStorage (same key as sidebar uses)
  const GEMINI_KEY_STORAGE = 'Project Code_gemini_api_key';
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(GEMINI_KEY_STORAGE) : null;
    setApiKey(stored);
    
    // Listen for storage changes (when user updates key in sidebar)
    const handleStorageChange = () => {
      const updated = typeof window !== 'undefined' ? localStorage.getItem(GEMINI_KEY_STORAGE) : null;
      setApiKey(updated);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gemini-key-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gemini-key-updated', handleStorageChange);
    };
  }, []);

  const [emotion, setEmotion] = useState<Emotion>('Happy');
  const [phrase, setPhrase] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzeToneOutput | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [history, setHistory] = useState<PitchPerfectHistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if(user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      const items = await getHistoryItems();
      setHistory(items);
    } catch (e) {
      console.error("Failed to load history", e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load practice history.",
      });
    }
  };
  
  const resetPractice = () => {
    setPhrase('');
    setAnalysis(null);
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setCurrentHistoryId(null);
  }

  const handleGeneratePhrase = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your Gemini API key in the sidebar to use this feature.",
      });
      return;
    }
    resetPractice();
    setIsLoading(true);
    try {
      const pastPhrases = history.map(h => h.phrase);
      const { phrase: newPhrase } = await generateEmotionPhrase({ emotion, history: pastPhrases, apiKey });
      setPhrase(newPhrase);
      addTokens(0); // Phrase generation tokens
      const id = await addHistoryItem({ phrase: newPhrase, emotion });
      setCurrentHistoryId(id);
      await loadHistory();
    } catch (error) {
      console.error('Error generating phrase:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate a phrase. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setAnalysis(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      const audioChunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Could not access microphone. Please check your browser permissions.",
      });
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyze = async () => {
    if (!recordedAudio || !phrase || !currentHistoryId) return;
    setIsAnalyzing(true);
    setAnalysis(null);

    const reader = new FileReader();
    reader.readAsDataURL(recordedAudio);
    reader.onloadend = async () => {
      try {
        const base64Audio = reader.result as string;
        const result = await analyzeTone({
          recordedAudioDataUri: base64Audio,
          phrase: phrase,
          emotion: emotion,
          apiKey: apiKey!,
        });
        setAnalysis(result);
        addTokens(result.tokensUsed || 0);
        
        await updateHistoryItem(currentHistoryId, {
            analysis: result,
            recordedAudioUrl: recordedAudioUrl!
        });
        await loadHistory();
        
      } catch (error) {
        console.error('Error analyzing tone:', error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'There was an error analyzing your recording.',
        });
      } finally {
        setIsAnalyzing(false);
      }
    };
  };

  const playAudio = (url: string | undefined) => {
    if (url) {
      const audio = new Audio(url);
      audio.play();
    }
  };

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between pb-6 border-b">
          <div className="flex items-center gap-3">
            <Link href="/accent-ace">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Mic className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline tracking-tight">Pitch Perfect</h1>
          </div>
          <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Practice History
          </Button>
        </header>

        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pitch Perfect History</DialogTitle>
              <DialogDescription>Review your past tone analysis sessions.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <Accordion type="single" collapsible className="w-full">
                {history.map(item => (
                  <AccordionItem value={item.id} key={item.id}>
                    <AccordionTrigger>{item.phrase}</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                       <p>Emotion: <span className="font-semibold">{item.emotion}</span></p>
                      {item.analysis && <p>Score: <span className="font-semibold">{item.analysis.consistencyScore}%</span></p>}
                      {item.recordedAudioUrl && <Button size="sm" variant="outline" onClick={() => playAudio(item.recordedAudioUrl)}>Listen to Recording</Button>}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </DialogContent>
        </Dialog>

        <main className="max-w-4xl mx-auto mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Get a Challenge</CardTitle>
              <CardDescription>Select an emotion you want to practice conveying, then generate a phrase.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="emotion-select" className="text-sm font-medium">Emotion</label>
                <Select value={emotion} onValueChange={(v) => setEmotion(v as Emotion)}>
                  <SelectTrigger id="emotion-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {emotions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGeneratePhrase} disabled={isLoading} className="self-end">
                {isLoading ? <Loader2 className="animate-spin" /> : <><Wand2 className="mr-2 h-4 w-4" />Generate Phrase</>}
              </Button>
            </CardContent>
          </Card>

          {phrase && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Record & Analyze</CardTitle>
                <CardDescription>
                  Read the following sentence out loud, trying to convey the emotion of <span className="font-bold text-primary">{emotion}</span>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center text-lg font-serif p-6 bg-muted rounded-lg">
                  "{phrase}"
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button onClick={isRecording ? stopRecording : startRecording} size="lg" className={`${isRecording ? 'bg-destructive' : ''}`}>
                    {isRecording ? <><StopCircle className="mr-2" /> Stop</> : <><Mic className="mr-2" /> Record</>}
                  </Button>
                  {recordedAudioUrl && <audio controls src={recordedAudioUrl} className="max-w-full" />}
                  <Button onClick={handleAnalyze} disabled={!recordedAudio || isAnalyzing || isRecording} size="lg">
                    {isAnalyzing ? <><Loader2 className="animate-spin mr-2" />Analyzing...</> : "Analyze Tone"}
                  </Button>
                </div>
                {isRecording && (
                  <div className="flex items-center justify-center gap-2 text-destructive pt-2">
                    <Waves className="animate-pulse" /><span>Recording...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(isAnalyzing || analysis) && (
            <Card>
              <CardHeader>
                <CardTitle>Your Tone Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="flex items-center justify-center h-32"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
                ) : analysis && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">Consistency with "{emotion}"</h3>
                        <span className="text-2xl font-bold text-primary">{analysis.consistencyScore}%</span>
                      </div>
                      <Progress value={analysis.consistencyScore} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Pitch Analysis</h3>
                      <p className="text-muted-foreground">{analysis.pitchAnalysis}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Volume Analysis</h3>
                      <p className="text-muted-foreground">{analysis.volumeAnalysis}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Overall Feedback</h3>
                      <p className="text-muted-foreground">{analysis.overallFeedback}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

