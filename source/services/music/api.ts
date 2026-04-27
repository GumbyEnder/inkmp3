// Unified MusicService Interface — dual-source abstraction layer
// This defines the contract between the UI/store and music backends
// (YouTube Music + Local MP3 library)

import type {ReactNode} from 'react';

// ─── Artist ──────────────────────────────────────────────────────────────

export interface Artist {
	/**
	 * Stable unique identifier.
	 * - YouTube: channelId
	 * - Local: derived from artist name (sanitized) or directory path
	 */
	id: string;
	name: string;
}

// ─── Album ───────────────────────────────────────────────────────────────

export interface Album {
	/**
	 * Stable unique identifier.
	 * - YouTube: albumId or browseId
	 * - Local: absolute directory path of album folder
	 */
	id: string;
	name: string;
	artists: Artist[];
	/**
	 * URL or file path to cover art image.
	 * - YouTube: https URL (thumbnail)
	 * - Local: file:// path to embedded/extracted image (optional)
	 */
	coverUrl?: string;
	year?: number;
}

// ─── Track ───────────────────────────────────────────────────────────────

/**
 * Unified track representation — works for both YouTube and local files.
 *
 * Design principle: Every field should be populated for both sources where
 * possible. The `source` field disambiguates; `id` is the primary key
 * (videoId for YouTube, absolute filePath for local).
 */
export interface Track {
	/**
	 * Primary key — unique within its source.
	 * - YouTube: YouTube video ID (11 chars)
	 * - Local: absolute filesystem path (normalized, no symlinks)
	 */
	id: string;

	title: string;
	artists: Artist[];
	album?: Album;

	/**
	 * Duration in seconds.
	 * Always present. For local files read from metadata; for YouTube from API.
	 */
	duration: number;

	/**
	 * Source of this track — determines which service produced it.
	 * Used for UI grouping, history/favorites segregation, and service routing.
	 */
	source: 'youtube' | 'local';

	// ─── Source-specific fields (exactly one set is non-undefined) ────────

	/**
	 * Present when `source === 'youtube'`.
	 * The canonical YouTube video ID (matches YouTube URLs).
	 */
	videoId?: string;

	/**
	 * Present when `source === 'local'`.
	 * Absolute file path (duplicate of `id` for local tracks).
	 */
	filePath?: string;

	/**
	 * Present when `source === 'local'`.
	 * Path to album cover image file (if extracted from tags or thumbnail).
	 * Falls back to album.coverUrl if absent.
	 */
	coverPath?: string;

	/**
	 * Optional: track number within album (if available).
	 */
	trackNumber?: number;

	/**
	 * Optional: year of release (if available).
	 */
	year?: number;

	/**
	 * Optional: genre tags (if available).
	 */
	genres?: string[];
}

// ─── SearchResult ────────────────────────────────────────────────────────

// ─── Search Supporting Types ───────────────────────────────────────────────

export type SearchDurationFilter = 'all' | 'short' | 'medium' | 'long';

export interface SearchFilters {
	artist?: string;
	album?: string;
	year?: string;
	duration?: SearchDurationFilter;
}

// ─── Search Result Types ────────────────────────────────────────────────────

export type SearchResultType = 'track' | 'album' | 'artist' | 'playlist';

export interface SearchResult {
	type: SearchResultType;
	data: Track | Album | Artist | Playlist;
}

export interface SearchResponse {
	results: SearchResult[];
	hasMore: boolean;
	continuation?: string;
}

export interface SearchOptions {
	type?: 'all' | 'tracks' | 'albums' | 'artists' | 'playlists';
	limit?: number;
	continuation?: string;
}

// ─── Genre & Release (YouTube-specific) ────────────────────────────────────

export interface Genre {
	title: string;
	browseId: string;
	params?: string;
}

export interface Release {
	title: string;
	browseId: string;
	artist: string;
	subtitle?: string;
}

// ─── Playlist ────────────────────────────────────────────────────────────

export interface Playlist {
	playlistId: string;
	name: string;
	tracks: Track[];
	/**
	 * Optional: thumbnail URL or file path.
	 */
	coverUrl?: string;
}

// ─── MusicService Interface ─────────────────────────────────────────────

/**
 * Abstract music backend — provides a unified API for audio sources.
 *
 * Implementations:
 * - YouTubeMusicService: wraps existing youtube-music API
 * - LocalMusicService: scanner + metadata + SQLite index
 *
 * Both must be singletons (one instance per runtime).
 */
export interface MusicService {
	// ─── Query ────────────────────────────────────────────────────────────

	/**
	 * Search for tracks/albums/artists.
	 * Implementation may source from YouTube search API or local FTS5 index.
	 *
	 * @param query User's search string
	 * @param options Optional filters (type, limit, continuation)
	 * @returns Paginated search results
	 */
	search(query: string, options?: SearchOptions): Promise<SearchResponse>;

