
"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Trash2, Crown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTokenUsage } from "@/hooks/use-token-usage";
import { generateLearningPath } from "@/ai/flows/generate-learning-path";
import { generateLessonContent } from "@/ai/flows/generate-lesson-content";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypePrism from "rehype-prism-plus";
import CodeBlock from "@/components/projects/CodeBlock";
import type { LearningPath, LearningModule, LearningLesson } from "@/lib/types";
import { useLearningPaths } from "@/hooks/use-learning-paths";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useSubscription } from "@/hooks/use-subscription";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(2, {
    message: "Topic must be at least 2 characters.",
  }),
  difficulty: z.string({
    required_error: "Please select a difficulty level.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LearnAnythingPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { learningPaths, addLearningPath, deleteLearningPath, updateLearningPath, isLoading: isLoadingPaths } = useLearningPaths();
  const [activeLearningPath, setActiveLearningPath] = useState<LearningPath | null>(null);
  const { operatingSystem } = useUserPreferences();
  const { subscription, isLoading: isSubscriptionLoading, hasProAccess, isTrialActive, trialDaysRemaining } = useSubscription();
  const { toast } = useToast();
  const isPro = hasProAccess;
  const [apiKey, setApiKey] = useState<string | null>(null);

  const { addTokens } = useTokenUsage();

  // Get API key from localStorage
  useEffect(() => {
    const GEMINI_KEY_STORAGE = 'Project Code_gemini_api_key';
    const stored = typeof window !== 'undefined' ? localStorage.getItem(GEMINI_KEY_STORAGE) : null;
    setApiKey(stored);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "" },
  });
  
  const canGenerate = isSubscriptionLoading || hasProAccess || learningPaths.length < 3;

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!canGenerate) {
        toast({
            variant: "destructive",
            title: "Upgrade to Pro",
            description: "You have reached the limit of 3 learning paths for free users.",
        });
        return;
    }

    // Check if API key is available
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your Gemini API key in the sidebar to generate learning paths.",
      });
      return;
    }

    setIsGenerating(true);
    setActiveLearningPath(null);
    try {
      const result = await generateLearningPath({
        topic: data.topic,
        difficulty: data.difficulty,
        operatingSystem: operatingSystem,
        apiKey: apiKey, // Pass the API key from localStorage
      });

      if (result.tokensUsed) {
        addTokens(result.tokensUsed);
      }
      
      const newPath: LearningPath = {
        ...result,
        modules: result.modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => ({...lesson, content: ''}))
        }))
      };

      await addLearningPath(newPath);
      setActiveLearningPath(newPath);

      toast({
        title: "Learning Path Generated!",
        description: `Your guide to learning "${result.title}" is ready.`,
      });
      form.reset();

    } catch (error: any) {
      console.error("Failed to generate learning path:", error);
      const errorMessage = error?.message || error?.toString() || '';
      const isQuotaError = errorMessage.includes('quota') || 
                          errorMessage.includes('429') || 
                          errorMessage.includes('Too Many Requests') ||
                          errorMessage.includes('Quota exceeded');
      const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY');
      
      toast({
        variant: "destructive",
        title: isQuotaError ? "API Quota Exceeded" : isApiKeyError ? "API Key Error" : "Oh no! Something went wrong.",
        description: isQuotaError 
          ? "You've reached the Gemini API free tier limit. Please wait a few minutes or check your Google Cloud billing."
          : isApiKeyError
          ? "Please enter your Gemini API key in the sidebar or check your GEMINI_API_KEY in .env.local"
          : "There was a problem generating the learning path. Please try again.",
        duration: isQuotaError ? 10000 : 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPath = (path: LearningPath) => {
    setActiveLearningPath(path);
  }

  const handleGenerateLessonContent = useCallback(async (module: LearningModule, lesson: LearningLesson) => {
    if (!activeLearningPath || lesson.content) return;

    // Set lesson content to a loading state marker
    const updatedPathWithLoading = {
        ...activeLearningPath,
        modules: activeLearningPath.modules.map(m => 
            m.id === module.id ? {
                ...m,
                lessons: m.lessons.map(l => l.id === lesson.id ? {...l, content: 'loading...'} : l)
            } : m
        )
    };
    setActiveLearningPath(updatedPathWithLoading);

    try {
        const fullOutline = activeLearningPath.modules.map(m => 
            `## ${m.title}\n${m.lessons.map(l => `- ${l.title}`).join('\n')}`
          ).join('\n\n');

        // Check if API key is available
        if (!apiKey) {
            toast({
                variant: "destructive",
                title: "API Key Required",
                description: "Please enter your Gemini API key in the sidebar to generate lesson content.",
            });
            // Revert loading state
            const revertedPath = {
                ...activeLearningPath,
                modules: activeLearningPath.modules.map(m => 
                    m.id === module.id ? {
                        ...m,
                        lessons: m.lessons.map(l => l.id === lesson.id ? {...l, content: ''} : l)
                    } : m
                )
            };
            setActiveLearningPath(revertedPath);
            return;
        }

        const result = await generateLessonContent({
            pathTitle: activeLearningPath.title,
            moduleTitle: module.title,
            lessonTitle: lesson.title,
            fullOutline: fullOutline,
            operatingSystem: operatingSystem,
            apiKey: apiKey, // Pass the API key from localStorage
        });

        if (result.tokensUsed) {
            addTokens(result.tokensUsed);
        }

        const updatedPath = {
            ...activeLearningPath,
            modules: activeLearningPath.modules.map(m => 
                m.id === module.id ? {
                    ...m,
                    lessons: m.lessons.map(l => l.id === lesson.id ? {...l, content: result.content} : l)
                } : m
            )
        };
        
        await updateLearningPath(updatedPath);
        setActiveLearningPath(updatedPath);

    } catch (error: any) {
        console.error("Failed to generate lesson content:", error);
        const errorMessage = error?.message || error?.toString() || '';
        const isQuotaError = errorMessage.includes('quota') || 
                            errorMessage.includes('429') || 
                            errorMessage.includes('Too Many Requests') ||
                            errorMessage.includes('Quota exceeded');
        const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY');
        
        toast({
            variant: "destructive",
            title: isQuotaError ? "API Quota Exceeded" : isApiKeyError ? "API Key Error" : "Content Generation Failed",
            description: isQuotaError 
                ? "You've reached the Gemini API free tier limit. Please wait a few minutes or check your Google Cloud billing."
                : isApiKeyError
                ? "Please enter your Gemini API key in the sidebar or check your GEMINI_API_KEY in .env.local"
                : "There was a problem generating the lesson content. Please try again.",
            duration: isQuotaError ? 10000 : 5000,
        });
        // Revert loading state on error
         const revertedPath = {
            ...activeLearningPath,
            modules: activeLearningPath.modules.map(m => 
                m.id === module.id ? {
                    ...m,
                    lessons: m.lessons.map(l => l.id === lesson.id ? {...l, content: ''} : l)
                } : m
            )
        };
        setActiveLearningPath(revertedPath);
    }
  }, [activeLearningPath, updateLearningPath, addTokens, toast, operatingSystem, apiKey]);
  
  const handleDeleteLearningPath = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPro) {
      toast({
        variant: "destructive",
        title: "Pro Feature",
        description: "Only Pro users can delete learning curriculums. Upgrade to Pro to unlock this feature.",
      });
      return;
    }
    await deleteLearningPath(id);
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 space-y-4">
      {isTrialActive && trialDaysRemaining && (
        <Alert className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <Crown className="h-4 w-4 text-purple-400" />
          <AlertTitle className="text-purple-300">🎉 You're on a Free Trial!</AlertTitle>
          <AlertDescription className="text-purple-200">
            You have {trialDaysRemaining} days left of free Pro access. Enjoy unlimited learning paths!
          </AlertDescription>
        </Alert>
      )}
      <Card className="w-full">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <Bot className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Learn Anything</CardTitle>
            <CardDescription className="text-lg">
                Tell us what you want to learn, and we'll generate a personalized, step-by-step curriculum for you.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <fieldset disabled={!canGenerate} className="space-y-6 group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                            <Input
                            placeholder="e.g., 'C++', 'Python for Data Science'"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a difficulty level" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <Button type="submit" disabled={isGenerating || !canGenerate} className="w-full group-disabled:cursor-not-allowed">
                    {isGenerating ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Curriculum...
                    </>
                    ) : (
                    "Generate Learning Path"
                    )}
                </Button>
              </fieldset>
            </form>
          </Form>
          {!canGenerate && (
            <Alert className="mt-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Free Plan Limit Reached</AlertTitle>
              <AlertDescription>
                You've created {learningPaths.length}/3 free learning paths. Please <Link href="/pricing" className="font-bold text-primary hover:underline">upgrade to Pro</Link> to create more.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isGenerating && (
        <div className="text-center mt-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Building your learning path... this might take a moment.</p>
        </div>
      )}

      {activeLearningPath && (
        <div className="mt-12 space-y-8">
          <Button variant="outline" onClick={() => setActiveLearningPath(null)}>
            Back to My Curriculums
          </Button>
            <header className="text-center">
                <h2 className="text-4xl font-bold font-headline">{activeLearningPath.title}</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{activeLearningPath.introduction}</p>
            </header>

            <Accordion type="single" collapsible className="w-full space-y-4">
                {activeLearningPath.modules.map((module, moduleIndex) => (
                    <AccordionItem key={module.id} value={`module-${moduleIndex}`} className="border-b-0">
                        <Card className="bg-card/80">
                            <AccordionTrigger className="p-6 text-left hover:no-underline">
                                <div className="flex-1">
                                    <h3 className="font-headline text-2xl">{module.title}</h3>
                                    <p className="text-muted-foreground mt-1 pr-4">{module.description}</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <div className="border-t pt-4 space-y-2">
                                <Accordion type="single" collapsible className="w-full space-y-2">
                                    {module.lessons.map((lesson, lessonIndex) => (
                                        <AccordionItem key={lesson.id} value={`lesson-${lessonIndex}`} className="border-b-0">
                                            <Card className="bg-secondary/50">
                                                <AccordionTrigger
                                                    className="p-4 text-left hover:no-underline"
                                                    onClick={() => handleGenerateLessonContent(module, lesson)}
                                                >
                                                     <h4 className="font-headline text-lg text-primary">{lesson.title}</h4>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4 pb-4">
                                                    <div className="border-t pt-4">
                                                        {lesson.content === 'loading...' ? (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                <p>Generating lesson content...</p>
                                                            </div>
                                                        ) : lesson.content ? (
                                                            <div className="prose dark:prose-invert max-w-none">
                                                                <ReactMarkdown
                                                                    rehypePlugins={[rehypeRaw, [rehypePrism, { showLineNumbers: true }]]}
                                                                    components={{ pre: ({node, ...props}) => <CodeBlock {...props} /> }}
                                                                >
                                                                    {lesson.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                          <div className="text-muted-foreground text-sm">Click to load lesson content.</div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </Card>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
      )}

      {!activeLearningPath && !isGenerating && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold font-headline mb-4">My Curriculums</h2>
          {isLoadingPaths ? (
            <p className="text-muted-foreground">Loading your curriculums...</p>
          ) : learningPaths.length > 0 ? (
            <div className="space-y-4">
              {learningPaths.map(path => (
                <Card key={path.id} className="hover:bg-secondary/50 transition-colors">
                  <CardContent className="p-4 flex justify-between items-center">
                    <button onClick={() => handleSelectPath(path)} className="text-left flex-1">
                      <p className="font-bold">{path.title}</p>
                      <p className="text-sm text-muted-foreground">{path.topic} - {path.difficulty}</p>
                    </button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleDeleteLearningPath(path.id, e)} disabled={!isPro || isLoadingPaths}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">You haven't generated any learning paths yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
