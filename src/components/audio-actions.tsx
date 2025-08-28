import { PauseIcon, PlayIcon, StopCircleIcon } from 'lucide-react';

interface AudioActionsProps {
  file: File;
  currentlyPlayingFile: string | null;
  isPlaying: boolean;
  handlePlay: (file: File) => () => Promise<void>;
  handlePause: () => void;
  handleResume: () => void;
  handleStop: () => void;
}

const getAudioButton = (clickHandler: () => void, icon: React.ReactNode) => (
  <button onClick={clickHandler} className="transition-transform active:scale-110 cursor-pointer">
    {icon}
  </button>
);

export default function AudioActions({
  file,
  currentlyPlayingFile,
  isPlaying,
  handlePlay,
  handlePause,
  handleResume,
  handleStop,
}: AudioActionsProps) {
  const stopButton = getAudioButton(handleStop, <StopCircleIcon size={20} />);
  const playButton = getAudioButton(handlePlay(file), <PlayIcon size={20} />);
  const pauseButton = getAudioButton(handlePause, <PauseIcon size={20} />);
  const resumeButton = getAudioButton(handleResume, <PlayIcon size={20} />);

  if (currentlyPlayingFile === file.name) {
    if (isPlaying) {
      return (
        <>
          {pauseButton}
          {stopButton}
        </>
      );
    }

    return (
      <>
        {resumeButton}
        {stopButton}
      </>
    );
  }

  return playButton;
}