	/**
	 * Get a single track by its source-specific ID.
	 *
	 * @param id videoId (YouTube) or absolute filePath (local)
	 * @returns Track if found, null otherwise
	 */
	getTrack(id: string): Promise<Track | null>;

	/**
	 * Get full album metadata + tracklist.
	 *
	 * YouTube: albumId → Album with tracks
	 * Local: directory path → Album with filesystem tracks
	 */
	getAlbum(albumId: string): Promise<Album | null>;

	/**
	 * Get artist metadata.
	 *
	 * YouTube: artistId → Artist
	 * Local: artist name → Artist (fuzzy from metadata)
	 */
	getArtist(artistId: string): Promise<Artist | null>;

	/**
	 * Get playlist by ID.
	 *
	 * YouTube: playlistId → Playlist
	 * Local: playlist name/file → Playlist (from saved playlists)
	 */
	getPlaylist(playlistId: string): Promise<Playlist | null>;

	/**
	 * YouTube-only: browse home page sections (mixes, moods, featured).
	 * Returns empty array for local mode.
	 */
	getExploreSections?(): Promise<Array<{title: string; tracks: Track[]}>>;

	/**
	 * YouTube-only: get genre list + playlists per genre.
	 * Returns empty array for local mode.
	 */
	getGenres?(): Promise<Array<{title: string; genres: Genre[]}>>;

	/**
	 * YouTube-only: get playlists for a specific genre browseId.
	 */
	getGenrePlaylists?(browseId: string): Promise<Playlist[]>;

	/**
	 * YouTube-only: get new album releases.
	 */
	getNewReleases?(): Promise<Array<{title: string; releases: Release[]}>>;

	/**
	 * YouTube-only: get tracks for a release browseId.
	 */
	getReleaseTracks?(browseId: string): Promise<Track[]>;

	/**
	 * Get suggested/related tracks for autoplay or "up next".
	 * Should return semantically related items (same artist/album, or
	 * YouTube mix/radio).
	 *
	 * @param trackId ID of the current track
	 * @param limit Maximum suggestions to return
	 * @returns Array of suggested tracks
	 */
	getSuggestions(trackId: string, limit?: number): Promise<Track[]>;

	/**
	 * Resolve a playable URL for the given track.
	 *
	 * - YouTube: returns streaming URL (from ytdl-core or yt-dlp)
	 * - Local: returns `file://` URI (absolute path encoded)
	 *
	 * The player service sends this URL to mpv via IPC `loadfile` command.
	 *
	 * @param track Track to play
	 * @returns Direct URL/path that mpv can open
	 */
	getStreamUrl(track: Track): Promise<string>;

	/**
	 * Optional: return currently trending/popular tracks.
	 * Used by "Discover" or "Trending" UI panels.
	 * May return empty array if unsupported by backend.
	 */
	getTrending?(): Promise<Track[]>;

	/**
	 * Optional: return recently added tracks.
	 * Used by "Recent" or "New in Library" views.
	 */
	getRecentlyAdded?(limit?: number): Promise<Track[]>;

	/**
	 * Optional: return recently played tracks.
	 * Used by history view when not using separate history service.
	 */
	getRecentlyPlayed?(limit?: number): Promise<Track[]>;
}

// ─── Factory ─────────────────────────────────────────────────────────────

export type MusicSource = 'youtube' | 'local';

export interface MusicServiceFactory {
	/**
	 * Create or return the singleton instance for the selected source.
	 *
	 * @param source 'youtube' or 'local' (reads from config if omitted)
	 * @returns MusicService implementation
	 */
	getService(source?: MusicSource): MusicService;

	/**
	 * Get the currently active service (cached based on last `getService` call).
	 * Useful for quick access without parameter.
	 */
	getCurrentService(): MusicService;

	/**
	 * Switch the active source. Invalidates cache; next `getCurrentService`
	 * returns a different singleton.
	 *
	 * @param source New source to activate
	 */
	setSource(source: MusicSource): void;
}

// ─── MusicServiceFactory Singleton (delegates to factory.ts) ─────────────

// Singleton instance (one per runtime)
let musicServiceFactoryInstance: MusicServiceFactory | null = null;

export function getMusicServiceFactory(): MusicServiceFactory {
	if (!musicServiceFactoryInstance) {
		throw new Error(
			'MusicServiceFactory not initialized — call initializeMusicServiceFactory() first',
		);
	}
	return musicServiceFactoryInstance;
}

export async function initializeMusicServiceFactory(
	initialSource?: MusicSource,
): Promise<void> {
	if (musicServiceFactoryInstance) return;
	const {getMusicServiceFactory: getFactoryFromModule} = await import('./factory.ts');
	const impl = getFactoryFromModule();
	musicServiceFactoryInstance = impl;
	if (initialSource && initialSource !== impl.getSource()) {
		await impl.setSource(initialSource);
	}
}

export function getMusicService(): MusicService {
	return getMusicServiceFactory().getCurrentService();
}
