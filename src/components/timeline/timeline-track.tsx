'use client';

import { AudioSegment } from '@/hooks/useTimelineAudio';

import AudioSegmentCard from './audio-segment-card';

interface TimelineTrackProps {
  trackId: string;
  trackName: string;
  segments: AudioSegment[];
  currentTime: number;
  pixelsPerSecond: number;
  timeToPixels: (time: number) => number;
  pixelsToTime: (pixels: number) => number;
  onFileUpload: (files: File[]) => void;
  onRemoveTrack: () => void;
  onMoveSegment: (segmentId: string, newStartTime: number) => boolean;
  onRemoveSegment: (segmentId: string) => void;
  isPlaying: boolean;
  contentWidth: number;
  // When false, only render the right-side timeline content (no left header)
  renderHeader?: boolean;
}

export default function TimelineTrack({
  trackName,
  segments,
  currentTime,
  pixelsPerSecond,
  timeToPixels,
  pixelsToTime,
  onFileUpload,
  onRemoveTrack,
  onMoveSegment,
  onRemoveSegment,
  isPlaying,
  contentWidth,
  renderHeader = true,
}: TimelineTrackProps) {
  const trackHeight = 80;
  const totalWidth = contentWidth;

  return (
    <div className="relative border-l border-border" style={{ height: trackHeight }}>
      <div className="relative" style={{ width: totalWidth, minWidth: '100%', height: trackHeight }}>
        <div
          className="pointer-events-none absolute top-0 z-10 h-full w-px bg-playhead/50"
          style={{ left: timeToPixels(currentTime) }}
        />

        {segments.map((segment) => (
          <AudioSegmentCard
            key={segment.id}
            segment={segment}
            timeToPixels={timeToPixels}
            pixelsToTime={pixelsToTime}
            onMove={onMoveSegment}
            onRemove={onRemoveSegment}
            trackHeight={trackHeight}
          />
        ))}
      </div>
    </div>
  );
}
