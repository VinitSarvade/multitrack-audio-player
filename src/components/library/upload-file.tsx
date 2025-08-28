import { ChangeEvent, useEffect, useRef } from 'react';
import { useDropArea } from 'react-use';
import { CloudUpload } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

interface UploadFileProps {
  selectedFiles: File[];
  onFileSelect: (files: File[]) => void;
}

export default function UploadFile({ selectedFiles, onFileSelect }: UploadFileProps) {
  const [bond, state] = useDropArea({
    onFiles: (files) => onFileSelect(files),
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && window.DataTransfer) {
      const dataTransfer = new DataTransfer();
      selectedFiles.forEach((file) => dataTransfer.items.add(file));
      inputRef.current.files = dataTransfer.files;
    }
  }, [selectedFiles]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }

    const selected = Array.from(e.target.files);

    if (selected.some((file) => !file.type.startsWith('audio/'))) {
      alert('Please select only audio files');
      return;
    }

    onFileSelect(selected);
  };

  return (
    <div
      {...bond}
      className={cn(
        'w-full h-full rounded-xl outline-dashed outline-blue-400 outline-2 relative transition-colors hover:bg-blue-400/50',
        { 'bg-gray-400/75': state.over }
      )}
    >
      <input
        ref={inputRef}
        type="file"
        data-testid="file-uploader-input"
        id="file"
        onChange={handleFileSelect}
        className="opacity-0 invisible absolute w-0 h-0"
        accept="audio/*"
        multiple={true}
      />
      <label
        htmlFor="file"
        className="text-white grid place-content-center place-items-center w-full h-full hover:cursor-pointer gap-2"
        data-testid="file-uploader-label"
      >
        <CloudUpload />
        Choose files or drop here to upload
      </label>
    </div>
  );
}
