import { RefObject } from 'react';
import { TrashIcon } from 'lucide-react';

import { AudioSegment } from '@/hooks/useTimelineAudio';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';

import UploadFile from '../upload-file';
import TimelineRuler from './timeline-ruler';
import TimelineTrack from './timeline-track';

interface TimelineGridProps {
  tracks: Array<{ id: string; name?: string }>;
  segments: Map<string, AudioSegment>;
  currentTime: number;
  isPlaying: boolean;
  displayDuration: number;
  contentWidth: number;
  timeToPixels: (time: number) => number;
  pixelsToTime: (pixels: number) => number;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onFileUpload: (trackId: string, files: File[]) => void;
  onRemoveTrack: (trackId: string) => void;
  onMoveSegment: (segmentId: string, newStartTime: number) => boolean;
  onMoveSegmentToTrack: (segmentId: string, newTrackId: string, newStartTime: number) => boolean;
  onRemoveSegment: (segmentId: string) => void;
  onSeek: (time: number) => void;
  seekMaxDuration: number;
}

const PIXELS_PER_SECOND = 4;
const TRACK_HEIGHT = 80;

export default function TimelineGrid({
  tracks,
  segments,
  currentTime,
  isPlaying,
  displayDuration,
  contentWidth,
  timeToPixels,
  pixelsToTime,
  scrollContainerRef,
  onFileUpload,
  onRemoveTrack,
  onMoveSegment,
  onMoveSegmentToTrack,
  onRemoveSegment,
  onSeek,
  seekMaxDuration,
}: TimelineGridProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const segmentId = String(event.active.id);
    const segment = Array.from(segments.values()).find((s) => s.id === segmentId);
    if (!segment) return;

    const deltaX = event.delta.x || 0;
    const deltaY = event.delta.y || 0;

    const newStartTime = Math.max(0, segment.startTime + deltaX / PIXELS_PER_SECOND);

    // Check if there's significant vertical movement (cross-track drop)
    const trackMovement = Math.round(deltaY / TRACK_HEIGHT);

    if (Math.abs(trackMovement) >= 1) {
      const currentTrackIndex = tracks.findIndex((t) => t.id === segment.trackId);
      const newTrackIndex = currentTrackIndex + trackMovement;

      // Validate new track index
      if (newTrackIndex >= 0 && newTrackIndex < tracks.length) {
        const newTrackId = tracks[newTrackIndex].id;
        console.log(`Moving segment ${segmentId} from track ${segment.trackId} to track ${newTrackId}`);
        onMoveSegmentToTrack(segmentId, newTrackId, newStartTime);
        return;
      }
    }

    onMoveSegment(segmentId, newStartTime); // Fallback
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="grid grid-cols-[12rem_repeat(3,minmax(0,1fr))]">
          <div className="col-span-1 bg-surface">
            <div className="h-12 border-b border-border bg-surface-2" />
            {tracks.map((track) => {
              const trackSegments = Array.from(segments.values()).filter((s) => s.trackId === track.id);
              const hasActiveSegment = trackSegments.some(
                (segment) => currentTime >= segment.startTime && currentTime < segment.endTime
              );

              return (
                <div
                  key={`header-${track.id}`}
                  className="flex w-48 items-center justify-between border-b border-border bg-surface-2 p-3"
                  style={{ height: 80 }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-primary">{track.name || `Track ${track.id}`}</h3>
                    {isPlaying && hasActiveSegment && <div className="h-2 w-2 animate-pulse rounded-full bg-success" />}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <UploadFile
                      selectedFiles={[]}
                      onFileSelect={(files) => onFileUpload(track.id, files)}
                      title=""
                      className="rounded bg-accent px-2 py-1 text-xs hover:bg-accent-500"
                    />
                    <button
                      onClick={() => !isPlaying && tracks.length > 1 && onRemoveTrack(track.id)}
                      disabled={isPlaying || tracks.length <= 1}
                      className={`p-1 transition-colors ${
                        isPlaying || tracks.length <= 1
                          ? 'cursor-not-allowed text-secondary/50'
                          : 'text-secondary hover:text-danger-400'
                      }`}
                      aria-label={`Remove ${track.name || `Track ${track.id}`}`}
                      title={
                        isPlaying
                          ? 'Cannot delete track while audio is playing'
                          : tracks.length <= 1
                            ? 'Cannot delete the only remaining track'
                            : ''
                      }
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="col-span-3 border-b border-border">
            <div className="overflow-x-auto bg-surface" ref={scrollContainerRef}>
              <TimelineRuler
                duration={displayDuration}
                currentTime={currentTime}
                pixelsPerSecond={PIXELS_PER_SECOND}
                onSeek={onSeek}
                seekMaxDuration={seekMaxDuration}
                contentWidth={contentWidth}
              />

              <DndContext onDragEnd={handleDragEnd}>
                {tracks.map((track) => (
                  <TimelineTrack
                    key={track.id}
                    trackId={track.id}
                    trackName={track.name || `Track ${track.id}`}
                    segments={Array.from(segments.values()).filter((segment) => segment.trackId === track.id)}
                    currentTime={currentTime}
                    pixelsPerSecond={PIXELS_PER_SECOND}
                    timeToPixels={timeToPixels}
                    pixelsToTime={pixelsToTime}
                    onFileUpload={(files) => onFileUpload(track.id, files)}
                    onRemoveTrack={() => onRemoveTrack(track.id)}
                    onMoveSegment={onMoveSegment}
                    onRemoveSegment={onRemoveSegment}
                    isPlaying={isPlaying}
                    contentWidth={contentWidth}
                    renderHeader={false}
                  />
                ))}
              </DndContext>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
