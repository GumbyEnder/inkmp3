// Player store - React state management for the music player
// Provides current track and playback controls

import { useState, useEffect } from 'react';

export interface Track {
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
}

export const INITIAL_TRACK: Track | null = null;

// Player state - default values
const DEFAULT_STATE: { currentTrack: Track | null } = {
  currentTrack: INITIAL_TRACK,
};

// Create store instance with initial state
export const playerStore = () => ({
  currentTrack: DEFAULT_STATE.currentTrack,
});

// Convenience getter (for direct access pattern used in components)
let _currentTrack: Track | null = INITIAL_TRACK;

export function getCurrentTrack(): Track | null {
  return _currentTrack;
}

export function setCurrentTrack(track: Track | null) {
  if (!track && _currentTrack === null) return; // No-op if clearing
  
  const mtime = track ? Date.now() : undefined;
  _currentTrack = track || INITIAL_TRACK;

  // Simulate metadata loading delay (in real app, would fetch from ID3 tags)
  const loadMetadata = async () => {
    try {
      if (_currentTrack) {
        // Simulated metadata resolution
        await new Promise(resolve => setTimeout(resolve, 10));
        // In real app: fetch ID3 tags or metadata API here
      }
    } catch (err) {
      console.error('Failed to load track metadata:', err);
    }
  };

  loadMetadata();
}
