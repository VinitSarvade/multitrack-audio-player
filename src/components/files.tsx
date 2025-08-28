import { usePlayAudio } from '@/hooks/useAudio';

import AudioActions from './audio-actions';
import UploadFile from './upload-file';

interface FilesProps {
  files: File[];
  onFileSelect: (files: File[]) => void;
}

export default function Files({ files, onFileSelect }: FilesProps) {
  const { currentlyPlayingFile, isPlaying, handlePlay, handlePause, handleResume, handleStop } = usePlayAudio();

  if (files.length === 0) {
    return <UploadFile selectedFiles={files} onFileSelect={onFileSelect} />;
  }

  return (
    <div className="outline outline-blue-400 rounded-xl p-4">
      <h3 className="mb-2 text-lg font-semibold">Library</h3>
      <ul className="divide-y divide-gray-400">
        {files.map((file) => (
          <li className="py-2 flex justify-between items-center group" key={file.name}>
            {file.name}

            <div className="flex gap-2">
              <AudioActions
                file={file}
                currentlyPlayingFile={currentlyPlayingFile}
                isPlaying={isPlaying}
                handlePlay={handlePlay}
                handlePause={handlePause}
                handleResume={handleResume}
                handleStop={handleStop}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
