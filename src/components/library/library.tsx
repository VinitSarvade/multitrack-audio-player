import UploadFile from '../upload-file';
import AudioActions from './audio-actions';

interface FilesProps {
  files: File[];
  onFileSelect: (files: File[]) => void;
}

export default function Library({ files, onFileSelect }: FilesProps) {
  if (files.length === 0) {
    return <UploadFile selectedFiles={files} onFileSelect={onFileSelect} />;
  }

  return (
    <div className="rounded-xl p-4 outline outline-accent-400">
      <h3 className="mb-2 text-lg font-semibold">Library</h3>
      <ul className="divide-y divide-divider">
        {files.map((file) => (
          <li className="group flex items-center justify-between py-2" key={file.name}>
            {file.name}

            <div className="flex gap-2">
              <AudioActions file={file} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
