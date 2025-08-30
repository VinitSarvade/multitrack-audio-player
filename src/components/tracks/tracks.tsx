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
    <div className="h-full overflow-y-auto rounded-2xl bg-surface p-4">
      <ul className="flex flex-col gap-4">
        {tracks.map((track) => (
          <Track key={track.id} track={track} removeTrack={removeTrack} updateTrack={updateTrack} />
        ))}
      </ul>

      <button
        className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl border border-accent-400 px-4 py-2 transition-all hover:bg-accent-400/20 active:scale-105"
        onClick={addTrack}
      >
        <PlusIcon size={16} /> Add Track
      </button>
    </div>
  );
}
