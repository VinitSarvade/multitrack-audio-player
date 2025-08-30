const MIN_DISPLAY_SECONDS = 300;
const PIXELS_PER_SECOND = 4;

export function useTimelineCalculations(duration: number, effectiveContainerWidth: number) {
  const displaySeconds = Math.max(duration, MIN_DISPLAY_SECONDS);
  const contentWidth = Math.max(displaySeconds * PIXELS_PER_SECOND, effectiveContainerWidth);
  const displayDuration = contentWidth / PIXELS_PER_SECOND;

  const timeToPixels = (time: number): number => {
    return time * PIXELS_PER_SECOND;
  };

  const pixelsToTime = (pixels: number): number => {
    return pixels / PIXELS_PER_SECOND;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    displaySeconds,
    contentWidth,
    displayDuration,
    timeToPixels,
    pixelsToTime,
    formatTime,
  };
}
