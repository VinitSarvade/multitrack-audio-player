'use client';

import { RefObject, useImperativeHandle, useState } from 'react';
import { PlusIcon } from 'lucide-react';

import { useMultiTrackAudio } from '../../hooks/useMultiTrackAudio';
import Track, { TrackItem } from './track';

export interface TracksActions {
  play: () => void;
  pause: () => void;
  stop: () => void;
  resume: () => void;
}

export default function Tracks({ ref }: { ref: RefObject<TracksActions | null> }) {
  const [tracks, setTracks] = useState<TrackItem[]>([{ id: '1', files: [] }]);
  const multiTrackAudio = useMultiTrackAudio();

  useImperativeHandle(ref, () => ({
    play: () => {
      multiTrackAudio.play();
    },
    pause: () => {
      multiTrackAudio.pause();
    },
    stop: () => {
      multiTrackAudio.stop();
    },
    resume: () => {
      multiTrackAudio.resume();
    },
  }));

  const addTrack = () => {
    setTracks([...tracks, { id: (tracks.length + 1).toString(), files: [] }]);
  };

  const removeTrack = (id: string) => {
    // Remove from audio system first
    tracks
      .find((t) => t.id === id)
      ?.files.forEach((file, idx) => {
        multiTrackAudio.removeTrack(`${id}-${idx}`);
      });

    // Remove from UI
    setTracks(tracks.filter((track) => track.id !== id));
  };

  const updateTrack = async (id: string, files: File[]) => {
    const oldTrack = tracks.find((t) => t.id === id);

    // Remove old files from audio system
    if (oldTrack) {
      oldTrack.files.forEach((file, idx) => {
        multiTrackAudio.removeTrack(`${id}-${idx}`);
      });
    }

    // Load new files into audio system
    await Promise.all(
      files.map(async (file, idx) => {
        await multiTrackAudio.loadTrack(`${id}-${idx}`, file);
      })
    );

    // Update UI state
    setTracks(tracks.map((t) => (t.id === id ? { ...t, files } : t)));
  };

  return (
    <div className="h-full overflow-y-auto rounded-2xl bg-surface p-4">
      <ul className="flex flex-col gap-4">
        {tracks.map((track) => (
          <Track
            key={track.id}
            track={track}
            removeTrack={removeTrack}
            updateTrack={updateTrack}
            audioState={multiTrackAudio}
          />
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
