import { Pause, Play, Square } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

export default function PlaybackControls({ isPlaying, onPlay, onPause, onStop }: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {!isPlaying ? (
        <button
          onClick={onPlay}
          className="rounded-full bg-success p-4 text-primary transition-all hover:scale-105 hover:bg-success-600"
          aria-label="Play"
        >
          <Play size={32} fill="currentColor" />
        </button>
      ) : (
        <div className="flex gap-4">
          <button
            onClick={onPause}
            className="rounded-full bg-warning p-4 text-primary transition-all hover:scale-105 hover:bg-warning-500"
            aria-label="Pause"
          >
            <Pause size={32} fill="currentColor" />
          </button>
          <button
            onClick={onStop}
            className="rounded-full bg-danger p-4 text-primary transition-all hover:scale-105 hover:bg-danger-500"
            aria-label="Stop"
          >
            <Square size={32} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
}
