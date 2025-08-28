'use client';

import { useRef } from 'react';

import Tracks, { TracksActions } from './tracks/tracks';

export default function Player() {
  const tracksRef = useRef<TracksActions>(null);

  return (
    <div className="h-[75vh] aspect-[4/3] p-16 outline-2 outline-blue-400 grid grid-rows-3 gap-8">
      <div className="flex gap-2 justify-evenly">
        <button onClick={() => tracksRef.current?.play()}>Play</button>
        <button onClick={() => tracksRef.current?.pause()}>Pause</button>
        <button onClick={() => tracksRef.current?.stop()}>Stop</button>
        <button onClick={() => tracksRef.current?.resume()}>Resume</button>
      </div>

      <div className="row-span-2 border-t-2 pt-8 border-blue-400">
        <Tracks ref={tracksRef} />
      </div>
    </div>
  );
}
