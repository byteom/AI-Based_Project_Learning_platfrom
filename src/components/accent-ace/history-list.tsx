'use client';

import type { AccentAceHistoryItem } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Mic } from 'lucide-react';

interface HistoryListProps {
  history: AccentAceHistoryItem[];
  onSelect: (item: AccentAceHistoryItem) => void;
  playAudio: (url: string | undefined) => void;
}

export function HistoryList({ history, onSelect, playAudio }: HistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        Your practice history will appear here.
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {history.map(item => (
        <AccordionItem value={item.id} key={item.id}>
          <AccordionTrigger>
            <div className="flex items-center justify-between w-full pr-4">
              <span className="truncate text-left" style={{ maxWidth: '200px' }}>
                {item.phrase}
              </span>
              {item.analysis && (
                <Badge
                  variant={
                    item.analysis.overallAccuracy > 80
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {item.analysis.overallAccuracy}%
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 px-1">
              <p className="text-muted-foreground">{item.phrase}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => playAudio(item.referenceAudioUrl)}
                >
                  <Play className="mr-2" />
                  Reference
                </Button>
                {item.recordedAudioUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => playAudio(item.recordedAudioUrl)}
                  >
                    <Mic className="mr-2" />
                    My Recording
                  </Button>
                )}
              </div>
              <Button size="sm" onClick={() => onSelect(item)}>
                View Details
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

