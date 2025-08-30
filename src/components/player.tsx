'use client';

import { useRef, useState } from 'react';

import { cn } from '@/lib/utils/cn';

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
    <div className={cn('audio-player', { playing: isPlaying })}>
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
