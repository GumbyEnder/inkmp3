import type {Track} from './api.ts';

export interface HistoryEntry {
	track: Track;
	playedAt: string; // ISO timestamp of when playback started
}

export interface PersistedHistory {
	schemaVersion: number;
	entries: HistoryEntry[];
	lastUpdated: string;
}
