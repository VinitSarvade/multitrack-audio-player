import { useCallback } from 'react';

interface UseTimelineFileUploadProps {
  addMultipleSegments: (trackId: string, files: File[], startTime?: number) => Promise<string[]>;
}

export function useTimelineFileUpload({ addMultipleSegments }: UseTimelineFileUploadProps) {
  const handleFileUpload = useCallback(
    async (trackId: string, files: File[]) => {
      if (files.length > 0) {
        try {
          await addMultipleSegments(trackId, files, 0);
        } catch (error) {
          console.error('Error adding segments:', error);
        }
      }
    },
    [addMultipleSegments]
  );

  return {
    handleFileUpload,
  };
}
