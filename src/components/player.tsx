'use client';

import { useState } from 'react';

import Library from './library/library';

export default function Player() {
  const [libraryFiles, setLibraryFiles] = useState<File[]>([]);

  return (
    <>
      <div className="grid grid-cols-3 gap-8">
        <Library files={libraryFiles} onFileSelect={setLibraryFiles} />
        <div className="col-span-2">Player</div>
      </div>
      <div className="row-span-2 border-t-2 border-blue-400">
        <h3 className="mt-4">Tracks</h3>
      </div>
    </>
  );
}
