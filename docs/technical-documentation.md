# Technical Documentation

## Overview

This MultiTrack Audio Player is a web application built with React and Next.js that lets users upload multiple audio files, arrange them on a timeline across different tracks, and play them back synchronously. The app provides audio mixing capabilities right in the browser.

## Architecture Overview

### Core Technologies

- **Framework**: Next.js 15.5.2 with React 19.1.0
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS 4.0
- **Audio Processing**: Web Audio API for audio control
- **Drag & Drop**: @dnd-kit/core for drag-and-drop interactions
- **UI Components**: Custom components with Lucide React icons
- **State Management**: React hooks with custom state management

### Project Structure

```
src/
├── components/
│   ├── timeline/           # Timeline-specific components
│   │   ├── timeline.tsx           # Main timeline orchestrator
│   │   ├── timeline-grid.tsx      # Grid layout and drag handling
│   │   ├── timeline-track.tsx     # Individual track rendering
│   │   ├── timeline-ruler.tsx     # Time ruler with seek functionality
│   │   ├── timeline-header.tsx    # Timeline header with controls
│   │   └── audio-segment-card.tsx # Draggable audio segment pills
│   ├── library/            # Audio library components
│   ├── player.tsx          # Main player container
│   ├── playback-controls.tsx      # Play/pause/stop controls
│   └── upload-file.tsx     # File upload with drag-and-drop
├── hooks/
│   ├── useTimelineAudio.tsx       # Core audio management logic
│   ├── useMultiTrackAudio.tsx     # Legacy multi-track implementation
│   ├── useTimelineCalculations.tsx # Timeline math and conversions
│   ├── useTimelineFileUpload.tsx  # File upload coordination
│   └── useTimelineLayout.tsx      # Layout and responsive calculations
├── lib/
│   └── utils/
│       ├── audio-scheduler.ts     # Audio scheduling utilities
│       ├── overlap-detector.ts    # Collision detection system
│       └── cn.tsx                 # Class name utility
└── app/                    # Next.js app directory structure
```

## Key Design Patterns and Approaches

### 1. Custom Hooks

**Pattern**: Separation of Concerns through Custom Hooks

The app uses a custom hook system to separate business logic from UI components:

- **`useTimelineAudio`**: Core audio engine managing Web Audio API interactions
- **`useTimelineCalculations`**: Pure functions for time-to-pixel conversions and timeline math
- **`useTimelineLayout`**: Responsive layout calculations for timeline ruler and timeline strip display
- **`useTimelineFileUpload`**: File upload orchestration and validation

**Benefits**:

- Testable business logic separated from UI
- Reusable audio functionality across components
- Clean separation of concerns
- Easier maintenance and debugging

### 2. Immutable State Management

**Pattern**: Immutable State Updates with Map Data Structures

```typescript
// Example from useTimelineAudio
setState((prev) => {
  const newSegments = new Map(prev.segments);
  newSegments.set(segmentId, updatedSegment);
  return { ...prev, segments: newSegments };
});
```

**Benefits**:

- Predictable state updates
- Efficient re-renders through reference equality
- Easier debugging with state history
- Prevents accidental mutations

The same can be implemented with Immutable.js, this is a simple implementation without additional dependencies and works well for the current use-case.

### 3. Web Audio API Scheduling

**Pattern**: Precise Audio Scheduling with Context Time

```typescript
const when = segment.startTime <= currentTime ? now : now + (segment.startTime - currentTime) / playbackRate;

source.start(when, segmentOffset, remainingDuration);
```

**Benefits**:

- Sample-accurate audio synchronization
- Smooth playback across multiple audio sources
- Handles dynamic timeline changes during playback

## Key Technical Challenges and Solutions

### 1. Challenge: Synchronized Multi-Track Playback

**Problem**: Playing multiple audio files simultaneously while maintaining perfect synchronization, especially when segments start at different timeline positions.

**Solution**:

- Used Web Audio API's precise scheduling with `AudioContext.currentTime`
- Pre-calculated all segment start times relative to timeline position
- Scheduled all audio sources upfront with exact timing offsets
- Implemented dynamic rescheduling when segments are moved during playback

```typescript
// Precise scheduling calculation
const segmentOffset = Math.max(0, currentTime - segment.startTime);
const remainingDuration = segment.duration - segmentOffset;
const when = segment.startTime <= currentTime ? now : now + (segment.startTime - currentTime) / playbackRate;

source.start(when, segmentOffset, remainingDuration);
```

### 2. Challenge: Real-Time Drag and Drop with Collision Detection

**Problem**: Allowing users to drag audio segments within and between tracks while preventing overlaps and maintaining visual feedback.

**Solution**:

