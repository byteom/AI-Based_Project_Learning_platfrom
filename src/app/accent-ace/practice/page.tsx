"use client";

import { useState, useRef, useEffect } from 'react';
import { languages, type Language, type Accent, difficulties, type Difficulty } from '@/lib/accent-ace-config';
import { generatePhrase } from '@/ai/flows/generate-phrase';
import { generateAudio } from '@/ai/flows/generate-audio';
import { analyzeAccent, type AnalyzeAccentOutput } from '@/ai/flows/analyze-accent';
import { useToast } from "@/hooks/use-toast"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Mic, Pause, Speech, StopCircle, Volume2, Waves, History, ChevronsRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { addHistoryItem, updateHistoryItem, getHistoryItems } from '@/services/accentAceHistoryService';
import type { AccentAceHistoryItem } from '@/lib/types';
import { HistoryList } from '@/components/accent-ace/history-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from '@/hooks/use-auth';
import { useTokenUsage } from '@/hooks/use-token-usage';

export default function AccentAcePracticePage() {
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
    // Also listen for custom event in case storage event doesn't fire (same window)
    window.addEventListener('gemini-key-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gemini-key-updated', handleStorageChange);
    };
  }, []);
  
  const [language, setLanguage] = useState<Language>('English');
  const [accent, setAccent] = useState<Accent>('American');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [phrase, setPhrase] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzeAccentOutput | null>(null);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const referenceAudioRef = useRef<HTMLAudioElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const [history, setHistory] = useState<AccentAceHistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const items = await getHistoryItems();
      setHistory(items);
    } catch(e) {
      console.error("Failed to load history", e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load practice history.",
      });
    }
  }

  const handleLanguageChange = (value: string) => {
    const newLang = value as Language;
    setLanguage(newLang);
    const availableAccents = languages[newLang] || [];
    if(availableAccents.length > 0){
        setAccent(availableAccents[0]);
    }
    resetPracticeState();
  };

  const handleAccentChange = (value: string) => {
    setAccent(value as Accent);
    resetPracticeState();
  };
  
  const handleDifficultyChange = (value: string) => {
    setDifficulty(value as Difficulty);
    resetPracticeState();
  };

  const resetPracticeState = () => {
    setPhrase('');
    setAnalysis(null);
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setReferenceAudioUrl(null);
    if (referenceAudioRef.current) {
        referenceAudioRef.current.pause();
        referenceAudioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setCurrentHistoryId(null);
  }

  const handleGeneratePhrase = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your Gemini API key in the sidebar to use Accent Ace.",
      });
      return;
    }
    resetPracticeState();
    setIsGenerating(true);
    try {
      const pastPhrases = history.map(h => h.phrase);
      const phraseResult = await generatePhrase({ language, difficulty, history: pastPhrases, apiKey });
      setPhrase(phraseResult.phrase);
      addTokens(phraseResult.tokensUsed || 0);
      
      const audioResult = await generateAudio({ language, accent, text: phraseResult.phrase, apiKey });
      setReferenceAudioUrl(audioResult.audioDataUri);
      addTokens(audioResult.tokensUsed || 0);
      
      const historyId = await addHistoryItem({
        phrase: phraseResult.phrase, 
        referenceAudioUrl: audioResult.audioDataUri,
        language,
        accent,
        difficulty
      });
      setCurrentHistoryId(historyId);
      await loadHistory();
      
    } catch (error) {
      console.error('Error generating phrase:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate a new phrase. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayReference = (url?: string) => {
    const audioUrl = url || referenceAudioUrl;
    if (!audioUrl) return;

    if (isSpeaking && referenceAudioRef.current?.src.startsWith('data:')) {
      referenceAudioRef.current?.pause();
      setIsSpeaking(false);
    } else {
      if(referenceAudioRef.current){
        referenceAudioRef.current.src = audioUrl;
        referenceAudioRef.current.playbackRate = playbackRate;
        referenceAudioRef.current?.play();
        setIsSpeaking(true);
      }
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
      })
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
        const result = await analyzeAccent({
          recordedAudioDataUri: base64Audio,
          referenceText: phrase,
          apiKey: apiKey!,
        });
        setAnalysis(result);
        addTokens(result.tokensUsed || 0);

        await updateHistoryItem(currentHistoryId, {
          analysis: result,
          recordedAudioUrl: recordedAudioUrl!,
        });
        await loadHistory();

      } catch (error) {
        console.error('Error analyzing accent:', error);
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: "There was an error analyzing your recording. Please try again.",
        });
      } finally {
        setIsAnalyzing(false);
      }
    };
  };
  
  const getWordColorClass = (accuracy: number) => {
    if (accuracy > 80) return 'bg-accent/20 text-accent-foreground/90 rounded-md p-1 transition-all duration-300 animate-pulse-once';
    if (accuracy > 50) return 'bg-primary/10 text-primary-foreground/90 rounded-md p-1';
    return 'bg-destructive/20 text-destructive/90 rounded-md p-1';
  };
  
  const handleSelectHistoryItem = (item: AccentAceHistoryItem) => {
    resetPracticeState();
    setLanguage(item.language);
    setAccent(item.accent);
    setDifficulty(item.difficulty);
    setPhrase(item.phrase);
    setReferenceAudioUrl(item.referenceAudioUrl);
    setRecordedAudioUrl(item.recordedAudioUrl || null);
    setAnalysis(item.analysis || null);
    setCurrentHistoryId(item.id);
    setIsHistoryOpen(false);
  }

  const availableAccents = languages[language] || [];

  return (
    <div className="bg-background text-foreground">
      <audio 
          ref={referenceAudioRef} 
          className="hidden" 
          onEnded={() => setIsSpeaking(false)}
          onPause={() => setIsSpeaking(false)}
      />
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between pb-6 border-b">
          <div className="flex items-center gap-3">
            <Link href="/accent-ace">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Speech className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline tracking-tight">Accent Ace</h1>
          </div>
          <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
            <History className="mr-2" />
            Practice History
          </Button>
        </header>
        
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Practice History</DialogTitle>
              <DialogDescription>
                Review your past practice sessions and track your progress.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <HistoryList history={history} onSelect={handleSelectHistoryItem} playAudio={handlePlayReference} />
            </div>
          </DialogContent>
        </Dialog>

        <main className="max-w-4xl mx-auto mt-8">
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Step 1: Choose Your Practice</CardTitle>
                <CardDescription>Select a language and accent, then generate a phrase to start.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="language-select" className="text-sm font-medium">Language</label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger id="language-select" className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(languages).map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="accent-select" className="text-sm font-medium">Accent</label>
                  <Select value={accent} onValueChange={handleAccentChange}>
                    <SelectTrigger id="accent-select" className="w-full">
                      <SelectValue placeholder="Select accent" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAccents.map(acc => (
                        <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="difficulty-select" className="text-sm font-medium">Difficulty</label>
                  <Select value={difficulty} onValueChange={handleDifficultyChange}>
                    <SelectTrigger id="difficulty-select" className="w-full">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map(diff => (
                        <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGeneratePhrase} disabled={isGenerating} className="self-end">
                  {isGenerating ? <Loader2 className="animate-spin" /> : 'New Phrase'}
                </Button>
              </CardContent>
            </Card>

            {phrase && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Step 2: Record & Submit</CardTitle>
                  <CardDescription>Listen to the phrase, then record yourself saying it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg gap-2">
                    <Button onClick={() => handlePlayReference()} size="lg" variant="outline" aria-label="Play reference audio" disabled={!referenceAudioUrl}>
                      {isSpeaking ? <><Pause className="mr-2" /> Stop</> : <><Volume2 className="mr-2" /> Play Phrase</>}
                    </Button>
                    <div className="w-32">
                        <Select value={playbackRate.toString()} onValueChange={(val) => setPlaybackRate(parseFloat(val))}>
                            <SelectTrigger>
                                <ChevronsRight className="mr-2 h-4 w-4" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0.75">0.75x</SelectItem>
                                <SelectItem value="1">1x</SelectItem>
                                <SelectItem value="1.25">1.25x</SelectItem>
                                <SelectItem value="1.5">1.5x</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={isRecording ? stopRecording : startRecording} size="lg" className={`w-full sm:w-auto ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`}>
                      {isRecording ? <><StopCircle className="mr-2" /> Stop Recording</> : <><Mic className="mr-2" /> Start Recording</>}
                    </Button>
                    
                    {recordedAudioUrl && (
                        <audio controls src={recordedAudioUrl} className="max-w-full" />
                    )}

                    <Button onClick={handleAnalyze} disabled={!recordedAudio || isAnalyzing || isRecording || !currentHistoryId} size="lg" className="w-full sm:w-auto">
                      {isAnalyzing ? <><Loader2 className="mr-2 animate-spin" /> Analyzing...</> : 'Analyze My Accent'}
                    </Button>
                  </div>
                  {isRecording && (
                    <div className="flex items-center justify-center gap-2 text-destructive pt-2">
                        <Waves className="animate-pulse" />
                        <span>Recording...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {(isAnalyzing || analysis) && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Step 3: Your Results</CardTitle>
                  <CardDescription>Here is the detailed feedback on your pronunciation.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                  ) : analysis && (
                    <div className="space-y-6">
                       <div>
                        <h3 className="text-lg font-semibold mb-2">Your Pronunciation</h3>
                        <div className="text-lg p-4 bg-muted/50 rounded-lg space-x-2">
                          {analysis.detailedFeedback.map((word, index) => (
                             <TooltipProvider key={index} delayDuration={100}>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <span className={`inline-block ${getWordColorClass(word.pronunciationAccuracy)}`}>
                                     {word.word}
                                   </span>
                                 </TooltipTrigger>
                                 <TooltipContent className="max-w-xs">
                                   <p className="font-bold">Accuracy: {word.pronunciationAccuracy}%</p>
                                   <p>{word.errorDetails}</p>
                                 </TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold">Overall Accuracy</h3>
                          <span className="text-2xl font-bold text-primary">{analysis.overallAccuracy}%</span>
                        </div>
                        <Progress value={analysis.overallAccuracy} className="w-full" />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2">Suggestions for Improvement</h3>
                        <p className="text-muted-foreground">{analysis.suggestions}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

