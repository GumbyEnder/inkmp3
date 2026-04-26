// Local Music Service — Stub (Phase 2 implementation)
// This file is intentionally minimal during Phase 1.
// Full scanner/indexer/metadata implementation comes in Phase 2.

import type {
	Track as UnifiedTrack,
	Artist as UnifiedArtist,
	Album as UnifiedAlbum,
	Playlist as UnifiedPlaylist,
	SearchResponse,
	SearchOptions,
	SearchResult,
	MusicService,
} from './api.ts';

/**
 * LocalMusicService — reads music files from disk and serves them to the player.
 *
 * Phase 1: stub only (returns empty results, throws on stream).
 * Phase 2: implements scanner + metadata + SQLite index.
 *
 * Architecture:
 *   - Scanner: fast-glob recursive file discovery
 *   - Parser: music-metadata reads ID3/FLAC/MP4 tags
 *   - Index: Bun.sqlite with FTS5 search
 *   - Cache: in-memory + on-disk SQLite
 */
export class LocalMusicService implements MusicService {
	private initialized = false;
	private libraryPaths: string[] = [];
	private excludePatterns: string[] = [];

	/**
	 * Initialize the service — called once at startup.
	 * Reads config for library paths and exclude patterns.
	 * Does NOT scan yet (that's a separate async init step).
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return;

		// Phase 2: load config, create DB, spawn initial scan
		// For now: just mark initialized
		this.initialized = true;
	}

	// ─── Search ────────────────────────────────────────────────────────────

	/**
	 * Phase 1 stub: returns empty results.
	 * Phase 2: queries FTS5 virtual table in SQLite index.
	 */
	async search(
		query: string,
		options?: SearchOptions,
	): Promise<SearchResponse> {
		// Stub: return empty set
		return {
			results: [],
			hasMore: false,
		};
	}

	// ─── Get Track ─────────────────────────────────────────────────────────

	/**
	 * Phase 1 stub: attempts to stat file and read basic metadata (non-indexed).
	 * Phase 2: looks up in SQLite index by filePath.
	 */
	async getTrack(id: string): Promise<Track | null> {
		// id = absolute file path for local tracks
		// Phase 1: if file exists, return minimal Track (no metadata)
		try {
			const {stat} = await import('node:fs/promises');
			const {default: path} = await import('node:path');

			const resolved = path.resolve(id);
			const stats = await stat(resolved);
			if (!stats.isFile()) {
				return null;
			}

			// Parse filename for title (fallback when no tags)
			const basename = path.basename(resolved, path.extname(resolved));

			return {
				id: resolved,
				title: basename,
				artists: [],
				duration: 0, // unknown without metadata reader
				source: 'local',
				filePath: resolved,
			};
		} catch {
			return null;
		}
	}

	// ─── Get Suggestions ───────────────────────────────────────────────────

	/**
	 * Phase 1 stub: returns empty array.
	 * Phase 2: looks up tracks from same artist/album/directory.
	 */
	async getSuggestions(
		trackId: string,
		limit = 20,
	): Promise<Track[]> {
		return [];
	}

	// ─── Get Album (stub) ───────────────────────────────────────────────────
	async getAlbum(albumId: string): Promise<UnifiedAlbum | null> {
		// Phase 2: implement
		return null;
	}

	// ─── Get Artist (stub) ───────────────────────────────────────────────────
	async getArtist(artistId: string): Promise<UnifiedArtist | null> {
		// Phase 2: implement
		return null;
	}

	// ─── Get Playlist (stub) ──────────────────────────────────────────────────
	async getPlaylist(playlistId: string): Promise<UnifiedPlaylist | null> {
		// Phase 2: implement (local playlists via M3U import)
		return null;
	}

	// ─── Get Stream URL ────────────────────────────────────────────────────

	/**
	 * Return a file:// URI for the given local track.
	 * This is source-agnostic — mpv accepts file paths directly.
	 *
	 * Phase 1: works for any readable file (no metadata needed).
	 * Phase 2: validates indexed file exists before returning URL.
	 */
	async getStreamUrl(track: Track): Promise<string> {
		if (track.source !== 'local') {
			throw new Error(
				`LocalMusicService.getStreamUrl: expected source='local', got '${track.source}'`,
			);
		}
		const filePath = track.filePath ?? track.id;
		if (!filePath) {
			throw new Error('Track has no filePath — cannot construct stream URL');
		}

		// Verify file exists
		try {
			const {access} = await import('node:fs/promises');
			await access(filePath);
		} catch {
			throw new Error(`File not found: ${filePath}`);
		}

		// Return file URI — mpv accepts both raw paths and file:// URIs
		// Prefer raw path (simpler, works cross-platform)
		return filePath;
	}

	// ─── Optional: Recently Added / Played ──────────────────────────────────

	async getRecentlyAdded(limit = 50): Promise<Track[]> {
		return [];
	}

	async getRecentlyPlayed(limit = 50): Promise<Track[]> {
		return [];
	}
}

// ─── Singleton ────────────────────────────────────────────────────────────

let localServiceInstance: LocalMusicService | null = null;

export function getLocalMusicService(): LocalMusicService {
	if (!localServiceInstance) {
		localServiceInstance = new LocalMusicService();
	}
	return localServiceInstance;
}
