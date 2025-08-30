'use client';

interface TimelineRulerProps {
  duration: number;
  currentTime: number;
  pixelsPerSecond: number;
  onSeek?: (time: number) => void;
  contentWidth?: number;
  seekMaxDuration?: number;
}

export default function TimelineRuler({
  duration,
  currentTime,
  pixelsPerSecond,
  onSeek,
  contentWidth,
  seekMaxDuration,
}: TimelineRulerProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateMarkers = () => {
    const markers = [];
    const markerInterval = 30;

    for (let time = 0; time <= duration; time += markerInterval) {
      const x = time * pixelsPerSecond;
      const isMajor = time % 60 === 0;

      let transform = 'translateX(-50%)';
      let textAlign: React.CSSProperties['textAlign'] = 'center';
      const isStart = time === 0;
      const isEnd = Math.abs(time - duration) < 1e-6;
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

    const baseEl = e.currentTarget as HTMLElement;
    const rect = baseEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTime = clickX / pixelsPerSecond;
    const maxSeek = seekMaxDuration ?? duration;
    const clampedTime = Math.max(0, Math.min(clickedTime, maxSeek));

    onSeek(clampedTime);
  };

  const computedWidth = Math.max(duration * pixelsPerSecond, 1280);
  const totalWidth = contentWidth ?? computedWidth;
  const playheadPosition = currentTime * pixelsPerSecond;

  return (
    <div className="relative h-12 cursor-pointer border-b border-border" onClick={handleClick}>
      <div className="relative" style={{ width: totalWidth, minWidth: '100%' }}>
        {generateMarkers()}

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
