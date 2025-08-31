# MultiTrack Audio Player

A web-based audio editor that enables users to upload multiple audio files, arrange them on a timeline across multiple tracks, and play them back synchronously. Built with React, Next.js, and the Web Audio API for audio mixing capabilities in the browser.

## Features

- 🎵 **Multi-track Audio Support**: Create and manage multiple audio tracks
- 🎛️ **Timeline Editor**: Timeline with precise time rulers and visual feedback
- 🔄 **Drag & Drop**: Rearrange audio segments within and between tracks
- ▶️ **Synchronized Playback**: Sample-accurate multi-track audio synchronization
- 🚫 **Collision Detection**: Prevents overlapping audio segments with smart validation
- ⚡ **Real-time Updates**: Dynamic timeline changes immediately reflected in playback

## Demo

### [multitrack-audio-player.vercel.app](https://multitrack-audio-player.vercel.app)

> **Note:** Sample audio files can be downloaded from [sample-files](/sample-files)

## Documentation

📚 **[Technical Documentation](docs/technical-documentation.md)** - Overview of architecture, design patterns, challenges solved, and potential enhancements.

## Prerequisites

- [Bun](https://bun.sh/)

## Development

Install dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production

Run the following commands to build and start the production server:

```bash
bun run build
bun run start
```
