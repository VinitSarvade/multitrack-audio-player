import { useRef, useState } from 'react';

export function usePlayAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [currentlyPlayingFile, setCurrentlyPlayingFile] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (file: File) => async () => {
    currentSourceRef.current?.stop();
    currentSourceRef.current = null;
    await audioContextRef.current?.close();

    audioContextRef.current = new window.AudioContext();
    currentSourceRef.current = audioContextRef.current.createBufferSource();

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

    currentSourceRef.current.buffer = audioBuffer;
    currentSourceRef.current.connect(audioContextRef.current.destination);

    currentSourceRef.current.onended = () => {
      currentSourceRef.current = null;
      setIsPlaying(false);
      setCurrentlyPlayingFile(null);
    };

    setIsPlaying(true);
    setCurrentlyPlayingFile(file.name);
    currentSourceRef.current.start();
  };

  const handlePause = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
      setIsPlaying(false);
    }
  };

  const handleResume = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
    setCurrentlyPlayingFile(null);
  };

  return {
    currentlyPlayingFile,
    isPlaying,
    handlePlay,
    handlePause,
    handleResume,
    handleStop,
  };
}
