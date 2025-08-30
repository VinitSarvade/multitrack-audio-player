import { useCallback } from 'react';

import { AudioSegment } from './useTimelineAudio';

interface UseTimelineFileUploadProps {
  segments: Map<string, AudioSegment>;
  currentTime: number;
  addSegment: (trackId: string, file: File, startTime: number) => Promise<string>;
}

export function useTimelineFileUpload({ segments, currentTime, addSegment }: UseTimelineFileUploadProps) {
  const handleFileUpload = useCallback(
    async (trackId: string, files: File[]) => {
      for (const file of files) {
        try {
          const trackSegments = Array.from(segments.values()).filter((segment) => segment.trackId === trackId);

          const lastEndTime = trackSegments.length > 0 ? Math.max(...trackSegments.map((s) => s.endTime)) : currentTime;

          await addSegment(trackId, file, lastEndTime);
        } catch (error) {
          console.error('Error adding segment:', error);
          try {
            await addSegment(trackId, file, currentTime + 0.1);
          } catch (e) {
            console.error('Could not add segment:', e);
          }
        }
      }
    },
    [segments, currentTime, addSegment]
  );

  return {
    handleFileUpload,
  };
}
