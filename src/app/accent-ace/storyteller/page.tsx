'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, StopCircle, Waves, Image as ImageIcon, History, Play, Lightbulb, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { generateStoryImages } from '@/ai/flows/generate-story-images';
import { analyzeStory, type AnalyzeStoryOutput } from '@/ai/flows/analyze-story';
import { addHistoryItem, updateHistoryItem, getHistoryItems } from '@/services/storytellerHistoryService';
import type { StorytellerHistoryItem } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

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

export default function StorytellerPage() {
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

  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [history, setHistory] = useState<StorytellerHistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [timer, setTimer] = useState(120);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeStoryOutput | null>(null);

  useEffect(() => {
    if(user) loadHistory();
  }, [user]);
  
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const loadHistory = async () => {
    try {
      const items = await getHistoryItems();
      setHistory(items);
    } catch(e) {
      console.error("Failed to load history", e);
      toast({ variant: "destructive", title: "Error", description: "Failed to load practice history." });
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

  const resetState = () => {
    setImages([]);
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setCurrentHistoryId(null);
    setIsSpeaking(false);
    setAnalysis(null);
    setIsAnalyzing(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }
  
  const handleGetImages = async () => {
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
      const { images: newImages } = await generateStoryImages(apiKey);
      setImages(newImages);
      addTokens(0); // Image generation tokens
      const id = await addHistoryItem({ images: newImages });
      setCurrentHistoryId(id);
      await loadHistory();
    } catch (error) {
      console.error('Error generating images:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate images. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setAnalysis(null);
    setIsAnalyzing(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setIsSpeaking(true);
      startTimer(120, stopRecording);
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      const audioChunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => audioChunks.push(event.data);
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        if(currentHistoryId) {
            await updateHistoryItem(currentHistoryId, { recordedAudioUrl: url });
            await loadHistory();
        }
        
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsSpeaking(false);
        toast({ title: "Time's up!", description: "Great story! You can listen to it or get feedback below." });
      };
      
      recorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({ variant: "destructive", title: "Microphone Error", description: "Could not access microphone." });
      setIsRecording(false);
      setIsSpeaking(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };
  
  const handleAnalyzeStory = async () => {
    if (!recordedAudio || !currentHistoryId || images.length < 3) return;
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your Gemini API key in the sidebar to use this feature.",
      });
      return;
    }
    setIsAnalyzing(true);
    setAnalysis(null);

    const reader = new FileReader();
    reader.readAsDataURL(recordedAudio);
    reader.onloadend = async () => {
      try {
        const base64Audio = reader.result as string;
        const result = await analyzeStory({
          storyAudioDataUri: base64Audio,
          imageUrls: images,
          apiKey: apiKey!,
        });
        setAnalysis(result);
        addTokens(result.tokensUsed || 0);
        
        await updateHistoryItem(currentHistoryId, { analysis: result });
        await loadHistory();
        
      } catch (error) {
        console.error('Error analyzing story:', error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'There was an error analyzing your story.',
        });
      } finally {
        setIsAnalyzing(false);
      }
    };
  };

  const playAudio = (url: string | undefined) => {
    if (url) {
      new Audio(url).play();
    }
  };
  
  const getReadableDate = (timestamp: any) => {
      if (!timestamp) return 'A while ago';
      if (typeof timestamp === 'string') return new Date(timestamp).toLocaleDateString();
      if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
      return 'Date not available';
  }

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
            <ImageIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline tracking-tight">Storyteller</h1>
          </div>
          <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Story History
          </Button>
        </header>

        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Story History</DialogTitle>
              <DialogDescription>Review your past stories.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <Accordion type="single" collapsible className="w-full">
                {history.map(item => (
                  <AccordionItem value={item.id} key={item.id}>
                    <AccordionTrigger>
                      Story from {getReadableDate(item.createdAt)}
                      {item.analysis && ` - ${item.analysis.relevanceScore}% Relevance`}
                      </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                       <div className="grid grid-cols-3 gap-2">
                          {item.images.map((img, idx) => <Image key={idx} src={img} alt={`story image ${idx+1}`} width={100} height={100} className="rounded-md" />)}
                       </div>
                      {item.recordedAudioUrl && <Button size="sm" variant="outline" onClick={() => playAudio(item.recordedAudioUrl)}><Play className="mr-2 h-4 w-4" />Listen to Story</Button>}
                      {item.analysis && <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md"><b>Feedback:</b> {item.analysis.feedback}</p>}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </DialogContent>
        </Dialog>

        <main className="max-w-5xl mx-auto mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Generate Your Prompt</CardTitle>
              <CardDescription>Get three random images to spark your creativity. You'll have two minutes to tell a story connecting them.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={handleGetImages} disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Get My Images!'}
              </Button>
            </CardContent>
          </Card>
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating your visual prompt... this can take a moment.</p>
            </div>
          )}

          {images.length > 0 && !isLoading && (
            <>
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Your Visual Prompt</CardTitle>
                <CardDescription>Use these three images to tell a story.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <Image src={img} alt={`Story prompt image ${idx+1}`} fill className="rounded-lg shadow-md object-cover" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Step 2: Tell Your Story</CardTitle>
                     <CardDescription>
                        {isSpeaking ? `Time Remaining: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : "You have 2 minutes. Start recording when you're ready."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button onClick={isRecording ? stopRecording : startRecording} size="lg" disabled={isSpeaking && !isRecording} className={`w-full sm:w-auto ${isRecording ? 'bg-destructive' : ''}`}>
                            {isRecording ? <><StopCircle className="mr-2" /> Stop</> : <><Mic className="mr-2" /> Record Story</>}
                        </Button>
                    </div>
                     {isRecording && (
                        <div className="flex items-center justify-center gap-2 text-destructive pt-2">
                            <Waves className="animate-pulse" />
                            <span>Recording...</span>
                        </div>
                    )}
                    {recordedAudioUrl && (
                      <div className="pt-4 space-y-4">
                         <h3 className="font-semibold">Listen to your masterpiece:</h3>
                        <audio controls src={recordedAudioUrl} className="max-w-full mx-auto" />
                        <Button onClick={handleAnalyzeStory} disabled={isAnalyzing || isRecording || !recordedAudio}>
                            {isAnalyzing ? <><Loader2 className="mr-2 animate-spin" />Analyzing...</> : <><Lightbulb className="mr-2" />Analyze Story</>}
                        </Button>
                      </div>
                    )}
                </CardContent>
            </Card>
           </>
          )}

          {(isAnalyzing || analysis) && (
            <Card>
              <CardHeader>
                <CardTitle>Your Story Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="flex items-center justify-center h-32"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
                ) : analysis && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">Image Relevance Score</h3>
                        <span className="text-2xl font-bold text-primary">{analysis.relevanceScore}%</span>
                      </div>
                      <Progress value={analysis.relevanceScore} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Suggested Title</h3>
                      <p className="text-muted-foreground italic">"{analysis.titleSuggestion}"</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Feedback</h3>
                      <p className="text-muted-foreground">{analysis.feedback}</p>
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

