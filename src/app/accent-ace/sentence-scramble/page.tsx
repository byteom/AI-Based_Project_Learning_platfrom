'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Shuffle, StopCircle, Waves, Volume2, Pause, History, ChevronsRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { generateScrambledSentence } from '@/ai/flows/generate-scrambled-sentence';
import { generateAudio } from '@/ai/flows/generate-audio';
import { analyzeAccent, type AnalyzeAccentOutput } from '@/ai/flows/analyze-accent';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SentenceScrambleHistoryItem } from '@/lib/types';
import { addHistoryItem, updateHistoryItem, getHistoryItems } from '@/services/sentenceScrambleHistoryService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useTokenUsage } from '@/hooks/use-token-usage';

export default function SentenceScramblePage() {
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

  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [scrambledSentence, setScrambledSentence] = useState('');
  const [correctSentence, setCorrectSentence] = useState('');
  
  const [scrambledAudioUrl, setScrambledAudioUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeAccentOutput | null>(null);

  const [history, setHistory] = useState<SentenceScrambleHistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (user) loadHistory();
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

  const handleNewSentence = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your Gemini API key in the sidebar to use this feature.",
      });
      return;
    }
    setIsLoading(true);
    resetState();
    try {
      const pastSentences = history.map(h => h.correctSentence);
      const { jumbled, original } = await generateScrambledSentence({ history: pastSentences, apiKey });
      setScrambledSentence(jumbled);
      setCorrectSentence(original);
      const audioResult = await generateAudio({ language: 'English', accent: 'American', text: jumbled, apiKey });
      setScrambledAudioUrl(audioResult.audioDataUri);
      addTokens(audioResult.tokensUsed || 0);

      const historyId = await addHistoryItem({
        scrambledSentence: jumbled,
        correctSentence: original,
        scrambledAudioUrl: audioResult.audioDataUri,
      });
      setCurrentHistoryId(historyId);
      await loadHistory();

    } catch (error) {
      console.error('Error generating scrambled sentence:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate a new sentence. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setScrambledSentence('');
    setCorrectSentence('');
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setAnalysis(null);
    setIsRecording(false);
    setIsAnalyzing(false);
    setScrambledAudioUrl(null);
    setIsSpeaking(false);
    setCurrentHistoryId(null);
  };
  
  const handlePlayAudio = (url: string) => {
    if (!url) return;

    if (isSpeaking && audioRef.current?.src === url) {
      audioRef.current?.pause();
    } else {
      if(audioRef.current){
        audioRef.current.src = url;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current?.play();
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
    if (!recordedAudio || !correctSentence || !currentHistoryId) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    
    const reader = new FileReader();
    reader.readAsDataURL(recordedAudio);
    reader.onloadend = async () => {
      try {
        const base64Audio = reader.result as string;
        const result = await analyzeAccent({
          recordedAudioDataUri: base64Audio,
          referenceText: correctSentence,
          apiKey: apiKey!,
        });
        setAnalysis(result);
        addTokens(result.tokensUsed || 0);
        
        await updateHistoryItem(currentHistoryId, {
            recordedAudioUrl: recordedAudioUrl!,
            analysis: result
        })
        await loadHistory();

        toast({
            title: "Analysis Complete!",
            description: `Your pronunciation accuracy was ${result.overallAccuracy}%.`,
        });

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
    if (accuracy > 80) return 'bg-accent/20 text-accent-foreground/90 rounded-md p-1';
    if (accuracy > 50) return 'bg-primary/10 text-primary-foreground/90 rounded-md p-1';
    return 'bg-destructive/20 text-destructive/90 rounded-md p-1';
  };
  
  const handleSelectHistoryItem = (item: SentenceScrambleHistoryItem) => {
    resetState();
    setScrambledSentence(item.scrambledSentence);
    setCorrectSentence(item.correctSentence);
    setScrambledAudioUrl(item.scrambledAudioUrl);
    setRecordedAudioUrl(item.recordedAudioUrl || null);
    setAnalysis(item.analysis || null);
    setCurrentHistoryId(item.id);
    setIsHistoryOpen(false);
  }

  return (
    <div className="bg-background text-foreground">
        <audio 
            ref={audioRef} 
            className="hidden" 
            onPlay={() => setIsSpeaking(true)}
            onEnded={() => setIsSpeaking(false)}
            onPause={() => setIsSpeaking(false)}
        />
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between pb-6 border-b">
            <div className='flex items-center gap-3'>
              <Link href="/accent-ace">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Shuffle className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline tracking-tight">Sentence Scramble</h1>
            </div>
            <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
        </header>

        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scramble History</DialogTitle>
              <DialogDescription>
                Review your past sentence scramble games.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
               <Accordion type="single" collapsible className="w-full">
                {history.map(item => (
                  <AccordionItem value={item.id} key={item.id}>
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="truncate text-left" style={{maxWidth: '200px'}}>
                          {item.correctSentence}
                        </span>
                        {item.analysis && (
                          <Badge
                            variant={ item.analysis.overallAccuracy > 80 ? 'default' : 'secondary' }
                          >
                            {item.analysis.overallAccuracy}%
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 px-1">
                          <div>
                            <p className="text-xs text-muted-foreground">Scrambled</p>
                            <p>{item.scrambledSentence}</p>
                          </div>
                           <div>
                            <p className="text-xs text-muted-foreground">Correct</p>
                            <p>{item.correctSentence}</p>
                          </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handlePlayAudio(item.scrambledAudioUrl)}>
                            <Volume2 className="mr-2 h-4 w-4" />
                            Jumbled
                          </Button>
                          {item.recordedAudioUrl && (
                            <Button size="sm" variant="outline" onClick={() => handlePlayAudio(item.recordedAudioUrl!)}>
                              <Mic className="mr-2 h-4 w-4" />
                              My Recording
                            </Button>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleSelectHistoryItem(item)}>
                          View Details
                        </Button>
                      </div>
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
              <CardTitle>Listen, Unscramble, and Speak</CardTitle>
              <CardDescription>Listen to the jumbled sentence, figure out the correct order in your head, and then speak the correct sentence out loud.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Button onClick={handleNewSentence} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Get New Sentence'}
                </Button>
              </div>

              {!scrambledAudioUrl && !isLoading && (
                  <div className="text-center text-muted-foreground p-8">
                    <p>Click the button above to start a new game!</p>
                  </div>
              )}

              {scrambledAudioUrl && !isLoading && (
                  <Card className="bg-muted/50 p-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button onClick={() => handlePlayAudio(scrambledAudioUrl)} size="lg" variant="outline" aria-label="Play scrambled audio" disabled={!scrambledAudioUrl || isLoading}>
                          {isSpeaking && audioRef.current?.src === scrambledAudioUrl ? <><Pause className="mr-2" /> Stop</> : <><Volume2 className="mr-2" /> Listen to Jumbled Sentence</>}
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
                  </Card>
              )}
            </CardContent>
          </Card>

          {correctSentence && !isLoading && (
             <Card>
                <CardHeader>
                    <CardTitle>Step 2: Record Yourself</CardTitle>
                    <CardDescription>Ready? Record yourself saying the unscrambled sentence.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button onClick={isRecording ? stopRecording : startRecording} size="lg" className={`w-full sm:w-auto ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`}>
                            {isRecording ? <><StopCircle className="mr-2" /> Stop</> : <><Mic className="mr-2" /> Record</>}
                        </Button>
                        
                        {recordedAudioUrl && (
                            <audio controls src={recordedAudioUrl} className="max-w-full" />
                        )}

                        <Button onClick={handleAnalyze} disabled={!recordedAudio || isAnalyzing || isRecording} size="lg" className="w-full sm:w-auto">
                            {isAnalyzing ? <><Loader2 className="mr-2 animate-spin" /> Analyzing...</> : 'Analyze'}
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
                  <CardTitle>Your Results</CardTitle>
                  <CardDescription>The correct sentence was: <span className="font-semibold text-primary">{correctSentence}</span></CardDescription>
                </CardHeader>
                <CardContent>
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                  ) : analysis && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold">Overall Accuracy</h3>
                          <span className="text-2xl font-bold text-primary">{analysis.overallAccuracy}%</span>
                        </div>
                        <Progress value={analysis.overallAccuracy} className="w-full" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Detailed Feedback</h3>
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
                        <h3 className="text-lg font-semibold mb-2">Suggestions for Improvement</h3>
                        <p className="text-muted-foreground">{analysis.suggestions}</p>
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

