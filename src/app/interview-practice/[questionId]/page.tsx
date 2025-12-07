
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Wand2, Mic, Square, FileText } from 'lucide-react';
import { generateInterviewFeedback, GenerateInterviewFeedbackOutput } from '@/ai/flows/generate-interview-feedback';
import { useToast } from '@/hooks/use-toast';
import { useTokenUsage } from '@/hooks/use-token-usage';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BellCurveChart } from '@/components/charts/BellCurveChart';
import { useAuth } from '@/hooks/use-auth';
import { addOrUpdateInterviewAnswer } from '@/lib/firestore-interview-answers';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { InterviewQuestion } from '@/lib/types';
import { getInterviewQuestionById } from '@/lib/firestore-interview-questions';

export default function QuestionPracticePage() {
    const params = useParams();
    const { user } = useAuth();
    const questionId = params.questionId as string;
    const [question, setQuestion] = useState<InterviewQuestion | null>(null);
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);

    const [isGenerating, setIsGenerating] = useState(false);
    const [feedback, setFeedback] = useState<GenerateInterviewFeedbackOutput | null>(null);
    const [mode, setMode] = useState<'audio' | 'text'>('audio');
    const [textAnswer, setTextAnswer] = useState('');
    const [apiKey, setApiKey] = useState<string | null>(null);

    const { toast } = useToast();
    const { addTokens } = useTokenUsage();
    const { startRecording, stopRecording, isRecording, recordingTime, audioBlob, resetRecording } = useAudioRecorder();

    // Get API key from localStorage
    useEffect(() => {
        const GEMINI_KEY_STORAGE = 'Project Code_gemini_api_key';
        const stored = typeof window !== 'undefined' ? localStorage.getItem(GEMINI_KEY_STORAGE) : null;
        setApiKey(stored);
    }, []);

    useEffect(() => {
        if (!questionId) return;
        const fetchQuestion = async () => {
            setIsLoadingQuestion(true);
            try {
                const fetchedQuestion = await getInterviewQuestionById(questionId);
                setQuestion(fetchedQuestion);
            } catch (error) {
                console.error("Failed to fetch question", error);
                toast({
                    variant: "destructive",
                    title: "Question not found",
                    description: "This interview question could not be loaded.",
                });
            } finally {
                setIsLoadingQuestion(false);
            }
        };
        fetchQuestion();
    }, [questionId, toast]);

    const handleSubmit = async () => {
        if (!question || !user) return;
        
        // Check if API key is available
        if (!apiKey) {
            toast({
                variant: 'destructive',
                title: 'API Key Required',
                description: 'Please enter your Gemini API key in the sidebar to generate feedback.',
            });
            return;
        }
        
        let inputData;
        if (mode === 'audio') {
            if (!audioBlob) {
                toast({
                    variant: 'destructive',
                    title: 'No Audio Recorded',
                    description: 'Please record your answer before submitting.',
                });
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64Audio = reader.result as string;
                generateFeedback({ question: question.question, answerAudio: base64Audio, apiKey: apiKey });
            };
        } else {
             if (!textAnswer.trim()) {
                toast({
                    variant: 'destructive',
                    title: 'No Answer Provided',
                    description: 'Please type your answer before submitting.',
                });
                return;
            }
            generateFeedback({ question: question.question, answerText: textAnswer, apiKey: apiKey });
        }
    };

    const generateFeedback = async (payload: { question: string, answerAudio?: string, answerText?: string, apiKey?: string }) => {
        setIsGenerating(true);
        setFeedback(null);
        try {
            const result = await generateInterviewFeedback(payload);

            if (result.tokensUsed) {
                addTokens(result.tokensUsed);
            }

            setFeedback(result);

            await addOrUpdateInterviewAnswer(user!.uid, {
                questionId: question!.id,
                question: question!.question,
                answer: result.transcript,
                feedback: result,
                createdAt: Date.now(),
                transcript: result.transcript,
            });

            toast({
                title: 'Feedback Generated!',
                description: 'Your AI-powered feedback is ready and saved to your history.',
            });

        } catch (error: any) {
            console.error('Failed to generate feedback', error);
            const errorMessage = error?.message || error?.toString() || '';
            const isQuotaError = errorMessage.includes('quota') || 
                              errorMessage.includes('429') || 
                              errorMessage.includes('Too Many Requests') ||
                              errorMessage.includes('Quota exceeded');
            const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY');
            
            toast({
                variant: 'destructive',
                title: isQuotaError ? 'API Quota Exceeded' : isApiKeyError ? 'API Key Error' : 'Error Generating Feedback',
                description: isQuotaError 
                    ? "You've reached the Gemini API free tier limit. Please wait a few minutes or check your Google Cloud billing."
                    : isApiKeyError
                    ? "Please enter your Gemini API key in the sidebar or check your GEMINI_API_KEY in .env.local"
                    : 'There was a problem. Please try again.',
                duration: isQuotaError ? 10000 : 5000,
            });
        } finally {
            setIsGenerating(false);
            // Reset state after submission
            resetRecording();
            setTextAnswer('');
        }
    };
    
    if (isLoadingQuestion) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    if (!question) {
        return <div className="text-center p-8">Question not found.</div>;
    }
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const isSubmitDisabled = isGenerating || 
      (mode === 'audio' && (isRecording || !audioBlob)) || 
      (mode === 'text' && !textAnswer.trim());

    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">{question.question}</CardTitle>
                    <CardDescription className="text-lg pt-2">
                        Practice your answer by recording it or typing it out below. When you're ready, submit it for AI-powered feedback.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs value={mode} onValueChange={(value) => setMode(value as 'audio' | 'text')} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="audio"><Mic className="mr-2 h-4 w-4" /> Speak</TabsTrigger>
                            <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" /> Write</TabsTrigger>
                        </TabsList>
                        <TabsContent value="audio">
                             <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg bg-secondary/30 border mt-4">
                                {!isRecording ? (
                                    <Button onClick={startRecording} size="lg" className="h-16 w-16 rounded-full" disabled={isGenerating}>
                                        <Mic className="h-8 w-8" />
                                    </Button>
                                ) : (
                                    <Button onClick={stopRecording} variant="destructive" size="lg" className="h-16 w-16 rounded-full">
                                        <Square className="h-8 w-8" />
                                    </Button>
                                )}
                                <div className="text-2xl font-mono font-bold">
                                    {formatTime(recordingTime)}
                                </div>
                                <p className="text-muted-foreground">
                                    {isRecording ? 'Recording in progress...' : (audioBlob ? 'Ready to submit' : 'Click to start recording')}
                                </p>
                            </div>
                        </TabsContent>
                        <TabsContent value="text">
                            <Textarea
                                value={textAnswer}
                                onChange={(e) => setTextAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                rows={8}
                                className="mt-4"
                                disabled={isGenerating}
                            />
                        </TabsContent>
                    </Tabs>
                    <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Feedback...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Get Feedback
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {isGenerating && (
                <div className="text-center mt-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground mt-4">Analyzing your answer... this might take a moment.</p>
                </div>
            )}

            {feedback && (
                <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">How you did:</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(feedback.analysis).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center text-sm">
                                        <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                        <p className="text-red-400">{value.rating}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle className="font-headline text-2xl">How you compare:</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <BellCurveChart score={feedback.score} />
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                                    <Wand2 />
                                    Feedback & Transcript
                                </CardTitle>
                                <TooltipProvider>
                                    <div className="flex gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm">Original question</Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>{question.question}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TooltipProvider>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="single" collapsible className="w-full" defaultValue="feedback">
                                <AccordionItem value="feedback">
                                    <AccordionTrigger>View Detailed Feedback</AccordionTrigger>
                                    <AccordionContent className="prose dark:prose-invert max-w-none">
                                        <ReactMarkdown>{feedback.feedback}</ReactMarkdown>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="transcript">
                                    <AccordionTrigger>View Transcript</AccordionTrigger>
                                    <AccordionContent className="prose dark:prose-invert max-w-none">
                                        <p>{feedback.transcript}</p>
                                    </AccordionContent>
                                </AccordionItem>
                             </Accordion>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
