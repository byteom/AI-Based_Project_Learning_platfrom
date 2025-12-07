
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Lightbulb, Cpu, GraduationCap, BrainCircuit, BookOpen, PenTool, Mic, Crown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import Footer from '@/components/layout/Footer';

function HomePageClient() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Cpu className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline sm:inline-block">
            Project Code
          </span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium ml-auto">
          <Link
            href="/project-practice"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Projects
          </Link>
          <Link
            href="/learn"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Learn
          </Link>
          <Link
            href="/interview-practice"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Interview Prep
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Contact
          </Link>
          {user ? (
            <Button onClick={signOut} variant="outline">Logout</Button>
          ) : (
            <Link href="/auth">
              <Button>Login</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}


export default function WelcomePage() {
  const features = [
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: 'AI-Powered Project Generation',
      description: 'Describe any project, and our AI will generate a complete, step-by-step tutorial from scratch, tailored to your needs.',
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      title: 'Dynamic Curriculum Generation',
      description: 'Want to learn a new skill? Our AI can generate a personalized, step-by-step curriculum on any topic for you.',
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: 'AI-Powered Interview Practice',
      description: 'Practice real interview questions and get instant, AI-powered feedback on your answers and delivery.',
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      title: 'Personalized Assistance',
      description: 'Stuck on a task? Ask our integrated AI Assistant for hints, explanations, or code analysis to get you back on track.',
    },
  ];

  return (
    <div className="flex-1 bg-background text-foreground">
      <HomePageClient />
      {/* Hero Section */}
      <section className="py-20 md:py-32 text-center">
        <div className="container px-4">
          {/* 30-Day Free Trial Banner */}
          <div className="mb-8 max-w-3xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-[2px]">
              <div className="bg-background rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Limited Time Offer</p>
                      <h3 className="text-2xl md:text-3xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        <span className="text-3xl md:text-4xl">30 Days</span> Free Trial
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <p className="text-sm text-muted-foreground sm:hidden">Get full Pro access - No credit card required!</p>
                    <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all">
                      <Link href="/auth">
                        <Crown className="mr-2 h-5 w-5" />
                        Start Free Trial Now
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 hidden sm:block">
                  <strong className="font-bold text-foreground">Get full Pro access</strong> - Unlimited projects, learning paths, and all premium features. <strong className="font-bold text-foreground">No credit card required!</strong>
                </p>
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-500">
            Learn by Building
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Stop watching tutorials. Start building real-world projects and master new skills with our AI-guided, step-by-step learning paths.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/project-practice">
                <BookOpen className="mr-2 h-5 w-5" /> Explore Projects
              </Link>
            </Button>
             <Button asChild size="lg" variant="secondary">
              <Link href="/learn">
                <PenTool className="mr-2 h-5 w-5" /> Start Learning
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/interview-practice">
                <Mic className="mr-2 h-5 w-5" /> Practice Interviews
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-headline">Why Project Code?</h2>
            <p className="text-muted-foreground mt-2">The best way to learn is by doing. Here's how we help.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center bg-card/80">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="font-headline mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-headline">Get Started in 3 Easy Steps</h2>
            <p className="text-muted-foreground mt-2">Go from idea to implementation in minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative">
            {/* Dashed lines for larger screens */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px -translate-y-12">
                <svg width="100%" height="100%">
                    <line x1="15%" y1="0" x2="85%" y2="0" strokeWidth="2" strokeDasharray="8, 8" className="stroke-border" />
                </svg>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl border-4 border-background mb-4 z-10">1</div>
              <h3 className="text-xl font-headline font-semibold">Describe Your Topic</h3>
              <p className="text-muted-foreground mt-2">Tell the AI what you want to build or what you want to learn.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl border-4 border-background mb-4 z-10">2</div>
              <h3 className="text-xl font-headline font-semibold">Get Your Plan</h3>
              <p className="text-muted-foreground mt-2">Receive a detailed, structured learning path with all the steps and sub-tasks laid out.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl border-4 border-background mb-4 z-10">3</div>
              <h3 className="text-xl font-headline font-semibold">Start Your Journey</h3>
              <p className="text-muted-foreground mt-2">Follow the on-demand instructions and code snippets, learning as you build.</p>
            </div>
          </div>
        </div>
      </section>

       {/* Final CTA Section */}
       <section className="py-16 text-center border-t border-border">
          <div className="container px-4">
            <h2 className="text-4xl font-bold font-headline">Ready to Start Building?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Turn your ideas into reality and level up your skills today.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/auth">
                  Get Started For Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        <Footer />
    </div>
  );
}
