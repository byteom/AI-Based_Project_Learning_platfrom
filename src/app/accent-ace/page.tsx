'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/card';
import { Speech, Shuffle, Presentation, Mic, Image as ImageIcon, MessageCircleQuestion, Lock, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';

const features = [
  {
    id: 'accent-ace',
    title: 'Accent Ace',
    description: 'Practice your pronunciation with AI feedback.',
    href: '/accent-ace/practice',
    icon: <Speech className="w-8 h-8 text-primary" />,
    isPremium: false,
  },
  {
    id: 'pronunciation-practice',
    title: 'Pronunciation Practice',
    description: 'Read a sentence and get feedback on your speech.',
    href: '/accent-ace/pronunciation-practice',
    icon: <MessageCircleQuestion className="w-8 h-8 text-primary" />,
    isPremium: false,
  },
  {
    id: 'sentence-scramble',
    title: 'Sentence Scramble',
    description: 'Unscramble the sentence and speak it out loud.',
    href: '/accent-ace/sentence-scramble',
    icon: <Shuffle className="w-8 h-8 text-primary" />,
    isPremium: false,
  },
  {
    id: 'impromptu-stage',
    title: 'Impromptu Stage',
    description: 'Speak on a random topic for one minute.',
    href: '/accent-ace/impromptu-stage',
    icon: <Presentation className="w-8 h-8 text-primary" />,
    isPremium: false,
  },
  {
    id: 'pitch-perfect',
    title: 'Pitch Perfect',
    description: 'Analyze your pitch and tone for emotional delivery.',
    href: '/accent-ace/pitch-perfect',
    icon: <Mic className="w-8 h-8 text-primary" />,
    isPremium: false,
  },
  {
    id: 'storyteller',
    title: 'Storyteller',
    description: 'Create a story from three random images.',
    href: '/accent-ace/storyteller',
    icon: <ImageIcon className="w-8 h-8 text-primary" />,
    isPremium: false,
  },
];

export default function AccentAceDashboardPage() {
  const { user } = useAuth();
  const { hasProAccess } = useSubscription();

  return (
    <div className="bg-background text-foreground flex flex-col items-center justify-center p-4 min-h-screen">
      <div className="text-center my-8 sm:my-12 max-w-4xl mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline tracking-tight text-primary">
          Your Personal AI Speech Coach
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mt-2">
          Welcome back! Select a tool below to start practicing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl w-full mb-12 px-4">
        {features.map((feature) => (
          <Link href={feature.href} key={feature.id} className="block group">
            <Card className="h-full border-2 border-border/50 bg-card hover:border-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-primary/20 relative">
              {feature.isPremium && !hasProAccess && (
                <div className="absolute top-2 right-2 bg-primary/20 text-primary p-1 rounded-full z-10">
                  <Lock className="w-5 h-5" />
                </div>
              )}
              {feature.isPremium && (
                <div className="absolute top-2 left-2 text-yellow-400 z-10">
                  <Star className="w-5 h-5 fill-current" />
                </div>
              )}
              <CardContent className="p-6 flex flex-col items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  {feature.icon}
                </div>
                <div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="mt-1 text-base">
                    {feature.description}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  disabled={feature.isPremium && !hasProAccess}
                >
                  Start Practice
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
