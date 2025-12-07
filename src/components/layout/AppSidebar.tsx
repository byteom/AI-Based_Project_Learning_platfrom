
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { Book, Code, Cpu, FlaskConical, GitBranch, GraduationCap, LayoutDashboard, Settings, BotMessageSquare, ChevronDown, ToyBrick, RefreshCcw, Orbit, Laptop, LogOut, Crown, BrainCircuit, ShieldCheck } from 'lucide-react';
import { useTokenUsage } from '@/hooks/use-token-usage';
import { useProjects } from '@/hooks/use-projects';
import { Input } from '../ui/input';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences, OperatingSystem } from '@/hooks/use-user-preferences';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/hooks/use-auth';

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { tokenCount } = useTokenUsage();
  const { projects } = useProjects();
  const { toast } = useToast();
  const pathname = usePathname();
  const { operatingSystem, setOS } = useUserPreferences();
  const { isTrialActive, trialDaysRemaining } = useSubscription();

  const isAdmin = user?.profile?.roles?.includes('admin') ?? false;

  // Gemini API Key logic
  const GEMINI_KEY_STORAGE = 'Project Code_gemini_api_key';
  const [geminiKey, setGeminiKey] = React.useState<string | null>(null);
  const [inputKey, setInputKey] = React.useState('');
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(GEMINI_KEY_STORAGE) : null;
    setGeminiKey(stored);
    setShowPrompt(!stored);
    setInputKey(stored || '');
  }, []);

  const handleSaveKey = () => {
    if (inputKey.trim().length < 10) {
      toast({
        title: 'Invalid Key',
        description: 'Please paste a valid Gemini API key.',
        variant: 'destructive',
      });
      return;
    }
    localStorage.setItem(GEMINI_KEY_STORAGE, inputKey.trim());
    setGeminiKey(inputKey.trim());
    setShowPrompt(false);
    toast({
      title: 'Gemini API Key Saved',
      description: 'You can now use the platform.',
    });
  };

  const handleUpdateKey = () => {
    setShowPrompt(true);
    setInputKey(geminiKey || '');
  };

  const ongoingProjects = projects.filter(p => {
    if (!p.steps) return false;
    const allSubTasks = p.steps.flatMap(s => s.subTasks || []);
    if (allSubTasks.length === 0) return false;
    const completedCount = allSubTasks.filter(st => st && st.completed).length;
    return completedCount > 0 && completedCount < allSubTasks.length;
  });

  if (!user) {
    return null;
  }

  return (

    <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                <Cpu />
            </Button>
            <span className="font-bold font-headline text-lg">Project Code</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex flex-col p-2">
            {showPrompt && (
              <Alert className="mb-4" variant="destructive">
                <AlertTitle>{geminiKey ? 'Update your Gemini API Key' : 'Paste your Gemini API Key'}</AlertTitle>
                <AlertDescription>
                  <div className="flex flex-col gap-2 mt-2">
                    <Input
                      type="text"
                      placeholder="Enter your Gemini API Key"
                      value={inputKey}
                      onChange={e => setInputKey(e.target.value)}
                      className="text-xs"
                    />
                    <Button size="sm" onClick={handleSaveKey}>
                      {geminiKey ? 'Update Key' : 'Save Key'}
                    </Button>
                    <span className="text-xs text-muted-foreground">Use this platform</span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {!showPrompt && geminiKey && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">Key: {geminiKey.slice(0, 4)}...{geminiKey.slice(-4)}</span>
                <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6" onClick={handleUpdateKey}>
                  Update Key
                </Button>
              </div>
            )}
            <div className="flex-1">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/project-practice">
                            <SidebarMenuButton isActive={pathname.startsWith('/project-practice') || pathname.startsWith('/projects')}>
                                <LayoutDashboard />
                                Projects
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/learn">
                            <SidebarMenuButton isActive={pathname.startsWith('/learn')}>
                                <BotMessageSquare />
                                Learn Anything
                                <Badge variant="secondary" className="ml-auto">BETA</Badge>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/interview-practice">
                            <SidebarMenuButton isActive={pathname.startsWith('/interview-practice')}>
                                <BrainCircuit />
                                Interview Practice
                                 <Badge variant="secondary" className="ml-auto">NEW</Badge>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/pricing">
                            <SidebarMenuButton isActive={pathname.startsWith('/pricing')}>
                                <Crown />
                                Pricing
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     {isAdmin && (
                        <SidebarMenuItem>
                            <Link href="/admin/dashboard">
                                <SidebarMenuButton isActive={pathname.startsWith('/admin')}>
                                    <ShieldCheck />
                                    Admin Panel
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </div>

            <div className="mt-auto">
                 <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center gap-2">
                        <Laptop />
                        Preferences
                    </SidebarGroupLabel>
                    <div className="p-2 text-sm">
                        <Select onValueChange={(value) => setOS(value as OperatingSystem)} value={operatingSystem}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select OS" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Windows">Windows</SelectItem>
                                <SelectItem value="macOS">macOS</SelectItem>
                                <SelectItem value="Linux">Linux</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Usage</SidebarGroupLabel>
                    <div className="flex items-center justify-between p-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <ToyBrick className="h-4 w-4" />
                            <span>Tokens Used</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold">{tokenCount.toLocaleString()}</span>
                        </div>
                    </div>
                </SidebarGroup>
                
                {ongoingProjects.length > 0 && (
                    <SidebarGroup className="mt-2">
                        <SidebarGroupLabel>Ongoing Projects</SidebarGroupLabel>
                        <SidebarMenu>
                            {ongoingProjects.map((project) => (
                                <SidebarMenuItem key={project.id}>
                                    <Link href={`/projects/${project.id}`}>
                                        <SidebarMenuButton>
                                            <Orbit className="text-green-500"/>
                                            <span className="truncate">{project.title}</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </div>
        </SidebarContent>
        <SidebarFooter className="p-2 space-y-2">
            {isTrialActive && trialDaysRemaining && (
                <Alert className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 mb-2">
                    <Crown className="h-4 w-4 text-purple-400" />
                    <AlertTitle className="text-xs text-purple-300">🎉 Free Trial Active</AlertTitle>
                    <AlertDescription className="text-xs text-purple-200">
                        {trialDaysRemaining} days left
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors group">
              <Link href="/profile" className="flex items-center gap-3 flex-1 overflow-hidden">
                  <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`} alt="User Avatar" />
                      <AvatarFallback>{user.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold truncate">{user.email}</p>
                  </div>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 group-hover:opacity-100" onClick={signOut}>
                <LogOut />
              </Button>
            </div>
             <p className='text-xs text-center text-muted-foreground pt-2 border-t'>
                Made with ❤️ by certifyo-omsingh
            </p>
        </SidebarFooter>
    </Sidebar>
  );
}