- Implemented a simple overlap detection function
- Used @dnd-kit for smooth drag interactions with custom collision handling
- Developed cross-track movement detection based on vertical drag distance

```typescript
// Overlap detection logic
export function hasOverlap(
  segments: Map<string, AudioSegment>,
  trackId: string,
  startTime: number,
  endTime: number,
  excludeSegmentId?: string
): boolean {
  return Array.from(segments.values()).some((existingSegment) => {
    if (existingSegment.trackId !== trackId) return false;
    if (excludeSegmentId && existingSegment.id === excludeSegmentId) return false;

    return (
      (startTime >= existingSegment.startTime && startTime < existingSegment.endTime) ||
      (endTime > existingSegment.startTime && endTime <= existingSegment.endTime) ||
      (startTime <= existingSegment.startTime && endTime >= existingSegment.endTime)
    );
  });
}
```

### 3. Challenge: Dynamic Timeline Duration Management

**Problem**: Timeline duration needs to automatically adjust as segments are added, moved, or removed, while maintaining proper scaling and visualization.

**Solution**:

- Implemented automatic duration recalculation on every segment operation
- Created responsive time-to-pixel conversion system
- Maintained consistent timeline ruler scaling across different durations
- Added buffer space for comfortable editing experience

```typescript
// Dynamic duration calculation
const recalculateTimelineDuration = (segments: Map<string, AudioSegment>) => {
  let maxEndTime = 0;
  segments.forEach((segment) => {
    maxEndTime = Math.max(maxEndTime, segment.endTime);
  });
  return Math.max(maxEndTime, MIN_TIMELINE_DURATION);
};
```

### 4. Challenge: Memory Management and Audio Resource Cleanup

**Problem**: Web Audio API creates multiple AudioBufferSourceNodes that need proper cleanup to prevent memory leaks.

**Solution**:

- Created source node lifecycle management
- Added proper event cleanup and context disposal
- Used useCallback and useEffect for optimal re-render prevention

```typescript
// Resource cleanup pattern
const cleanup = useCallback(() => {
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
  }

  state.segments.forEach((segment) => {
    if (segment.source) {
      try {
        segment.source.stop();
      } catch {
        // Ignore if already stopped
      }
    }
  });

  if (audioContextRef.current) {
    audioContextRef.current.close();
    audioContextRef.current = null;
  }
}, [state.segments]);
```

## Performance Optimizations

### 1. Audio Context Management

- Single AudioContext instance shared across the application
- Lazy initialization to avoid browser restrictions
- Proper context state management (suspended/running)

### 2. Efficient Re-rendering

- Custom hooks prevent unnecessary re-renders
- Immutable state updates for optimal React reconciliation
- Strategic use of useCallback and useMemo

### 3. Timeline Calculations

- Cached time-to-pixel conversions
- Optimized drag calculations
- Efficient segment filtering and sorting

## Testing Strategy

The codebase is structured for testability with:

- Pure functions for mathematical calculations
- Isolated custom hooks
- Mockable Web Audio API interactions
- Component separation for unit testing

## Potential Enhancements

1. **Waveform Visualization**
   - Add visual waveforms to audio segments
   - Show amplitude data for better editing precision

2. **Keyboard Shortcuts**
   - Spacebar for play/pause
   - Arrow keys for timeline navigation
   - Delete key for segment removal
   - Copy/paste functionality for segments

3. **Volume Controls**
   - Per-track volume sliders
   - Master volume control
   - Mute/solo functionality for tracks

4. **Advanced Timeline Features**
   - Zoom in/out functionality
   - Snap-to-grid for precise positioning
   - Time selection and region looping
   - Multiple timeline views (seconds, minutes, bars/beats)

5. **Audio Effects**
   - Basic EQ (high/mid/low frequency control)
   - Fade in/out effects on segments
   - Real-time audio filters using Web Audio API

6. **Export Functionality**
   - Bounce timeline to single audio file
   - Multiple export formats (WAV, MP3)
   - Export quality settings

7. **Collaborative Features**
   - Real-time collaboration with WebSockets
   - Project sharing and versioning
   - User permissions and roles

8. **Performance and Scalability**
   - Lazy loading for large audio files
   - Multi-core audio processing with Web Workers
   - Background processing for heavy operations
   - Progressive Web App (PWA) capabilities

## Why Web Audio API over HTML5 Audio?

The Web Audio API was the obvious choice here since HTML5 audio just doesn't cut it for precise multi-track synchronization.

- **Precision**: Sample-accurate timing for synchronization
- **Flexibility**: Advanced audio processing capabilities
- **Performance**: Better handling of multiple simultaneous audio sources
- **Control**: Fine-grained control over audio parameters
