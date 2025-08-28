'use client';

import { RefObject, useImperativeHandle, useState } from 'react';
import { PlusIcon } from 'lucide-react';

import Track, { TrackItem } from './track';

export interface TracksActions {
  play: () => void;
  pause: () => void;
  stop: () => void;
  resume: () => void;
}

export default function Tracks({ ref }: { ref: RefObject<TracksActions | null> }) {
  const [tracks, setTracks] = useState<TrackItem[]>([{ id: '1', files: [] }]);

  useImperativeHandle(ref, () => ({
    play: () => {
      console.log('play');
    },
    pause: () => {
      console.log('pause');
    },
    stop: () => {
      console.log('stop');
    },
    resume: () => {
      console.log('resume');
    },
  }));

  const addTrack = () => {
    setTracks([...tracks, { id: (tracks.length + 1).toString(), files: [] }]);
  };

  const removeTrack = (id: string) => {
    setTracks(tracks.filter((track) => track.id !== id));
  };

  const updateTrack = (id: string, files: File[]) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, files } : t)));
  };

  return (
    <div className="bg-black rounded-2xl h-full overflow-y-auto p-4">
      <ul className="flex flex-col gap-4">
        {tracks.map((track) => (
          <Track key={track.id} track={track} removeTrack={removeTrack} updateTrack={updateTrack} />
        ))}
      </ul>

      <button
        className="mt-4 flex items-center gap-2 border border-blue-400 rounded-xl px-4 py-2 hover:bg-blue-400/20 cursor-pointer transition-all active:scale-105"
        onClick={addTrack}
      >
        <PlusIcon size={16} /> Add Track
      </button>
    </div>
  );
}
