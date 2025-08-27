'use client';

import { useState } from 'react';

import Files from './files';
import UploadFile from './upload-file';

export default function Player() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <>
      <div className="grid grid-cols-3 gap-8">
        <Files files={files} onFileSelect={setFiles} />
        <div className="col-span-2">Player</div>
      </div>
      <div className="row-span-2 border-t-2 border-blue-400">
        <h3 className="mt-4">Tracks</h3>
      </div>
    </>
  );
}
