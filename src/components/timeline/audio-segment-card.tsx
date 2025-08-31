'use client';

import { useEffect, useRef, useState } from 'react';
import { TrashIcon } from 'lucide-react';

import { AudioSegment } from '@/hooks/useTimelineAudio';
import { cn } from '@/lib/utils/cn';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface AudioSegmentCardProps {
  segment: AudioSegment;
  timeToPixels: (time: number) => number;
  pixelsToTime: (pixels: number) => number;
  onMove: (segmentId: string, newStartTime: number) => boolean;
  onRemove: (segmentId: string) => void;
  isActive?: boolean;
  trackHeight: number;
  isPlaying?: boolean;
}

export default function AudioSegmentCard({
  segment,
  timeToPixels,
  onRemove,
  trackHeight,
  isPlaying = false,
}: AudioSegmentCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging: dndDragging } = useDraggable({ id: segment.id });
  const translate = transform ? CSS.Transform.toString({ ...transform, y: 0 }) : undefined;
  const dragging = dndDragging || (!!transform && transform.x !== 0);

  const left = timeToPixels(segment.startTime);
  const width = timeToPixels(segment.duration);

  useEffect(() => {
    setIsDragging(dragging);
  }, [dragging]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={(el) => {
        cardRef.current = el;
        setNodeRef(el);
      }}
      className={cn(
        'group absolute top-1 cursor-move rounded-lg border-2 border-accent-400 bg-segment/50 shadow-md transition-all select-none hover:bg-segment-800/50',
        {
          'border-success-400 scale-y-110 animate-pulse bg-success/20 shadow-xl': isDragging,
        }
      )}
      style={{
        left: left,
        width: Math.max(width, 40),
        height: trackHeight - 8,
        zIndex: isDragging ? 20 : 10,
        transform: translate,
      }}
    >
      {!isDragging && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPlaying) {
              onRemove(segment.id);
            }
          }}
          disabled={isPlaying}
          className={`absolute top-1 right-1 z-20 hidden rounded p-1 transition-colors group-hover:block ${
            isPlaying ? 'cursor-not-allowed bg-danger/50 text-primary/50' : 'bg-danger text-primary hover:bg-danger-500'
          }`}
          aria-label="Delete segment"
          title={isPlaying ? 'Cannot delete segment while audio is playing' : ''}
        >
          <TrashIcon size={12} />
        </button>
      )}

      <div className="flex h-full items-center gap-2 p-2" {...attributes} {...listeners}>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-primary">{segment.file.name}</div>
          <div className="text-xs text-secondary">{formatDuration(segment.duration)}</div>
        </div>
      </div>
    </div>
  );
}
