'use client';

import { useRef } from 'react';

import Tracks, { TracksActions } from './tracks/tracks';

export default function Player() {
  const tracksRef = useRef<TracksActions>(null);

  return (
    <div className="grid aspect-[6/3] h-[75vh] max-w-[calc(100vw-8rem)] grid-rows-[auto_1fr] gap-8 p-16 outline-2 outline-accent-400">
      </div>

      <div className="h-full border-t-2 border-accent-400 pt-8">
      </div>
    </div>
  );
}
