
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useLearningPaths } from '@/hooks/use-learning-paths';
import { useProjects } from '@/hooks/use-projects';
import { useTokenUsage } from '@/hooks/use-token-usage';
import { useUserPreferences, type OperatingSystem } from '@/hooks/use-user-preferences';
import { BookOpen, CalendarDays, CheckCircle2, CircleDot, Flame, Laptop, Loader2, LogOut, ToyBrick, User as UserIcon, Trophy, Briefcase, Star, ArrowRight, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from 'react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/use-subscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { projects } = useProjects();
    const { learningPaths } = useLearningPaths();
    const { operatingSystem, setOS, isLoading: isLoadingPreferences } = useUserPreferences();
    const { subscription, isLoading: isSubscriptionLoading, hasProAccess, isTrialActive, trialDaysRemaining } = useSubscription();

    const completedProjectsCount = useMemo(() => {
        return projects.filter(p => p.steps.every(s => s.completed)).length;
    }, [projects]);
    
    const inProgressProjectsCount = useMemo(() => {
        return projects.filter(p => p.steps.some(s => s.subTasks.some(st => st.completed)) && !p.steps.every(s => s.completed)).length;
    }, [projects]);
    
    const tasksCompletedCount = useMemo(() => {
        return projects.reduce((acc, p) => acc + p.steps.flatMap(s => s.subTasks).filter(st => st.completed).length, 0);
    }, [projects]);
    
    const createdProjectsCount = projects.length;

    const pendingProjects = useMemo(() => {
        return projects.filter(p => !p.steps.every(s => s.completed));
    }, [projects]);

    if (!user) {
        return null;
    }
    
    const stats = [
        {
            icon: <Trophy className="h-6 w-6 text-yellow-400" />,
            label: 'Completed Projects',
            value: completedProjectsCount,
            color: 'bg-yellow-400/10 border-yellow-400/20',
        },
        {
            icon: <CircleDot className="h-6 w-6 text-blue-400" />,
            label: 'In Progress',
            value: inProgressProjectsCount,
            color: 'bg-blue-400/10 border-blue-400/20',
        },
        {
            icon: <CheckCircle2 className="h-6 w-6 text-green-400" />,
            label: 'Tasks Completed',
            value: tasksCompletedCount,
            color: 'bg-green-400/10 border-green-400/20',
        },
        {
            icon: <Briefcase className="h-6 w-6 text-purple-400" />,
            label: 'Created Projects',
            value: createdProjectsCount,
            color: 'bg-purple-400/10 border-purple-400/20',
        },
    ];

    return (
        <div className="container mx-auto max-w-6xl py-12 px-4 space-y-8">
            <Card className="bg-card/50 border-border/50">
                <CardContent className="p-6 flex items-center gap-6">
                     <Avatar className="h-24 w-24 border-4 border-primary/50">
                        <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`} alt="User Avatar" />
                        <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold font-headline">{user.email?.split('@')[0]}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {isSubscriptionLoading ? (
                                <Badge variant="outline">Loading plan...</Badge>
                            ) : (
                                <>
                                    {isTrialActive ? (
                                        <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
                                            🎉 Free Trial - {trialDaysRemaining} days left
                                        </Badge>
                                    ) : (
                                        <Badge variant={hasProAccess ? 'default' : 'secondary'}>
                                            {hasProAccess ? 'Pro Plan' : 'Free Plan'}
                                        </Badge>
                                    )}
                                </>
                            )}
                             <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                <span>Member since {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric'}) : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <Button onClick={signOut} variant="destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </CardContent>
            </Card>

            {isTrialActive && !isSubscriptionLoading && (
                <Alert className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <Crown className="h-4 w-4 text-purple-400" />
                    <AlertTitle className="text-purple-300">🎉 You're on a Free Trial!</AlertTitle>
                    <AlertDescription className="text-purple-200">
                        You have {trialDaysRemaining} days left of free Pro access. Enjoy unlimited projects, learning paths, and all Pro features!
                        {trialDaysRemaining && trialDaysRemaining <= 7 && (
                            <Button asChild size="sm" className="ml-4">
                                <Link href="/pricing">Upgrade to Keep Pro</Link>
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            )}
            {!hasProAccess && !isTrialActive && !isSubscriptionLoading && (
                <Alert variant="destructive">
                    <Crown className="h-4 w-4" />
                    <AlertTitle>You are on the Free Plan</AlertTitle>
                    <AlertDescription>
                        Upgrade to Pro to unlock unlimited project and learning path generation!
                        <Button asChild size="sm" className="ml-4">
                            <Link href="/pricing">Upgrade Now</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">Overview</TabsTrigger>
                    <TabsTrigger value="projects" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">Projects</TabsTrigger>
                    <TabsTrigger value="showcases" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">Showcases</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat) => (
                            <Card key={stat.label} className={stat.color}>
                                <CardContent className="p-6 flex flex-col items-start gap-4">
                                    {stat.icon}
                                    <div>
                                        <p className="text-3xl font-bold">{stat.value}</p>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                     <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <Laptop />
                                Preferences
                            </CardTitle>
                             <CardDescription>Customize your experience to get tailored content.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-w-sm">
                                <label className="text-sm font-medium">Operating System</label>
                                {isLoadingPreferences ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Loading OS preference...</span>
                                    </div>
                                ) : (
                                    <Select onValueChange={(value) => setOS(value as OperatingSystem)} value={operatingSystem}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select OS" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Windows">Windows</SelectItem>
                                            <SelectItem value="macOS">macOS</SelectItem>
                                            <SelectItem value="Linux">Linux</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    This helps us tailor generated code and commands for you.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="projects" className="mt-6">
                    {pendingProjects.length > 0 ? (
                        <div className="space-y-4">
                            {pendingProjects.map(project => {
                                const totalSubTasks = project.steps.reduce((acc, step) => acc + (step.subTasks?.length || 0), 0);
                                const completedSubTasks = project.steps.reduce((acc, step) => acc + (step.subTasks?.filter(st => st.completed).length || 0), 0);
                                const progress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;
                                
                                return (
                                <Card key={project.id} className="group hover:border-primary/50 transition-colors">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="flex-1">
                                            <Link href={`/projects/${project.id}`}>
                                                <h3 className="font-bold group-hover:text-primary transition-colors">{project.title}</h3>
                                            </Link>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                                            <div className="mt-2 flex items-center gap-4">
                                                <Progress value={progress} className="h-2 w-full max-w-xs" />
                                                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                                            </div>
                                        </div>
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href={`/projects/${project.id}`}>
                                                <ArrowRight />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                );
                            })}
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground py-16">
                           <p>You have no pending projects.</p>
                        </div>
                    )}
                 </TabsContent>
                 <TabsContent value="showcases" className="mt-6 text-center text-muted-foreground py-16">
                    <p>(User showcases will be displayed here)</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}
