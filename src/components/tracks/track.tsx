import { PlusIcon, TrashIcon } from 'lucide-react';

import UploadFile from '../upload-file';

export interface TrackItem {
  id: string;
  files: File[];
}

interface TrackProps {
  track: TrackItem;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, files: File[]) => void;
}

export default function Track({ track, removeTrack, updateTrack }: TrackProps) {
  return (
    <li className="flex items-center justify-between gap-4 h-28 flex-nowrap bg-gray-800 rounded-2xl p-4">
      <div className="flex items-center gap-0.5 w-full h-full">
        {track.files.map((file, idx) => (
          <div
            key={file.name + idx}
            className="flex items-center bg-gray-700 rounded-2xl p-2 text-nowrap h-20 border border-gray-600"
          >
            {file.name}
          </div>
        ))}

        {track.files.length === 0 && (
          <UploadFile selectedFiles={track.files} onFileSelect={(files) => updateTrack(track.id, files)} />
        )}
      </div>

      <div>
        {track.files.length > 0 && (
          <UploadFile
            selectedFiles={track.files}
            onFileSelect={(files) => updateTrack(track.id, [...track.files, ...files])}
            title=""
            className="w-10 h-auto p-2 outline-0"
          />
        )}

        <button
          className="flex justify-center items-center p-2 cursor-pointer transition-all active:scale-105 hover:bg-blue-400/50 w-10 rounded-xl"
          onClick={() => removeTrack(track.id)}
        >
          <TrashIcon size={20} />
        </button>
      </div>
    </li>
  );
}
