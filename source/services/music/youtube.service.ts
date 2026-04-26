// YouTube Music Service — Adapter wrapping existing youtube-music API
// This adapts the legacy `MusicService` (from source/services/youtube-music/api.ts)
// to the new unified `MusicService` interface.

import type {
	Track as UnifiedTrack,
	Artist as UnifiedArtist,
	Album as UnifiedAlbum,
	Playlist as UnifiedPlaylist,
	SearchResponse as UnifiedSearchResponse,
	SearchOptions as UnifiedSearchOptions,
	SearchResult as UnifiedSearchResult,
	MusicService,
	Genre as UnifiedGenre,
	Release as UnifiedRelease,
} from './api.ts';

import type {
	Track as YtTrack,
	Artist as YtArtist,
	Album as YtAlbum,
	SearchResponse as YtSearchResponse,
	SearchResult as YtSearchResult,
	SearchOptions as YtSearchOptions,
} from '../../types/youtube-music.types.ts';

import {getMusicService as getLegacyMusicService} from '../youtube-music/api.ts';

/**
 * YouTubeMusicService — Adapter
 *
 * Wraps the existing singleton MusicService (from youtube-music/api.ts) and
 * translates its types to the unified MusicService interface.
 *
 * No YouTube logic changes — this is a pure type+adapter layer.
 */
export class YouTubeMusicService implements MusicService {
	private legacyService: ReturnType<typeof getLegacyMusicService>;

	constructor() {
		this.legacyService = getLegacyMusicService();
	}

	// ─── Search ────────────────────────────────────────────────────────────

	async search(
		query: string,
		options?: UnifiedSearchOptions,
	): Promise<UnifiedSearchResponse> {
		const ytOptions: YtSearchOptions = {
			type: options?.type as YtSearchOptions['type'] ?? 'all',
			limit: options?.limit,
			continuation: options?.continuation,
		};

		const ytResult: YtSearchResponse = await this.legacyService.search(
			query,
			ytOptions,
		);

		// Translate SearchResult[] (union type) into unified SearchResult[]
		const results: UnifiedSearchResult[] = ytResult.results.map((r) => {
			return {
				type: this.translateResultType(r.type),
				data: this.translateSearchData(r.data),
			};
		});

		return {
			results,
			hasMore: ytResult.hasMore,
			continuation: ytResult.continuation,
		};
	}

	/**
	 * Translate YouTube-specific search result type into unified type.
	 * YouTube: 'song' | 'album' | 'artist' | 'playlist'
	 * Unified: 'track' | 'album' | 'artist' | 'playlist'
	 */
	private translateResultType(
		ytType: YtSearchResult['type'],
	): UnifiedSearchResult['type'] {
		switch (ytType) {
			case 'song':
				return 'track';
			case 'album':
				return 'album';
			case 'artist':
				return 'artist';
			case 'playlist':
				return 'playlist';
			default:
				return 'track';
		}
	}

	/**
	 * Translate any YouTube search result data into unified Track/Album/Artist.
	 */
	private translateSearchData(
		data: YtTrack | YtAlbum | YtArtist | YtSearchResult['data'],
	): UnifiedTrack | UnifiedAlbum | UnifiedArtist {
		// YouTube Track has videoId
		if ('videoId' in data && typeof data.videoId === 'string') {
			return this.translateTrack(data as YtTrack);
		}
		// YouTube Album has albumId
		if ('albumId' in data && typeof data.albumId === 'string') {
			return {
				id: (data as YtAlbum).albumId,
				name: (data as YtAlbum).name,
				artists: (data as YtAlbum).artists.map((a) =>
					this.translateArtist(a),
				),
			} as UnifiedAlbum;
		}
		// YouTube Artist has artistId
		if ('artistId' in data && typeof data.artistId === 'string') {
			return {
				id: (data as YtArtist).artistId,
				name: (data as YtArtist).name,
			} as UnifiedArtist;
		}
		// Fallback — unknown type
		return {
			id: 'unknown',
			title: 'Unknown',
			artists: [],
			duration: 0,
			source: 'youtube',
		};
	}

	/**
	 * Convert YouTube Track (videoId-based) to unified Track (id-based).
	 *
	 * Key differences:
	 * - Unified: id = videoId
	 * - Unified: source = 'youtube'
	 * - Unified: videoId field mirrors id
	 * - Album: YtAlbum has albumId; UnifiedAlbum uses id=albumId
	 */
	private translateTrack(ytTrack: YtTrack): UnifiedTrack {
		return {
			// Primary key
			id: ytTrack.videoId,
			title: ytTrack.title,
			artists: ytTrack.artists.map((a) => this.translateArtist(a)),
			album: ytTrack.album
				? {
						id: ytTrack.album.albumId,
						name: ytTrack.album.name,
						artists: ytTrack.album.artists.map((a) =>
							this.translateArtist(a),
						),
				  }
				: undefined,
			duration: ytTrack.duration ?? 0,
			source: 'youtube',
			videoId: ytTrack.videoId,
		};
	}

