'use client';

import { useRef, useState } from 'react';

import Timeline, { TimelineActions } from './timeline/timeline';

export default function Player() {
  const timelineRef = useRef<TimelineActions>(null);
  const [tracks, setTracks] = useState([{ id: '1', name: 'Track 1' }]);

  const addTrack = () => {
    const newId = (tracks.length + 1).toString();
    setTracks([...tracks, { id: newId, name: `Track ${newId}` }]);
  };

  const removeTrack = (trackId: string) => {
    setTracks(tracks.filter((track) => track.id !== trackId));
  };

  return (
    <div className="grid aspect-[6/3] h-[75vh] max-w-[calc(100vw-8rem)] grid-rows-[auto_1fr] gap-8 p-16 outline-2 outline-accent-400">
      {/* Main Controls */}
      <div className="flex justify-evenly gap-2">
        <button
          onClick={() => timelineRef.current?.play()}
          className="rounded bg-success px-4 py-2 text-primary transition-colors hover:bg-success-600"
        >
          Play
        </button>
        <button
          onClick={() => timelineRef.current?.pause()}
          className="rounded bg-warning px-4 py-2 text-primary transition-colors hover:bg-warning-500"
        >
          Pause
        </button>
        <button
          onClick={() => timelineRef.current?.stop()}
          className="rounded bg-danger px-4 py-2 text-primary transition-colors hover:bg-danger-500"
        >
          Stop
        </button>
        <button
          onClick={addTrack}
          className="rounded bg-accent px-4 py-2 text-primary transition-colors hover:bg-accent-500"
        >
          Add Track
        </button>
      </div>

      {/* Timeline */}
      <div className="h-full border-t-2 border-accent-400 pt-8">
        <Timeline ref={timelineRef} tracks={tracks} onAddTrack={addTrack} onRemoveTrack={removeTrack} />
      </div>
    </div>
  );
}
