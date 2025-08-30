import { AudioSegment } from '@/hooks/useTimelineAudio';

export function stopAllSources(segments: Map<string, AudioSegment>): void {
  segments.forEach((segment) => {
    if (segment.source) {
      try {
        segment.source.stop();
      } catch {
        // Ignore if already stopped
      }
    }
  });
}

export function scheduleSegments(
  audioContext: AudioContext,
  masterGain: GainNode,
  segments: Map<string, AudioSegment>,
  currentTime: number,
  playbackRate: number
): Map<string, AudioSegment> {
  const newSegments = new Map(segments);
  const now = audioContext.currentTime;

  newSegments.forEach((segment, id) => {
    if (segment.buffer && segment.isLoaded) {
      const source = audioContext.createBufferSource();
      source.buffer = segment.buffer;
      source.connect(masterGain);

      try {
        source.playbackRate.value = playbackRate;
      } catch {}

      const segmentOffset = Math.max(0, currentTime - segment.startTime);
      const remainingDuration = segment.duration - segmentOffset;

      if (remainingDuration <= 0) {
        newSegments.set(id, { ...segment, source: null });
        return;
      }

      const when =
        segment.startTime <= currentTime
          ? now
          : now + (segment.startTime - currentTime) / Math.max(0.0001, playbackRate);

      try {
        source.start(when, segmentOffset, remainingDuration);
        newSegments.set(id, { ...segment, source });
      } catch (error) {
        console.error(`Failed to schedule segment ${segment.id}:`, error);
        newSegments.set(id, { ...segment, source: null });
      }
    }
  });

  return newSegments;
}

export function getActiveSegments(segments: Map<string, AudioSegment>, timePosition: number): AudioSegment[] {
  return Array.from(segments.values()).filter((segment) => {
    return segment.isLoaded && timePosition >= segment.startTime && timePosition < segment.endTime;
  });
}

export function calculateMaxDuration(segments: Map<string, AudioSegment>): number {
  let maxEndTime = 0;
  segments.forEach((seg) => {
    maxEndTime = Math.max(maxEndTime, seg.endTime);
  });
  return maxEndTime;
}