	private translateArtist(ytArtist: YtArtist): UnifiedArtist {
		return {
			id: ytArtist.artistId,
			name: ytArtist.name,
		};
	}

	// ─── Get Track ─────────────────────────────────────────────────────────

	async getTrack(id: string): Promise<UnifiedTrack | null> {
		// YouTube IDs are always video IDs; if caller passed filePath-style
		// string, we'd need detection — but in YouTube mode, all IDs are videoIds.
		const ytTrack = await this.legacyService.getTrack(id);
		if (!ytTrack) {
			return null;
		}
		return this.translateTrack(ytTrack);
	}

	// ─── Get Suggestions ───────────────────────────────────────────────────

	async getSuggestions(trackId: string, limit = 20): Promise<UnifiedTrack[]> {
		const ytTracks = await this.legacyService.getSuggestions(trackId);
		return ytTracks.slice(0, limit).map((t) => this.translateTrack(t));
	}

	// ─── Get Album ──────────────────────────────────────────────────────────

	async getAlbum(albumId: string): Promise<UnifiedAlbum | null> {
		try {
			const ytAlbum = await this.legacyService.getAlbum(albumId);
			return {
				id: ytAlbum.albumId,
				name: ytAlbum.name,
				artists: ytAlbum.artists.map(a => this.translateArtist(a)),
			} as UnifiedAlbum;
		} catch {
			return null;
		}
	}

	// ─── Get Artist ──────────────────────────────────────────────────────────

	async getArtist(artistId: string): Promise<UnifiedArtist | null> {
		try {
			const ytArtist = await this.legacyService.getArtist(artistId);
			return {
				id: ytArtist.artistId,
				name: ytArtist.name,
			} as UnifiedArtist;
		} catch {
			return null;
		}
	}

	// ─── Get Playlist ─────────────────────────────────────────────────────────

	async getPlaylist(playlistId: string): Promise<UnifiedPlaylist | null> {
		try {
			const ytPlaylist = await this.legacyService.getPlaylist(playlistId);
			return {
				playlistId: ytPlaylist.playlistId,
				name: ytPlaylist.name,
				tracks: ytPlaylist.tracks.map(t => this.translateTrack(t)),
			} as UnifiedPlaylist;
		} catch {
			return null;
		}
	}

	// ─── YouTube-exclusive methods ─────────────────────────────────────────

	async getExploreSections(): Promise<Array<{title: string; tracks: UnifiedTrack[]}>> {
		const sections = await this.legacyService.getExploreSections();
		return sections.map(s => ({
			title: s.title,
			tracks: s.tracks.map(t => this.translateTrack(t)),
		}));
	}

	async getGenres(): Promise<Array<{title: string; genres: UnifiedGenre[]}>> {
		const result = await this.legacyService.getGenres();
		return result.map(g => ({
			title: g.title,
			genres: g.genres.map(genre => ({
				title: genre.title,
				browseId: genre.browseId,
				params: genre.params,
			})),
		}));
	}

	async getGenrePlaylists(browseId: string): Promise<UnifiedPlaylist[]> {
		const playlists = await this.legacyService.getGenrePlaylists(browseId);
		return playlists.map(p => ({
			playlistId: p.playlistId,
			name: p.name,
			tracks: p.tracks.map(t => this.translateTrack(t)),
		}));
	}

	async getNewReleases(): Promise<Array<{title: string; releases: UnifiedRelease[]}>> {
		const result = await this.legacyService.getNewReleases();
		return result.map(r => ({
			title: r.title,
			releases: r.releases.map(rel => ({
				title: rel.title,
				browseId: rel.browseId,
				artist: rel.artist,
				subtitle: rel.subtitle,
			})),
		}));
	}

	async getReleaseTracks(browseId: string): Promise<UnifiedTrack[]> {
		const tracks = await this.legacyService.getReleaseTracks(browseId);
		return tracks.map(t => this.translateTrack(t));
	}

	// ─── Get Stream URL ────────────────────────────────────────────────────

	async getStreamUrl(track: UnifiedTrack): Promise<string> {
		if (track.source !== 'youtube') {
			throw new Error(
				`YouTubeMusicService.getStreamUrl: expected source='youtube', got '${track.source}'`,
			);
		}
		const videoId = track.videoId ?? track.id;
		if (!videoId) {
			throw new Error('Track missing videoId — cannot get stream URL');
		}
		return this.legacyService.getStreamUrl(videoId);
	}

	// ─── Optional: Trending ─────────────────────────────────────────────────

	async getTrending(): Promise<UnifiedTrack[]> {
		// YouTube Music API does not have a "trending" endpoint in this wrapper.
		// Fallback: return empty array (feature will be disabled in YouTube mode).
		// Future enhancement: scrape YouTube Music homepage trends.
		return [];
	}
}

// ─── Singleton ────────────────────────────────────────────────────────────

let youtubeServiceInstance: YouTubeMusicService | null = null;

export function getYouTubeMusicService(): YouTubeMusicService {
	if (!youtubeServiceInstance) {
		youtubeServiceInstance = new YouTubeMusicService();
	}
	return youtubeServiceInstance;
}
