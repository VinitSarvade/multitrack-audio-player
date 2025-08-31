'use client';

import { useRef, useState } from 'react';

import { cn } from '@/lib/utils/cn';

import PlaybackControls from './playback-controls';
import Timeline, { TimelineActions } from './timeline/timeline';

const generateId = () => `track_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

export default function Player() {
  const timelineRef = useRef<TimelineActions>(null);
  const [tracks, setTracks] = useState([{ id: generateId() }]);
  const [isPlaying, setIsPlaying] = useState(false);

  const addTrack = () => {
    const newId = generateId();
    setTracks([...tracks, { id: newId }]);
  };

  const removeTrack = (trackId: string) => {
    timelineRef.current?.removeTrackSegments(trackId);
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
