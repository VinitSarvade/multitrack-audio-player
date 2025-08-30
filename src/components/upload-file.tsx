import { ChangeEvent, useEffect, useId, useRef } from 'react';
import { useDropArea } from 'react-use';
import { CloudUpload } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils/cn';

interface UploadFileProps {
  title?: string;
  selectedFiles: File[];
  className?: string;
  multiple?: boolean;
  onFileSelect: (files: File[]) => void;
}

export default function UploadFile({
  title = 'Choose files or drop here to upload',
  selectedFiles,
  multiple = true,
  className,
  onFileSelect,
}: UploadFileProps) {
  const [bond, state] = useDropArea({
    onFiles: (files) => onFileSelect(files),
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const id = useId();

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
      toast.error('Please select only audio files');
      return;
    }

    onFileSelect(selected);
  };

  return (
    <div
      {...bond}
      className={cn(
        'relative h-full w-full rounded-xl outline-2 outline-accent-400 transition-colors outline-dashed hover:bg-accent-400/50',
        { 'bg-surface-3/75': state.over },
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        data-testid="file-uploader-input"
        id={id}
        onChange={handleFileSelect}
        className="invisible absolute h-0 w-0 opacity-0"
        accept="audio/*"
        multiple={multiple}
      />
      <label
        htmlFor={id}
        className="grid h-full w-full place-content-center place-items-center gap-2 text-primary hover:cursor-pointer"
        data-testid="file-uploader-label"
      >
        <CloudUpload />
        {title}
      </label>
    </div>
  );
}
