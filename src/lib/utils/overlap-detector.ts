import type { AudioSegment } from '@/hooks/useTimelineAudio';

export function hasOverlap(
  segments: Record<string, AudioSegment>,
  trackId: string,
  startTime: number,
  endTime: number,
  excludeSegmentId?: string
): boolean {
  return Object.values(segments).some((existingSegment) => {
    if (existingSegment.trackId !== trackId) return false;
    if (excludeSegmentId && existingSegment.id === excludeSegmentId) return false;

    return (
      (startTime >= existingSegment.startTime && startTime < existingSegment.endTime) ||
      (endTime > existingSegment.startTime && endTime <= existingSegment.endTime) ||
      (startTime <= existingSegment.startTime && endTime >= existingSegment.endTime)
    );
  });
}

export function validateSegmentPlacement(
  segments: Record<string, AudioSegment>,
  trackId: string,
  startTime: number,
  duration: number,
  excludeSegmentId?: string
): { isValid: boolean; endTime: number } {
  const endTime = startTime + duration;
  const overlap = hasOverlap(segments, trackId, startTime, endTime, excludeSegmentId);

  return {
    isValid: !overlap,
    endTime,
  };
}
