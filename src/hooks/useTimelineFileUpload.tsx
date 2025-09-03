import { useCallback } from 'react';

import { AudioSegment } from './useTimelineAudio';

interface UseTimelineFileUploadProps {
  segments: Record<string, AudioSegment>;
  addSegment: (trackId: string, file: File, startTime?: number) => Promise<string>;
}

export function useTimelineFileUpload({ segments, addSegment }: UseTimelineFileUploadProps) {
  const handleFileUpload = useCallback(
    async (trackId: string, files: File[]) => {
      const trackSegments = Object.values(segments).filter((segment) => segment.trackId === trackId);
      let nextStartTime = trackSegments.length > 0 ? Math.max(...trackSegments.map((s) => s.endTime)) : 0;

      const fileData: Array<{ file: File; duration: number; startTime: number }> = [];

      for (const file of files) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioContext = new AudioContextClass();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          fileData.push({
            file,
            duration: audioBuffer.duration,
            startTime: nextStartTime,
          });

          nextStartTime += audioBuffer.duration;
          audioContext.close();
        } catch (error) {
          console.error('Error decoding file:', error);
        }
      }

      for (const { file, startTime } of fileData) {
        try {
          await addSegment(trackId, file, startTime);
        } catch (error) {
          console.error('Error adding segment:', error);
        }
      }
    },
    [segments, addSegment]
  );

  return {
    handleFileUpload,
  };
}
