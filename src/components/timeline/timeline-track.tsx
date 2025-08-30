'use client';

import { TrashIcon } from 'lucide-react';

import { AudioSegment } from '@/hooks/useTimelineAudio';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';

import UploadFile from '../upload-file';
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

  const handleDragEnd = (event: DragEndEvent) => {
    const id = String(event.active.id);
    const seg = segments.find((s) => s.id === id);
    if (!seg) return;
    const deltaX = event.delta.x || 0;
    const newStartTime = Math.max(0, seg.startTime + deltaX / pixelsPerSecond);
    onMoveSegment(id, newStartTime);
  };

  return (
    <div className="relative border-l border-border" style={{ height: trackHeight }}>
      <div className="relative" style={{ width: totalWidth, minWidth: '100%', height: trackHeight }}>
        <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToHorizontalAxis]}>
          {/* Playhead line */}
          <div
            className="pointer-events-none absolute top-0 z-10 h-full w-px bg-playhead/50"
            style={{ left: timeToPixels(currentTime) }}
          />

          {/* Audio segments */}
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
        </DndContext>
      </div>
    </div>
  );
}
