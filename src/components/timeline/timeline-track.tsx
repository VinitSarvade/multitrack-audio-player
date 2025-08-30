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

  // Check if any segment in this track is currently playing
  const hasActiveSegment = segments.some(
    (segment) => currentTime >= segment.startTime && currentTime < segment.endTime
  );

  // Headerless embedded mode: only render right-side timeline content, no horizontal scroll here
  if (!renderHeader) {
    return (
      <div className="relative border-b border-border">
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

              {/* Drop zone overlay (when no segments) */}
              {segments.length === 0 && (
                <div className="absolute inset-0 m-2 flex items-center justify-center rounded-lg border-2 border-dashed border-border-muted">
                  <div className="text-center text-tertiary">
                    <p className="text-sm">Drop audio files here</p>
                    <p className="text-xs">or use the upload button</p>
                  </div>
                </div>
              )}
            </DndContext>
          </div>
        </div>
      </div>
    );
  }

  // Legacy/full mode with header (kept for compatibility)
  return (
    <div className="relative border-b border-border">
      <div className="flex">
        {/* Track Header - fixed width to match ruler alignment */}
        <div
          className="flex w-48 flex-shrink-0 items-center justify-between bg-surface-2 p-3"
          style={{ height: trackHeight }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-medium text-primary">{trackName}</h3>
            {isPlaying && hasActiveSegment && <div className="h-2 w-2 animate-pulse rounded-full bg-success" />}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            <UploadFile
              selectedFiles={[]}
              onFileSelect={onFileUpload}
              title=""
              className="rounded bg-accent px-2 py-1 text-xs hover:bg-accent-500"
            />
            <button onClick={onRemoveTrack} className="p-1 text-secondary transition-colors hover:text-danger-400">
              <TrashIcon size={12} />
            </button>
          </div>
        </div>

        {/* Track Timeline - aligned with ruler */}
        <div className="relative flex-1 border-l border-border" style={{ height: trackHeight }}>
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

              {/* Drop zone overlay (when no segments) */}
              {segments.length === 0 && (
                <div className="absolute inset-0 m-2 flex items-center justify-center rounded-lg border-2 border-dashed border-border-muted">
                  <div className="text-center text-tertiary">
                    <p className="text-sm">Drop audio files here</p>
                    <p className="text-xs">or use the upload button</p>
                  </div>
                </div>
              )}
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}
