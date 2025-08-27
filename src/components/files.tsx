import { PlaySquareIcon } from 'lucide-react';

import UploadFile from './upload-file';

interface FilesProps {
  files: File[];
  onFileSelect: (files: File[]) => void;
}

export default function Files({ files, onFileSelect }: FilesProps) {
  if (files.length === 0) {
    return <UploadFile selectedFiles={files} onFileSelect={onFileSelect} />;
  }

  const handlePlay = (file: File) => async () => {
    const ctx = new window.AudioContext();

    const source = ctx.createBufferSource();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  };

  return (
    <div>
      <h3 className="mb-2">Uploaded Files</h3>
      <ul className="">
        {files.map((file) => (
          <li className="p-2 flex justify-between items-center outline outline-gray-400" key={file.name}>
            {file.name}
            <button onClick={handlePlay(file)}>
              <PlaySquareIcon />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
