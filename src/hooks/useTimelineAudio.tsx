import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { produce } from 'immer';

import { hasOverlap } from '@/lib/utils/overlap-detector';

const calculateTimelineDuration = (segments: Record<string, AudioSegment>): number => {
  return Math.max(0, ...Object.values(segments).map((seg) => seg.endTime));
};

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
  segments: Record<string, AudioSegment>;
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
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const [state, setState] = useState<TimelineState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    playbackRate: 1.0,
    segments: {},
  });

  const segmentsByTrack = useMemo(() => {
    const byTrack: Record<string, AudioSegment[]> = {};
    Object.values(state.segments).forEach((segment) => {
      if (!byTrack[segment.trackId]) {
        byTrack[segment.trackId] = [];
      }
      byTrack[segment.trackId].push(segment);
    });
    return byTrack;
  }, [state.segments]);

  const sortedSegments = useMemo(() => {
    return Object.values(state.segments).sort((a, b) => a.startTime - b.startTime);
  }, [state.segments]);

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

        setState(
          produce((draft) => {
            draft.segments[segmentId] = segment;
            draft.duration = calculateTimelineDuration(draft.segments);
          })
        );

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
      const segment = state.segments[segmentId];
      if (!segment) {
        console.error(`Cannot find segment ${segmentId} to move`);
        return false;
      }

      const newEndTime = newStartTime + segment.duration;

      // Check for overlaps in the same track (excluding self)
      if (hasOverlap(state.segments, segment.trackId, newStartTime, newEndTime, segmentId)) {
        return false;
      }

      setState(
        produce((draft) => {
          draft.segments[segmentId] = {
            ...segment,
            startTime: newStartTime,
            endTime: newEndTime,
          };
          draft.duration = calculateTimelineDuration(draft.segments);
        })
      );

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

      return true;
    },
    [state.segments, state.isPlaying]
  );

  // Move segment to different track
  const moveSegmentToTrack = useCallback(
    (segmentId: string, newTrackId: string, newStartTime: number): boolean => {
      const segment = state.segments[segmentId];
      if (!segment) {
        console.error(`Cannot find segment ${segmentId} to move`);
        return false;
      }

      const newEndTime = newStartTime + segment.duration;

      // Check for overlaps in the destination track (excluding self)
      if (hasOverlap(state.segments, newTrackId, newStartTime, newEndTime, segmentId)) {
        return false;
      }

      setState(
        produce((draft) => {
          draft.segments[segmentId] = {
            ...segment,
            trackId: newTrackId,
            startTime: newStartTime,
            endTime: newEndTime,
          };
          draft.duration = calculateTimelineDuration(draft.segments);
        })
      );

      // If currently playing, reschedule playback to reflect the new segment position
      if (state.isPlaying) {
        // Defer to next tick to ensure state update has been applied
        setTimeout(() => {
          try {
            playRef.current?.();
          } catch (e) {
            console.error('Error rescheduling playback after track move:', e);
          }
        }, 0);
      }

      return true;
    },
    [state.segments, state.isPlaying]
  );

  // Remove segment
  const removeSegment = useCallback(
    (segmentId: string) => {
      const segment = state.segments[segmentId];
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

      setState(
        produce((draft) => {
          delete draft.segments[segmentId];
          draft.duration = calculateTimelineDuration(draft.segments);
        })
      );
    },
    [state.segments]
  );

  // Remove all segments belonging to a track
  const removeTrackSegments = useCallback(
    (trackId: string) => {
      console.log(`Removing all segments for track ${trackId}`);

      const trackSegments = Object.values(state.segments).filter((segment) => segment.trackId === trackId);

      trackSegments.forEach((segment) => {
        if (segment.source) {
          try {
            segment.source.stop();
          } catch {} // Ignore if already stopped
        }
      });

      setState(
        produce((draft) => {
          // Delete segments for this track
          Object.keys(draft.segments).forEach((segmentId) => {
            if (draft.segments[segmentId].trackId === trackId) {
              delete draft.segments[segmentId];
            }
          });
          draft.duration = calculateTimelineDuration(draft.segments);
        })
      );
    },
    [state.segments]
  );

  // Get segments that should be playing at given time
  const getActiveSegments = useCallback(
    (timePosition: number): AudioSegment[] => {
      const allSegments = Object.values(state.segments);

      const activeSegments = allSegments.filter((segment) => {
        const isInTimeRange = timePosition >= segment.startTime && timePosition < segment.endTime;
        const shouldPlay = segment.isLoaded && isInTimeRange;

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

    setState(
      produce((draft) => {
        draft.currentTime = Math.min(newCurrentTime, draft.duration);
      })
    );

    // Stop playback if we've reached the end
    if (newCurrentTime >= durationRef.current) {
      isPlayingRef.current = false;
      setState(
        produce((draft) => {
          draft.isPlaying = false;
          draft.currentTime = 0;
        })
      );
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
  }, []);

  // Start timeline playback
  const play = useCallback(
    (startTime?: number) => {
      const audioContext = initializeAudioContext();
      if (Object.keys(state.segments).length === 0) return;

      const playbackTime = startTime !== undefined ? startTime : state.currentTime;

      // Ensure AudioContext is running (required by browsers before audio time advances)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      const now = audioContext.currentTime;
      playbackStartTimeRef.current = now;
      playbackStartPositionRef.current = playbackTime;

      playbackRateRef.current = state.playbackRate;
      durationRef.current = state.duration;
      isPlayingRef.current = true;

      // If an animation loop is already running, cancel it before starting a new one
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop all existing sources
      activeSourcesRef.current.forEach((source) => {
        try {
          source.stop();
        } catch {} // Ignore if already stopped
      });
      activeSourcesRef.current = [];

      const newSources: AudioBufferSourceNode[] = [];

      setState(
        produce((draft) => {
          // Schedule all segments up front, including those starting in the future
          Object.entries(draft.segments).forEach(([id, segment]) => {
            if (segment.buffer && segment.isLoaded) {
              const source = audioContext.createBufferSource();
              source.buffer = segment.buffer;
              source.connect(masterGainRef.current!);

              try {
                source.playbackRate.value = state.playbackRate;
              } catch {}

              // Calculate offset and remaining duration relative to current playhead
              const segmentOffset = Math.max(0, playbackTime - segment.startTime);
              const remainingDuration = segment.duration - segmentOffset;

              // If the segment has already completed, skip scheduling
              if (remainingDuration <= 0) {
                draft.segments[id] = { ...segment, source: null };
                return;
              }

              // Start immediately if within segment, otherwise at a future context time
              const when =
                segment.startTime <= playbackTime
                  ? now
                  : now + (segment.startTime - playbackTime) / Math.max(0.0001, state.playbackRate);

              try {
                source.start(when, segmentOffset, remainingDuration);
                draft.segments[id] = { ...segment, source };
                newSources.push(source); // Track active source
              } catch (error) {
                console.error(`Failed to schedule segment ${segment.id}:`, error);
                draft.segments[id] = { ...segment, source: null };
              }
            }
          });

          draft.isPlaying = true;
          draft.currentTime = playbackTime; // Update current time if specified
        })
      );

      // Store active sources for pause/stop
      activeSourcesRef.current = newSources;

      // Mark playing true in ref (already set above; keep for clarity)
      isPlayingRef.current = true;

      // Start animation loop
      animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
    },
    [state, initializeAudioContext, updateCurrentTime]
  );

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
    // Stop all sources FIRST
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Ignore if already stopped
      }
    });
    activeSourcesRef.current = [];

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Then update state
    setState(
      produce((draft) => {
        draft.isPlaying = false;
      })
    );
  }, []);

  // Stop playback and reset to beginning
  const stopPlayback = useCallback(() => {
    pause();
    setState(
      produce((draft) => {
        draft.currentTime = 0;
      })
    );
  }, [pause]);

  // Seek to specific time position
  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, state.duration));
      const wasPlaying = state.isPlaying;

      if (state.isPlaying) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        Object.values(state.segments).forEach((segment) => {
          if (segment.source) {
            try {
              segment.source.stop();
            } catch {
              // Ignore if already stopped
            }
          }
        });
      }

      setState(
        produce((draft) => {
          draft.currentTime = clampedTime;
          draft.isPlaying = false;
        })
      );

      if (wasPlaying) {
        setTimeout(() => {
          play(clampedTime);
        }, 1); // Small delay to ensure cleanup is complete
      }
    },
    [state.duration, state.isPlaying, state.segments, play]
  );

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Ignore
      }
    });
    activeSourcesRef.current = [];

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    masterGainRef.current = null;
  }, []);

  const batchUpdateSegments = useCallback(
    (updateFn: (segments: Record<string, AudioSegment>) => Record<string, AudioSegment>) => {
      setState(
        produce((draft) => {
          draft.segments = updateFn(draft.segments);
          draft.duration = calculateTimelineDuration(draft.segments);
        })
      );
    },
    []
  );

  const addMultipleSegments = useCallback(
    async (trackId: string, files: File[], startTime: number = 0) => {
      const audioContext = initializeAudioContext();
      const decodePromises = files.map(async (file, index) => {
        try {
          const segmentId = `${trackId}-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          return {
            segmentId,
            file,
            audioBuffer,
            duration: audioBuffer.duration,
          };
        } catch (error) {
          console.error('Error loading segment:', error);
          return null;
        }
      });

      const decodedFiles = (await Promise.all(decodePromises)).filter(
        (result): result is NonNullable<typeof result> => result !== null
      );

      // Calculate all positions first (find end of existing segments on this track)
      const trackSegments = Object.values(state.segments).filter((seg) => seg.trackId === trackId);
      const trackEndTime = trackSegments.length > 0 ? Math.max(...trackSegments.map((seg) => seg.endTime)) : 0;

      const calculatedStartTime = Math.max(startTime, trackEndTime);

      // Pre-calculate all segment positions
      const segmentPositions = decodedFiles.reduce(
        (positions, { duration }, index) => {
          const segmentStartTime = index === 0 ? calculatedStartTime : positions[index - 1].endTime;

          positions.push({
            startTime: segmentStartTime,
            endTime: segmentStartTime + duration,
            duration,
          });

          return positions;
        },
        [] as Array<{ startTime: number; endTime: number; duration: number }>
      );

      // Create all segments with pre-calculated positions (parallel creation)
      const segments: Record<string, AudioSegment> = {};

      decodedFiles.forEach(({ segmentId, file, audioBuffer }, index) => {
        const position = segmentPositions[index];

        segments[segmentId] = {
          id: segmentId,
          file,
          buffer: audioBuffer,
          startTime: position.startTime,
          duration: position.duration,
          endTime: position.endTime,
          trackId,
          isLoaded: true,
          source: null,
        };
      });

      setState(
        produce((draft) => {
          Object.assign(draft.segments, segments);
          draft.duration = calculateTimelineDuration(draft.segments);
        })
      );

      return Object.keys(segments);
    },
    [initializeAudioContext, state.segments]
  );

  return {
    ...state,
    addSegment,
    addMultipleSegments,
    batchUpdateSegments,
    moveSegment,
    moveSegmentToTrack,
    removeSegment,
    removeTrackSegments,
    play,
    pause,
    stop: stopPlayback,
    seekTo,

    getActiveSegments,
    segmentsByTrack,
    sortedSegments,
    cleanup,
  };
}
