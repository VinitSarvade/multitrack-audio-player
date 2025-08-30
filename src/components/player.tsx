'use client';

import { useRef, useState } from 'react';

import PlaybackControls from './playback-controls';
import Timeline, { TimelineActions } from './timeline/timeline';

export default function Player() {
  const timelineRef = useRef<TimelineActions>(null);
  const [tracks, setTracks] = useState([{ id: '1', name: 'Track 1' }]);
  const [isPlaying, setIsPlaying] = useState(false);

  const addTrack = () => {
    const newId = (tracks.length + 1).toString();
    setTracks([...tracks, { id: newId, name: `Track ${newId}` }]);
  };

  const removeTrack = (trackId: string) => {
    setTracks(tracks.filter((track) => track.id !== trackId));
  };

  const handlePlay = () => {
    timelineRef.current?.play();
  };

  const handlePause = () => {
    timelineRef.current?.pause();
  };

  const handleStop = () => {
    timelineRef.current?.stop();
  };

  return (
    <div className="grid h-[40rem] w-[80rem] max-w-[calc(100vw-8rem)] grid-rows-[auto_1fr] gap-8 p-8 outline-2 outline-accent-400">
      <PlaybackControls isPlaying={isPlaying} onPlay={handlePlay} onPause={handlePause} onStop={handleStop} />

      <div className="flex flex-1 flex-col overflow-y-auto border-t-2 border-accent-400 pt-8">
        <Timeline
          ref={timelineRef}
          tracks={tracks}
          onAddTrack={addTrack}
          onRemoveTrack={removeTrack}
          onPlayingStateChange={setIsPlaying}
        />
      </div>
    </div>
  );
}
