import { useCallback, useEffect, useRef, useState } from 'react';

import { hasOverlap } from '@/lib/utils/overlap-detector';

export interface AudioSegment {
  id: string;
  file: File;
  buffer: AudioBuffer | null;
  startTime: number; // Timeline position in seconds
  duration: number; // Segment duration in seconds
  endTime: number; // startTime + duration (calculated)
  trackId: string; // Which track this belongs to
  isLoaded: boolean;
  source: AudioBufferSourceNode | null;
}

export interface TimelineState {
  currentTime: number; // Current playback position
  duration: number; // Total timeline duration
  isPlaying: boolean;
  playbackRate: number; // 1.0 = normal speed
  segments: Map<string, AudioSegment>;
}

export function useTimelineAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackStartPositionRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const playRef = useRef<() => void>(() => {});
  const isPlayingRef = useRef<boolean>(false);
  const playbackRateRef = useRef<number>(1.0);
  const durationRef = useRef<number>(0);

  const [state, setState] = useState<TimelineState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    playbackRate: 1.0,
    segments: new Map(),
  });

  // Initialize audio context
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, []);

  // Load audio file and create segment
  const addSegment = useCallback(
    async (trackId: string, file: File, startTime: number = 0): Promise<string> => {
      const audioContext = initializeAudioContext();
      const segmentId = `${trackId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const segment: AudioSegment = {
          id: segmentId,
          file,
          buffer: audioBuffer,
          startTime,
          duration: audioBuffer.duration,
          endTime: startTime + audioBuffer.duration,
          trackId,
          isLoaded: true,
          source: null,
        };

        // Check for overlaps in the same track
        if (hasOverlap(state.segments, trackId, startTime, segment.endTime, segmentId)) {
          throw new Error('Segment overlaps with existing segment in the same track');
        }

        console.log(
          `Added segment ${segmentId} (${file.name}) to track ${trackId}: ${startTime}s - ${segment.endTime}s`
        );

        setState((prev) => {
          const newSegments = new Map(prev.segments);
          newSegments.set(segmentId, segment);

          // Recalculate timeline duration
          let maxEndTime = 0;
          newSegments.forEach((seg) => {
            maxEndTime = Math.max(maxEndTime, seg.endTime);
          });

          console.log(`Timeline duration updated to ${Math.max(prev.duration, maxEndTime)}s`);

          return {
            ...prev,
            segments: newSegments,
            duration: Math.max(prev.duration, maxEndTime),
          };
        });

        return segmentId;
      } catch (error) {
        console.error('Error loading segment:', error);
        throw error;
      }
    },
    [state.segments, initializeAudioContext]
  );

  // Move segment to new timeline position
  const moveSegment = useCallback(
    (segmentId: string, newStartTime: number): boolean => {
      const segment = state.segments.get(segmentId);
      if (!segment) {
        console.error(`Cannot find segment ${segmentId} to move`);
        return false;
      }

      const newEndTime = newStartTime + segment.duration;
      console.log(`Moving segment ${segmentId} (${segment.file.name}) from ${segment.startTime}s to ${newStartTime}s`);

      // Check for overlaps in the same track (excluding self)
      if (hasOverlap(state.segments, segment.trackId, newStartTime, newEndTime, segmentId)) {
        console.log(`Cannot move segment ${segmentId} to ${newStartTime}s - would overlap`);
        return false; // Cannot move to this position
      }

      setState((prev) => {
        const newSegments = new Map(prev.segments);
        newSegments.set(segmentId, {
          ...segment,
          startTime: newStartTime,
          endTime: newEndTime,
        });

        // Recalculate timeline duration
        let maxEndTime = 0;
        newSegments.forEach((seg) => {
          maxEndTime = Math.max(maxEndTime, seg.endTime);
        });

        return {
          ...prev,
          segments: newSegments,
          duration: Math.max(prev.duration, maxEndTime),
        };
      });

      // If currently playing, reschedule playback to reflect the new segment position
      if (state.isPlaying) {
        // Defer to next tick to ensure state update has been applied
        setTimeout(() => {
          try {
            playRef.current?.();
          } catch (e) {
            console.error('Error rescheduling playback after move:', e);
          }
        }, 0);
      }

      console.log(`Successfully moved segment ${segmentId} to ${newStartTime}s - ${newEndTime}s`);
      return true;
    },
    [state.segments, state.isPlaying]
  );

  // Remove segment
  const removeSegment = useCallback(
    (segmentId: string) => {
      const segment = state.segments.get(segmentId);
      if (segment) {
        // Stop and disconnect
        if (segment.source) {
          try {
            segment.source.stop();
          } catch {
            // Ignore if already stopped
          }
        }
      }

      setState((prev) => {
        const newSegments = new Map(prev.segments);
        newSegments.delete(segmentId);

        // Recalculate timeline duration
        let maxEndTime = 0;
        newSegments.forEach((seg) => {
          maxEndTime = Math.max(maxEndTime, seg.endTime);
        });

        return {
          ...prev,
          segments: newSegments,
          duration: maxEndTime,
        };
      });
    },
    [state.segments]
  );

  // Get segments that should be playing at given time
  const getActiveSegments = useCallback(
    (timePosition: number): AudioSegment[] => {
      const allSegments = Array.from(state.segments.values());
      console.log(
        `All segments:`,
        allSegments.map((s) => ({
          id: s.id,
          file: s.file.name,
          startTime: s.startTime,
          endTime: s.endTime,
          isLoaded: s.isLoaded,
        }))
      );

      const activeSegments = allSegments.filter((segment) => {
        const isInTimeRange = timePosition >= segment.startTime && timePosition < segment.endTime;
        const shouldPlay = segment.isLoaded && isInTimeRange;

        console.log(
          `Segment ${segment.file.name}: time=${timePosition}, start=${segment.startTime}, end=${segment.endTime}, inRange=${isInTimeRange}, shouldPlay=${shouldPlay}`
        );

        return shouldPlay;
      });

      return activeSegments;
    },
    [state.segments]
  );

  // Update current time during playback
  const updateCurrentTime = useCallback(() => {
    if (!audioContextRef.current) return;

    // If not playing, don't advance but keep RAF loop minimal
    if (!isPlayingRef.current) {
      return;
    }

    const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current;
    const newCurrentTime = playbackStartPositionRef.current + elapsed * playbackRateRef.current;

    setState((prev) => ({
      ...prev,
      currentTime: Math.min(newCurrentTime, prev.duration),
    }));

    // Stop playback if we've reached the end
    if (newCurrentTime >= durationRef.current) {
      isPlayingRef.current = false;
      setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
  }, []);

  // Start timeline playback
  const play = useCallback(() => {
    const audioContext = initializeAudioContext();
    if (state.segments.size === 0) return;

    console.log(`Play called with currentTime: ${state.currentTime}s`);

    // Ensure AudioContext is running (required by browsers before audio time advances)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    const now = audioContext.currentTime;
    playbackStartTimeRef.current = now;
    playbackStartPositionRef.current = state.currentTime;

    // Sync refs immediately so first RAF uses correct values
    playbackRateRef.current = state.playbackRate;
    durationRef.current = state.duration;
    isPlayingRef.current = true;

    // If an animation loop is already running, cancel it before starting a new one
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop all existing sources
    state.segments.forEach((segment) => {
      if (segment.source) {
        try {
          segment.source.stop();
        } catch {
          // Ignore if already stopped
        }
      }
    });

    const newSegments = new Map(state.segments);

    // Schedule all segments up front, including those starting in the future
    newSegments.forEach((segment, id) => {
      if (segment.buffer && segment.isLoaded) {
        const source = audioContext.createBufferSource();
        source.buffer = segment.buffer;
        source.connect(masterGainRef.current!);
        // align playback rate with timeline
        try {
          source.playbackRate.value = state.playbackRate;
        } catch {}

        // Calculate offset and remaining duration relative to current playhead
        const segmentOffset = Math.max(0, state.currentTime - segment.startTime);
        const remainingDuration = segment.duration - segmentOffset;

        // If the segment has already completed, skip scheduling
        if (remainingDuration <= 0) {
          newSegments.set(id, { ...segment, source: null });
          return;
        }

        // Start immediately if within segment, otherwise at a future context time
        const when =
          segment.startTime <= state.currentTime
            ? now
            : now + (segment.startTime - state.currentTime) / Math.max(0.0001, state.playbackRate);

        try {
          source.start(when, segmentOffset, remainingDuration);
          console.log(
            `Scheduled segment ${segment.id} (${segment.file.name}) at t=${when}s (ctx), offset=${segmentOffset}s, duration=${remainingDuration}s`
          );
          newSegments.set(id, { ...segment, source });
        } catch (error) {
          console.error(`Failed to schedule segment ${segment.id}:`, error);
          newSegments.set(id, { ...segment, source: null });
        }
      }
    });

    setState((prev) => ({
      ...prev,
      segments: newSegments,
      isPlaying: true,
    }));

    // Mark playing true in ref (already set above; keep for clarity)
    isPlayingRef.current = true;

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
  }, [state, initializeAudioContext, updateCurrentTime]);

  // keep a ref to the latest play function for safe rescheduling from other callbacks
  playRef.current = play;

  // keep refs in sync with state
  useEffect(() => {
    isPlayingRef.current = state.isPlaying;
  }, [state.isPlaying]);

  useEffect(() => {
    playbackRateRef.current = state.playbackRate;
  }, [state.playbackRate]);

  useEffect(() => {
    durationRef.current = state.duration;
  }, [state.duration]);

  // Pause playback
  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));

    // Stop all sources
    state.segments.forEach((segment) => {
      if (segment.source) {
        try {
          segment.source.stop();
        } catch {
          // Ignore if already stopped
        }
      }
    });

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [state.segments]);

  // Stop playback and reset to beginning
  const stopPlayback = useCallback(() => {
    pause();
    setState((prev) => ({ ...prev, currentTime: 0 }));
  }, [pause]);

  // Seek to specific time position
  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, state.duration));
      console.log(`Seeking to time: ${clampedTime}s`);

      // Stop current playback first if playing
      if (state.isPlaying) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // Stop all current sources
        state.segments.forEach((segment) => {
          if (segment.source) {
            try {
              segment.source.stop();
            } catch {
              // Ignore if already stopped
            }
          }
        });
      }

      // Update the current time and stop playback
      setState((prev) => ({ ...prev, currentTime: clampedTime, isPlaying: false }));
      console.log(`Set currentTime to ${clampedTime}s and stopped playback`);
    },
    [state.duration, state.isPlaying, state.segments]
  );

  // Set segment volume
  // Per-segment volume/mute removed.

  // Cleanup
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    state.segments.forEach((segment) => {
      if (segment.source) {
        try {
          segment.source.stop();
        } catch {
          // Ignore
        }
      }
    });

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    masterGainRef.current = null;
  }, [state.segments]);

  return {
    ...state,
    addSegment,
    moveSegment,
    removeSegment,
    play,
    pause,
    stop: stopPlayback,
    seekTo,

    getActiveSegments,
    cleanup,
  };
}
