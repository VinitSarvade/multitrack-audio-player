'use client';

import { RefObject, useRef } from 'react';

interface TimelineRulerProps {
  duration: number;
  currentTime: number;
  pixelsPerSecond: number;
  onSeek?: (time: number) => void; // TEMPORARY FOR TESTING
  externalRef?: RefObject<HTMLDivElement | null>;
  onScroll?: (left: number) => void;
  contentWidth?: number;
  // Clamp seeking to this max duration (e.g., actual audio duration)
  seekMaxDuration?: number;
  // When mode is 'embedded', the ruler renders without its own scroll container,
  // intended to be placed inside an external horizontal scroll area.
  mode?: 'self' | 'embedded';
}

export default function TimelineRuler({
  duration,
  currentTime,
  pixelsPerSecond,
  onSeek,
  externalRef,
  onScroll,
  contentWidth,
  seekMaxDuration,
  mode = 'self',
}: TimelineRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = externalRef ?? rulerRef;

  // Timeline ruler is now display-only, no seeking

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate time markers
  const generateMarkers = () => {
    const markers = [];
    const markerInterval = 30; // Every 30 seconds for 8-minute timeline

    for (let time = 0; time <= duration; time += markerInterval) {
      const x = time * pixelsPerSecond;
      const isMajor = time % 60 === 0; // Major marks every minute

      // Label alignment rules: start left-aligned, end right-aligned, others centered
      let transform = 'translateX(-50%)';
      let textAlign: React.CSSProperties['textAlign'] = 'center';
      const isStart = time === 0;
      const isEnd = Math.abs(time - duration) < 1e-6; // guard for float rounding
      if (isStart) {
        transform = 'translateX(0)';
        textAlign = 'left';
      } else if (isEnd) {
        transform = 'translateX(-100%)';
        textAlign = 'right';
      }

      markers.push(
        <div key={time} className="absolute" style={{ left: x }}>
          <div className={`w-px bg-ruler-mark ${isMajor ? 'h-4' : 'h-2'}`} />
          {isMajor && (
            <span
              className="mt-1 block text-xs text-ruler-mark"
              style={{ position: 'relative', left: 0, transform, textAlign }}
            >
              {formatTime(time)}
            </span>
          )}
        </div>
      );
    }

    return markers;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!onSeek) return;

    // In embedded mode, use the current target as the base; otherwise use the scroll container
    const baseEl = mode === 'embedded' ? (e.currentTarget as HTMLElement) : scrollContainerRef.current;
    if (!baseEl) return;

    const rect = baseEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTime = clickX / pixelsPerSecond;
    const maxSeek = seekMaxDuration ?? duration;
    const clampedTime = Math.max(0, Math.min(clickedTime, maxSeek));

    console.log(`🎯 TEMP SEEK: Clicked at ${clickX}px = ${clampedTime}s`);
    onSeek(clampedTime);
  };

  const computedWidth = Math.max(duration * pixelsPerSecond, 1280);
  const totalWidth = contentWidth ?? computedWidth; // use provided width to match tracks exactly
  const playheadPosition = currentTime * pixelsPerSecond;

  if (mode === 'embedded') {
    return (
      <div className="relative h-12 cursor-pointer" onClick={handleClick}>
        <div className="relative" style={{ width: totalWidth, minWidth: '100%' }}>
          {/* Time markers */}
          {generateMarkers()}

          {/* Playhead */}
          <div
            className="pointer-events-none absolute top-0 z-10 h-full w-px bg-playhead"
            style={{ left: playheadPosition }}
          >
            <div className="absolute -top-1 -left-1 h-3 w-3 rounded-full border border-primary bg-playhead" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="relative h-12 overflow-x-auto rounded border border-border bg-surface"
      style={{ maxWidth: '1280px', width: '100%' }}
      onScroll={(e) => onScroll?.(e.currentTarget.scrollLeft)}
    >
      {/* Scrollable ruler content */}
      <div className="relative cursor-pointer" style={{ width: totalWidth, minWidth: '100%' }} onClick={handleClick}>
        {/* Time markers */}
        {generateMarkers()}

        {/* Playhead */}
        <div
          className="pointer-events-none absolute top-0 z-10 h-full w-px bg-playhead"
          style={{ left: playheadPosition }}
        >
          {/* Playhead handle */}
          <div className="absolute -top-1 -left-1 h-3 w-3 rounded-full border border-primary bg-playhead" />
        </div>
      </div>
    </div>
  );
}
