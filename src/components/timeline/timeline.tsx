'use client';

import { RefObject, useImperativeHandle } from 'react';
import { PlusIcon } from 'lucide-react';

import { useTimelineAudio } from '@/hooks/useTimelineAudio';
import { useTimelineCalculations } from '@/hooks/useTimelineCalculations';
import { useTimelineFileUpload } from '@/hooks/useTimelineFileUpload';
import { useTimelineLayout } from '@/hooks/useTimelineLayout';

import TimelineGrid from './timeline-grid';
import TimelineHeader from './timeline-header';

export interface TimelineActions {
  play: () => void;
  pause: () => void;
  stop: () => void;
}

interface TimelineProps {
  ref: RefObject<TimelineActions | null>;
  tracks: Array<{ id: string; name?: string }>;
  onAddTrack: () => void;
  onRemoveTrack: (trackId: string) => void;
}

export default function Timeline({ ref, tracks, onAddTrack, onRemoveTrack }: TimelineProps) {
  const timeline = useTimelineAudio();
  const { scrollContainerRef, effectiveContainerWidth } = useTimelineLayout();
  const { contentWidth, displayDuration, timeToPixels, pixelsToTime, formatTime } = useTimelineCalculations(
    timeline.duration,
    effectiveContainerWidth
  );
  const { handleFileUpload } = useTimelineFileUpload({
    segments: timeline.segments,
    currentTime: timeline.currentTime,
    addSegment: timeline.addSegment,
  });

  useImperativeHandle(ref, () => ({
    play: timeline.play,
    pause: timeline.pause,
    stop: timeline.stop,
  }));

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-surface">
      <TimelineHeader currentTime={timeline.currentTime} duration={timeline.duration} formatTime={formatTime} />

      <TimelineGrid
        tracks={tracks}
        segments={timeline.segments}
        currentTime={timeline.currentTime}
        isPlaying={timeline.isPlaying}
        displayDuration={displayDuration}
        contentWidth={contentWidth}
        timeToPixels={timeToPixels}
        pixelsToTime={pixelsToTime}
        scrollContainerRef={scrollContainerRef}
        onFileUpload={handleFileUpload}
        onRemoveTrack={onRemoveTrack}
        onMoveSegment={timeline.moveSegment}
        onRemoveSegment={timeline.removeSegment}
        onSeek={timeline.seekTo}
        seekMaxDuration={timeline.duration}
      />

      <div className="border-t border-border p-4">
        <button
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-accent-400 px-4 py-2 transition-all hover:bg-accent-400/20 active:scale-105"
          onClick={onAddTrack}
        >
          <PlusIcon size={16} /> Add Track
        </button>
      </div>
    </div>
  );
}
