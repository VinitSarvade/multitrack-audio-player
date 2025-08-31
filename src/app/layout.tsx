import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

import { Toaster } from 'sonner';

import { cn } from '@/lib/utils/cn';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MultiTrack audio player',
  description:
    'A clean multi-track audio player for the browser - upload multiple files, align them on a timeline, and control playback with simple, responsive controls.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎛️</text></svg>"
        />
      </head>
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable}`,
          'grid min-h-screen place-content-center antialiased'
        )}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
