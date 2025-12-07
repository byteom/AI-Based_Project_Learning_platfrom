'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Presentation, StopCircle, Waves, BrainCircuit, History, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { generateImpromptuTopic } from '@/ai/flows/generate-impromptu-topic';
import { analyzeSpeech } from '@/ai/flows/analyze-speech';
import { generateAudio } from '@/ai/flows/generate-audio';
import type { ImpromptuHistoryItem, AnalysisHistoryItem } from '@/lib/types';
import { addHistoryItem, getHistoryItems, updateHistoryItem } from '@/services/impromptuHistoryService';
import { addAnalysisHistoryItem, getAnalysisHistoryItems } from '@/services/analysisHistoryService';
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
import { useAuth } from '@/hooks/use-auth';
import { useTokenUsage } from '@/hooks/use-token-usage';

type Stage = 'idle' | 'thinking' | 'speaking' | 'finished';

export default function ImpromptuStagePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addTokens } = useTokenUsage();
  const [mounted, setMounted] = useState(false);
  
  // Get API key from localStorage (same key as sidebar uses)
  const GEMINI_KEY_STORAGE = 'Project Code_gemini_api_key';
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
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
  
  const [stage, setStage] = useState<Stage>('idle');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [rawTextResponse, setRawTextResponse] = useState<string | null>(null);
  
  const [timer, setTimer] = useState(60);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  const [history, setHistory] = useState<ImpromptuHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisHistoryItem | null>(null);
  const [ttsAudioDataUri, setTtsAudioDataUri] = useState<string | null>(null);
  const [viewingHistoryAnalysis, setViewingHistoryAnalysis] = useState<string | null>(null);

  useEffect(() => {
    if(user) loadHistory();
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

  const loadAnalysisForHistory = async (analysisId: string) => {
    try {
      const analysisItems = await getAnalysisHistoryItems();
      const foundAnalysis = analysisItems.find(a => a.id === analysisId);
      
      if (foundAnalysis) {
        setAnalysisResult(foundAnalysis);
        setViewingHistoryAnalysis(analysisId);
        
        setTimeout(() => {
          const analysisSection = document.getElementById('analysis-section');
          if (analysisSection) {
            analysisSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Not Found",
          description: `Analysis with ID ${analysisId} was not found.`,
        });
      }
    } catch (e) {
      console.error("Failed to load analysis", e);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load analysis: ${e instanceof Error ? e.message : 'Unknown error'}`,
      });
    }
  };

  const startTimer = (duration: number, onEnd: () => void) => {
    setTimer(duration);
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          onEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleGetTopic = async () => {
    setIsLoading(true);
    setTopic('');
    setRecordedAudioUrl(null);
    setCurrentHistoryId(null);
    setAnalysisResult(null);
    setViewingHistoryAnalysis(null);
    setTtsAudioDataUri(null);
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your Gemini API key in the sidebar to use this feature.",
      });
      return;
    }
    try {
      const pastTopics = history.map(h => h.topic);
      const { topic: newTopic } = await generateImpromptuTopic({ history: pastTopics, apiKey });
      setTopic(newTopic);
      addTokens(0); // Topic generation tokens
      const historyId = await addHistoryItem({ topic: newTopic });
      setCurrentHistoryId(historyId);
      await loadHistory();
      setStage('thinking');
      startTimer(60, () => {
        setStage('speaking');
        startRecording();
        startTimer(60, stopRecording);
      });
    } catch (error) {
      console.error('Error generating topic:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate a topic. Please try again.',
      });
      setStage('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    setRecordedAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      const audioChunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        if(currentHistoryId) {
            await updateHistoryItem(currentHistoryId, { recordedAudioUrl: url });
            await loadHistory();
        }
        
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setStage('finished');
         toast({
            title: "Time's up!",
            description: "Great job! You can now listen to your speech.",
        });
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
      setStage('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };
  
  const playAudio = (url: string | undefined) => {
    if (url) {
      const audio = new Audio(url);
      audio.play();
    }
  };

  const objectUrlToDataUri = async (objectUrl: string): Promise<string> => {
    const response = await fetch(objectUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalyzeSpeech = async () => {
    if (!recordedAudioUrl || !currentHistoryId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No recorded speech to analyze.",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const dataUri = await objectUrlToDataUri(recordedAudioUrl);
      const full = await analyzeSpeech({ audioDataUri: dataUri, topic, apiKey: apiKey! });
      setRawTextResponse(full.transcript);
      addTokens(full.tokensUsed || 0);

      try {
        const { audioDataUri } = await generateAudio({
          text: full.grammar.correctedText || full.transcript,
          language: 'English',
          accent: 'American',
          apiKey: apiKey!,
        });
        setTtsAudioDataUri(audioDataUri);
        addTokens(0); // TTS tokens
      } catch (e) {
        console.warn('TTS generation failed', e);
      }

      const cleanAnalysisData = {
        userResponse: full.transcript,
        analysis: full.summary,
        sentiment: 'neutral',
        keywords: [],
        correctedText: full.grammar.correctedText,
        grammarAccuracy: full.grammar.accuracy,
        grammarMistakes: full.grammar.mistakes,
        pronunciation: {
          overallAccuracy: full.pronunciation.overallAccuracy,
          detailedFeedback: full.pronunciation.detailedFeedback,
          suggestions: full.pronunciation.suggestions,
          accentNotes: full.pronunciation.accentNotes,
        },
        topicalityAdherence: full.topicality.adherence,
        topicalityExplanation: full.topicality.explanation,
        topicalityStrongPoints: full.topicality.strongPoints || [],
        topicalityMissedPoints: full.topicality.missedPoints || [],
        delivery: {
          wordsPerMinute: full.delivery.wordsPerMinute || null,
          fillerWords: full.delivery.fillerWords || [],
          structureFeedback: full.delivery.structureFeedback || null,
          pacingFeedback: full.delivery.pacingFeedback || null,
        },
      };

      const removeUndefined = (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter(item => item !== null);
        }
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = removeUndefined(value);
          }
        }
        return cleaned;
      };

      const cleanData = removeUndefined(cleanAnalysisData);
      const analysisHistoryId = await addAnalysisHistoryItem(cleanData);

      await updateHistoryItem(currentHistoryId, { analysisId: analysisHistoryId, rawTextResponse: full.transcript });
      await loadHistory();

      setAnalysisResult({
        id: analysisHistoryId,
        userId: user!.uid,
        ...cleanData,
        createdAt: new Date() as any,
      });

      toast({
        title: "Analysis Complete",
        description: "Detailed results are shown below.",
      });

    } catch (error) {
      console.error('Error analyzing speech:', error);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Failed to analyze speech. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderContent = () => {
    switch(stage) {
      case 'thinking':
        return (
            <div className="text-center space-y-4">
                <BrainCircuit className="w-16 h-16 mx-auto text-primary animate-pulse" />
                <h2 className="text-2xl font-semibold">Thinking Time</h2>
                <p className="text-muted-foreground">You have one minute to prepare your thoughts.</p>
                <div className="text-6xl font-bold font-mono text-primary">{timer}</div>
                <Button 
                  onClick={() => {
                    if (timerIntervalRef.current) {
                      clearInterval(timerIntervalRef.current);
                    }
                    setStage('speaking');
                    startRecording();
                    startTimer(60, stopRecording);
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Skip Time & Start Speaking
                </Button>
            </div>
        );
      case 'speaking':
        return (
            <div className="text-center space-y-4">
                <Mic className="w-16 h-16 mx-auto text-destructive animate-pulse" />
                <h2 className="text-2xl font-semibold">You're On! Speak Now.</h2>
                <p className="text-muted-foreground">You have one minute to speak on the topic.</p>
                <div className="text-6xl font-bold font-mono text-destructive">{timer}</div>
                {isRecording && (
                    <div className="flex items-center justify-center gap-2 text-destructive pt-2">
                        <Waves className="animate-pulse" />
                        <span>Recording...</span>
                    </div>
                )}
                <Button onClick={stopRecording} variant="destructive">
                    <StopCircle className="mr-2" />
                    End Speech
                </Button>
            </div>
        );
      case 'finished':
        return (
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold">Well Done!</h2>
                <p className="text-muted-foreground">You can listen to your speech below.</p>
                {recordedAudioUrl && <audio controls src={recordedAudioUrl} className="w-full max-w-md mx-auto" />}
                <div className="flex flex-col sm:flex-row justify-center gap-2 pt-4">
                    <Button onClick={handleAnalyzeSpeech} disabled={isAnalyzing || !recordedAudioUrl}>
                        {isAnalyzing ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit className="mr-2" />}
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Speech'}
                    </Button>
                    <Button onClick={handleGetTopic} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Try a New Topic'}
                    </Button>
                </div>
            </div>
        );
      case 'idle':
      default:
        return (
            <div className="text-center space-y-4">
                <p className="text-muted-foreground">Ready for a challenge? Get a random topic and speak for one minute. You'll have 60 seconds to think before you start.</p>
                <Button onClick={handleGetTopic} disabled={isLoading} size="lg">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Get My Topic!'}
                </Button>
            </div>
        )
    }
  }

  const renderAnalysisSection = () => {
    if (!analysisResult) return null;
    
    return (
      <div id="analysis-section" className="text-left max-w-2xl mx-auto mt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {viewingHistoryAnalysis ? 'Historical Analysis' : 'Speech Analysis Results'}
          </h3>
          {viewingHistoryAnalysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAnalysisResult(null);
                setViewingHistoryAnalysis(null);
              }}
            >
              Close Analysis
            </Button>
          )}
        </div>
       <div>
         <h3 className="font-semibold text-lg">Transcript (what you said)</h3>
         <p className="text-muted-foreground">{analysisResult.userResponse}</p>
       </div>
       {analysisResult.correctedText && (
         <div>
           <h3 className="font-semibold text-lg">Corrected Version</h3>
           <p>{analysisResult.correctedText}</p>
         </div>
       )}
       <div>
         <h3 className="font-semibold text-lg">Grammar</h3>
         {typeof analysisResult.grammarAccuracy === 'number' && (
           <p className="mb-2">Accuracy: {Math.round(analysisResult.grammarAccuracy)}%</p>
         )}
         {analysisResult.grammarMistakes && analysisResult.grammarMistakes.length > 0 ? (
           <ul className="list-disc pl-6 space-y-2">
             {analysisResult.grammarMistakes.map((m, i) => (
               <li key={i}>
                 <div className="font-medium">{m.mistake}</div>
                 <div className="text-sm text-muted-foreground">{m.explanation}</div>
                 <div className="text-sm">Correction: {m.correction}</div>
               </li>
             ))}
           </ul>
         ) : (
           <p className="text-muted-foreground">No grammar issues detected.</p>
         )}
       </div>
       {analysisResult.pronunciation && (
         <div>
           <h3 className="font-semibold text-lg">Pronunciation</h3>
           <p className="mb-2">Overall Accuracy: {Math.round(analysisResult.pronunciation.overallAccuracy)}%</p>
           <div className="text-sm text-muted-foreground mb-2">{analysisResult.pronunciation.suggestions}</div>
           {analysisResult.pronunciation.detailedFeedback && (
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="text-left">
                     <th className="pr-3 py-1">Word</th>
                     <th className="pr-3 py-1">Accuracy</th>
                     <th className="py-1">Feedback</th>
                   </tr>
                 </thead>
                 <tbody>
                   {analysisResult.pronunciation.detailedFeedback.map((w, i) => (
                     <tr key={i} className="border-t">
                       <td className="pr-3 py-1">{w.word}</td>
                       <td className="pr-3 py-1">{Math.round(w.pronunciationAccuracy)}%</td>
                       <td className="py-1">{w.errorDetails}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </div>
       )}
       {ttsAudioDataUri && (
         <div>
           <h3 className="font-semibold text-lg">Listen to a Correct Reading</h3>
           <audio controls src={ttsAudioDataUri} className="w-full" />
         </div>
       )}
       <div>
         <h3 className="font-semibold text-lg">Summary & Suggestions</h3>
         <div className="text-sm text-muted-foreground">{analysisResult.analysis}</div>
         {(typeof analysisResult.topicalityAdherence === 'number' || analysisResult.topicalityExplanation) && (
           <div className="mt-4">
             <h4 className="font-medium">Topicality</h4>
             {typeof analysisResult.topicalityAdherence === 'number' && (
               <p>Adherence: {Math.round(analysisResult.topicalityAdherence)}%</p>
             )}
             {analysisResult.topicalityExplanation && (
               <p className="text-sm text-muted-foreground">{analysisResult.topicalityExplanation}</p>
             )}
             {analysisResult.topicalityStrongPoints && analysisResult.topicalityStrongPoints.length > 0 && (
               <p className="text-sm">Strong Points: {analysisResult.topicalityStrongPoints.join(', ')}</p>
             )}
             {analysisResult.topicalityMissedPoints && analysisResult.topicalityMissedPoints.length > 0 && (
               <p className="text-sm">Missed Points: {analysisResult.topicalityMissedPoints.join(', ')}</p>
             )}
           </div>
         )}
       </div>
     </div>
    );
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
            <Presentation className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline tracking-tight">Impromptu Stage</h1>
          </div>
          <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Practice History
          </Button>
        </header>

        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Impromptu History</DialogTitle>
              <DialogDescription>
                Review your past impromptu speeches.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
               <Accordion type="single" collapsible className="w-full">
                {history.map(item => (
                  <AccordionItem value={item.id} key={item.id}>
                    <AccordionTrigger>
                      <span className="truncate text-left" style={{maxWidth: '250px'}}>
                        {item.topic}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 px-1">
                        <p className="text-muted-foreground">Topic: {item.topic}</p>
                        {item.recordedAudioUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => playAudio(item.recordedAudioUrl)}
                          >
                            <Mic className="mr-2 h-4 w-4" />
                            Listen to Speech
                          </Button>
                        )}
                        {item.analysisId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (item.analysisId) {
                                await loadAnalysisForHistory(item.analysisId);
                              }
                            }}
                          >
                            <BrainCircuit className="mr-2 h-4 w-4" />
                            View AI Analysis
                          </Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </DialogContent>
        </Dialog>

        <main className="max-w-4xl mx-auto mt-8">
             <Card>
                <CardHeader className="text-center">
                    <CardTitle>The Topic is...</CardTitle>
                    {topic ? (
                        <CardDescription className="text-2xl font-semibold text-primary pt-2">{topic}</CardDescription>
                    ) : (
                         <CardDescription>Click the button below to get your topic.</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="flex justify-center items-center min-h-[250px]">
                    {renderContent()}
                </CardContent>
            </Card>

            {renderAnalysisSection()}
        </main>
      </div>
    </div>
  );
}

