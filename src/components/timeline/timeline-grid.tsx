import { RefObject } from 'react';
import { TrashIcon } from 'lucide-react';

import { AudioSegment } from '@/hooks/useTimelineAudio';

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
  onRemoveSegment: (segmentId: string) => void;
  onSeek: (time: number) => void;
  seekMaxDuration: number;
}

const PIXELS_PER_SECOND = 4;

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
  onRemoveSegment,
  onSeek,
  seekMaxDuration,
}: TimelineGridProps) {
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

                  <div className="flex flex-shrink-0 items-center gap-1">
                    <UploadFile
                      selectedFiles={[]}
                      onFileSelect={(files) => onFileUpload(track.id, files)}
                      title=""
                      className="rounded bg-accent px-2 py-1 text-xs hover:bg-accent-500"
                    />
                    <button
                      onClick={() => onRemoveTrack(track.id)}
                      className="p-1 text-secondary transition-colors hover:text-danger-400"
                      aria-label={`Remove ${track.name || `Track ${track.id}`}`}
                    >
                      <TrashIcon size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="col-span-3 border-b border-border">
            <div className="overflow-x-auto bg-surface" ref={scrollContainerRef}>
              <TimelineRuler
                mode="embedded"
                duration={displayDuration}
                currentTime={currentTime}
                pixelsPerSecond={PIXELS_PER_SECOND}
                onSeek={onSeek}
                seekMaxDuration={seekMaxDuration}
                contentWidth={contentWidth}
              />

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
