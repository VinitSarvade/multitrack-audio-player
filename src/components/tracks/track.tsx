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
    <li className="flex h-28 flex-nowrap items-center justify-between gap-4 rounded-2xl bg-surface-2 p-4">
      <div className="flex h-full w-full items-center gap-0.5">
          <div
            key={file.name + idx}
            className="flex items-center bg-gray-700 rounded-2xl p-2 text-nowrap h-20 border border-gray-600"
          >
              <span className="truncate">{file.name}</span>
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
            className="h-auto w-10 p-2 outline-0"
          />
        )}

        <button
          className="flex w-10 cursor-pointer items-center justify-center rounded-xl p-2 transition-all hover:bg-danger-400/20 active:scale-105"
          onClick={() => removeTrack(track.id)}
        >
          <TrashIcon size={20} />
        </button>
      </div>
    </li>
  );
}
