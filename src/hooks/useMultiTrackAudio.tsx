import { useRef, useState } from 'react';

export interface AudioTrack {
  id: string;
  file: File;
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  isLoaded: boolean;
}

export interface MultiTrackAudioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  tracks: Map<string, AudioTrack>;
}

export function useMultiTrackAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  const [state, setState] = useState<MultiTrackAudioState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    tracks: new Map(),
  });

  // Initialize audio context and master gain
  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  };

  // Load audio file into track
  const loadTrack = async (trackId: string, file: File): Promise<void> => {
    const audioContext = initializeAudioContext();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const track: AudioTrack = {
        id: trackId,
        file,
        buffer: audioBuffer,
        source: null,
        isLoaded: true,
      };

      setState((prev) => ({
        ...prev,
        tracks: new Map(prev.tracks.set(trackId, track)),
        duration: Math.max(prev.duration, audioBuffer.duration),
      }));
    } catch (error) {
      console.error('Error loading track:', error);
    }
  };

  // Remove track from system
  const removeTrack = (trackId: string) => {
    setState((prev) => {
      const newTracks = new Map(prev.tracks);
      const track = newTracks.get(trackId);

      if (track) {
        track.source?.stop();
      }

      newTracks.delete(trackId);

      // Recalculate duration
      let maxDuration = 0;
      newTracks.forEach((t) => {
        if (t.buffer) {
          maxDuration = Math.max(maxDuration, t.buffer.duration);
        }
      });

      return {
        ...prev,
        tracks: newTracks,
        duration: maxDuration,
      };
    });
  };

  // Cleanup unused createSources function - now handled directly in play()

  // Play all tracks synchronized
  const play = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext || state.tracks.size === 0) return;

    const now = audioContext.currentTime;
    const startOffset = state.isPaused ? pauseTimeRef.current : 0;

    // Stop any existing sources first
    state.tracks.forEach((track) => {
      if (track.source) {
        try {
          track.source.stop();
        } catch {
          // Ignore if already stopped
        }
      }
    });

    // Create new sources for all tracks
    const newTracks = new Map(state.tracks);
    newTracks.forEach((track, trackId) => {
      if (track.buffer && track.isLoaded) {
        // Create new source
        const source = audioContext.createBufferSource();
        source.buffer = track.buffer;
        source.connect(masterGainRef.current!);
        source.start(now, startOffset);

        // Update track with new source
        newTracks.set(trackId, {
          ...track,
          source,
        });
      }
    });

    setState({
      ...state,
      tracks: newTracks,
      isPlaying: true,
      isPaused: false,
    });

    startTimeRef.current = now - startOffset;
  };

  // Pause all tracks
  const pause = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext || !state.isPlaying) return;

    pauseTimeRef.current = audioContext.currentTime - startTimeRef.current;

    // Stop all sources
    state.tracks.forEach((track) => {
      if (track.source) {
        try {
          track.source.stop();
        } catch {
          // Ignore if already stopped
        }
      }
    });

    setState({
      ...state,
      isPlaying: false,
      isPaused: true,
      currentTime: pauseTimeRef.current,
    });
  };

  // Resume playback
  const resume = () => {
    if (state.isPaused) {
      play();
    }
  };

  // Stop all tracks
  const stop = () => {
    // Stop all sources
    state.tracks.forEach((track) => {
      if (track.source) {
        try {
          track.source.stop();
        } catch {
          // Ignore if already stopped
        }
      }
    });

    setState({
      ...state,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });

    startTimeRef.current = 0;
    pauseTimeRef.current = 0;
  };

  // Set track volume
  // Per-track volume/mute removed. Use master volume if needed.

  // Set master volume
  const setMasterVolume = (volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  };

  // Cleanup
  const cleanup = () => {
    state.tracks.forEach((track) => {
      track.source?.stop();
    });

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    masterGainRef.current = null;
  };

  return {
    ...state,
    loadTrack,
    removeTrack,
    play,
    pause,
    resume,
    stop,
    setMasterVolume,
    cleanup,
  };
}
