// Playlist type definitions
import type {Track} from '../services/music/api.ts';

export interface Playlist {
	playlistId: string;
	name: string;
	tracks: Track[];
}

export interface PlaylistEntry {
	playlistId: string;
}

export interface PlaylistWithEntries extends Playlist {
	entries: PlaylistEntry[];
}
