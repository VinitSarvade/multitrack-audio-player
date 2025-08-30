interface TimelineHeaderProps {
  currentTime: number;
  duration: number;
  formatTime: (seconds: number) => string;
}

export default function TimelineHeader({ currentTime, duration, formatTime }: TimelineHeaderProps) {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-secondary">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
