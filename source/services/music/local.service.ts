// Local Music Service — Full implementation (Phase 2)
// Scanner + Metadata extraction + SQLite index + MusicService methods
//
// Architecture:
//   • Scanner: fast-glob recursive walk of library directories (filtered by audio extensions)
//   • Metadata: music-metadata parseFile → ID3/FLAC/MP4 tags
//   • Index: Bun.sqlite with tables `files` and `metadata`; upsert on change
//   • Background: debounced incremental scans (skip unchanged mtime+size, optionally watch FS changes)
//
// Config: uses ConfigService.localLibrary { paths, exclude, watch }
// Default library: ~/Music (or %USERPROFILE%\Music on Windows)

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

import { getConfigService } from '../config/config.service';
import { CONFIG_DIR } from '../../utils/constants';

import { Database } from 'bun:sqlite';
import fg from 'fast-glob';
import { parseFile } from 'music-metadata';
import path from 'node:path';
import { stat, access } from 'node:fs/promises';
import * as fs from 'node:fs';

const AUDIO_EXTENSIONS = [
	'.mp3',
	'.flac',
	'.m4a',
	'.ogg',
	'.opus',
	'.wav',
	'.aac',
	'.wma',
	'.ape',
	'.wv',
	'.mp4',
	'.m4b',
	'.m4p',
];

export class LocalMusicService implements MusicService {
	private initialized = false;
	private db: Database | null = null;
	private libraryPaths: string[] = [];
	private excludePatterns: string[] = [];
	private watchEnabled = false;
	private watchers: fs.FSWatcher[] = [];

	private scanInProgress = false;
	private pendingRescan = false;
	private indexTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly DEBOUNCE_MS = 2000;

	/** Initialize service — called once at startup by factory. */
	async initialize(): Promise<void> {
		if (this.initialized) return;

		const config = getConfigService();
		const localLib = config.get('localLibrary') ?? {};

		const defaultPath = path.join(
			process.env.HOME || process.env.USERPROFILE || '',
			'Music',
		);
		this.libraryPaths = (localLib.paths ?? [defaultPath]).map(p =>
			this.expandPath(p),
		);
		this.excludePatterns = localLib.exclude ?? [];
		this.watchEnabled = localLib.watch ?? false;

		// Ensure config directory exists
		mkdirSync(CONFIG_DIR, { recursive: true });

		// Open SQLite database
		const dbPath = path.join(CONFIG_DIR, 'local_library.db');
		this.db = new Database(dbPath);

		this.ensureSchema();

		if (this.watchEnabled) {
			this.setupWatchers();
		}

		this.scheduleIndex();
		this.initialized = true;
	}

	private expandPath(p: string): string {
		if (p.startsWith('~')) {
			const home = process.env.HOME || process.env.USERPROFILE || '';
			return path.join(home, p.slice(1));
		}
		return path.resolve(p);
	}

	private ensureSchema(): void {
		if (!this.db) throw new Error('Database not initialized');

		this.db.run('PRAGMA foreign_keys = ON');

		this.db.run(`
			CREATE TABLE IF NOT EXISTS files (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				path TEXT NOT NULL UNIQUE,
				mtime REAL NOT NULL,
				size INTEGER NOT NULL
			)
		`);

		this.db.run(`
			CREATE TABLE IF NOT EXISTS metadata (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				fileId INTEGER NOT NULL UNIQUE,
				title TEXT,
				artists TEXT,
				album TEXT,
				duration REAL,
				trackNumber INTEGER,
				year INTEGER,
				genre TEXT,
				FOREIGN KEY (fileId) REFERENCES files(id) ON DELETE CASCADE
			)
		`);

		this.db.run('CREATE INDEX IF NOT EXISTS idx_metadata_title ON metadata(title)');
		this.db.run('CREATE INDEX IF NOT EXISTS idx_metadata_album ON metadata(album)');
		this.db.run('CREATE INDEX IF NOT EXISTS idx_metadata_artists ON metadata(artists)');
	}

	private scheduleIndex(): void {
		if (this.scanInProgress) {
			this.pendingRescan = true;
			return;
		}
		if (this.indexTimer) {
			clearTimeout(this.indexTimer);
		}
		this.indexTimer = setTimeout(() => {
			this.indexTimer = null;
			this.performIndex().catch(err => {
				console.error('Background indexer error:', err);
			});
		}, this.DEBOUNCE_MS);
	}

	private async performIndex(): Promise<void> {
		if (!this.db) return;

		this.scanInProgress = true;
		try {
			const fileSet = new Set<string>();
			for (const libPath of this.libraryPaths) {
				try {
					const files = await fg('**/*', {
						cwd: libPath,
						absolute: true,
						onlyFiles: true,
						deep: true,
						exclude: this.excludePatterns,
						extensions: AUDIO_EXTENSIONS,
					});
					for (const f of files) fileSet.add(f);
				} catch {
					// Dir may not exist
				}
			}
			const audioFiles = Array.from(fileSet);

			this.db.run('BEGIN TRANSACTION');
			const visitedFileIds: number[] = [];

			const BATCH_SIZE = 10;
			for (let i = 0; i < audioFiles.length; i += BATCH_SIZE) {
				const batch = audioFiles.slice(i, i + BATCH_SIZE);
				await Promise.all(
					batch.map(async filePath => {
						try {
							const stats = await stat(filePath);
							const mtimeMs = stats.mtimeMs;
							const size = stats.size;

							const existing = this.db!.query`
								SELECT id, mtime, size FROM files WHERE path = ${filePath}
							`.first();

							if (existing && existing.mtime === mtimeMs && existing.size === size) {
								visitedFileIds.push(existing.id);
								return;
							}

							// Parse metadata
							let title: string;
							let artists: string[];
							let album: string;
							let duration: number;
							let trackNumber: number | undefined;
							let year: number | undefined;
							let genre: string[];
							try {
								const meta = await parseFile(filePath);
								const common = meta.common;
								const format = meta.format;
								title =
									common.title ??
									path.basename(filePath, path.extname(filePath));
								artists = Array.isArray(common.artists)
									? common.artists
									: common.artist
									? [common.artist]
									: [];
								album = common.album ?? '';
								duration = format.duration ?? 0;
								trackNumber = common.track?.no;
								year = common.year;
								genre = Array.isArray(common.genre)
									? common.genre
									: common.genre
									? [common.genre]
									: [];
							} catch {
								title = path.basename(filePath, path.extname(filePath));
								artists = [];
								album = '';
								duration = 0;
								trackNumber = undefined;
								year = undefined;
								genre = [];
							}

							let fileId: number;
							if (existing) {
								this.db!.run`
									UPDATE files SET mtime = ${mtimeMs}, size = ${size} WHERE id = ${existing.id}
								`;
								fileId = existing.id;
							} else {
								const res = this.db!.run`
									INSERT INTO files (path, mtime, size) VALUES (${filePath}, ${mtimeMs}, ${size})
								`;
								fileId = res.lastInsertRowid as number;
							}
							visitedFileIds.push(fileId);

							this.db!.run`
								INSERT OR REPLACE INTO metadata
								(fileId, title, artists, album, duration, trackNumber, year, genre)
								VALUES (
									${fileId},
									${title},
									${JSON.stringify(artists)},
									${album},
									${duration},
									${trackNumber ?? null},
									${year ?? null},
									${JSON.stringify(genre)}
								)
							`;
						} catch (err) {
							console.error(`Error indexing file \${filePath}:`, err);
						}
					}),
				);
			}

			if (visitedFileIds.length === 0) {
				this.db!.run('DELETE FROM files');
			} else {
				this.db!.run`DELETE FROM files WHERE id NOT IN ${visitedFileIds}`;
			}

			this.db.run('COMMIT');
		} catch (e) {
			this.db!.run('ROLLBACK');
			throw e;
		} finally {
			this.scanInProgress = false;
			if (this.pendingRescan) {
				this.pendingRescan = false;
				this.scheduleIndex();
			}
		}
	}

	private setupWatchers(): void {
		for (const libPath of this.libraryPaths) {
			try {
				const watcher = fs.watch(
					libPath,
					{ recursive: true },
					() => {
						this.scheduleIndex();
					},
				);
				watcher.on('error', err => {
					console.error('Watcher error on', libPath, err);
				});
				this.watchers.push(watcher);
			} catch (err) {
				console.error('Failed to set up watcher for', libPath, err);
			}
		}
	}

	async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
		if (!this.db) {
			throw new Error('LocalMusicService not initialized — call initialize() first');
		}
		const like = `%\${query}%`;
		const limit = options?.limit ?? 50;
		const rows = this.db!.query`
			SELECT m.*, f.path
			FROM metadata m
			JOIN files f ON m.fileId = f.id
			WHERE m.title LIKE \${like} OR m.album LIKE \${like}
			LIMIT \${limit}
		`.all();

		const results: SearchResult[] = rows.map(row => ({
			type: 'track',
			data: this.rowToTrack(row),
		}));

		return { results, hasMore: false };
	}

	async getTrack(id: string): Promise<UnifiedTrack | null> {
		if (!this.db) {
			throw new Error('LocalMusicService not initialized — call initialize() first');
		}
		const row = this.db!.query`
			SELECT m.*, f.path
			FROM files f
			JOIN metadata m ON f.id = m.fileId
			WHERE f.path = \${id}
		`.first();
		if (!row) return null;
		return this.rowToTrack(row);
	}

	async getAlbum(albumId: string): Promise<UnifiedAlbum | null> {
		if (!this.db) {
			throw new Error('LocalMusicService not initialized — call initialize() first');
		}
		const albumDir = albumId.replace(/[\\/]+$/, '');
		const rows = this.db!.query`
			SELECT m.*, f.path
			FROM files f
			JOIN metadata m ON f.id = m.fileId
			WHERE f.path LIKE \${albumDir + '/%'}
			ORDER BY m.trackNumber ASC
		`.all();

		if (rows.length === 0) return null;

		const first = rows[0];
		const artists = this.parseArtists(first.artists);
		const album: UnifiedAlbum = {
			id: albumDir,
			name: first.album,
			artists,
			year: first.year ?? undefined,
		};
		const tracks = rows.map(row => this.rowToTrack(row));
		return { ...album, tracks };
	}

	async getArtist(artistId: string): Promise<UnifiedArtist | null> {
		if (!this.db) {
			throw new Error('LocalMusicService not initialized — call initialize() first');
		}
		const exists = this.db!.query`
			SELECT 1 FROM metadata WHERE artists LIKE \${'%' + artistId + '%'} LIMIT 1
		`.first();
		if (!exists) return null;
		return { id: artistId, name: artistId };
	}

	async getPlaylist(_playlistId: string): Promise<UnifiedPlaylist | null> {
		return null;
	}

	async getSuggestions(trackId: string, limit = 20): Promise<UnifiedTrack[]> {
		if (!this.db) {
			throw new Error('LocalMusicService not initialized — call initialize() first');
		}

		// Get the track to access its metadata
		const track = await this.getTrack(trackId);
		if (!track) return [];

		const suggestions = new Map<string, UnifiedTrack>();
		let totalAdded = 0;

		// ── 1. Same-artist suggestions (existing behavior) ─────────────────────
		if (track.artists.length > 0) {
			for (const artist of track.artists) {
				if (totalAdded >= limit) break;
				const artistName = artist.name;
				const like = `%\${artistName}%`;
				const rows = this.db!.query`
					SELECT m.*, f.path
					FROM metadata m
					JOIN files f ON m.fileId = f.id
					WHERE f.path != \${trackId} AND m.artists LIKE \${like}
				`.all();

				for (const row of rows) {
					if (totalAdded >= limit) break;
					const t = this.rowToTrack(row);
					if (!suggestions.has(t.id)) {
						suggestions.set(t.id, t);
						totalAdded++;
					}
				}
			}
		}

		// ── 2. Same-album suggestions (if track has album) ─────────────────────
		if (track.album?.name.length > 0) {
			const like = `%\${track.album.name}%`;
			const rows = this.db!.query`
				SELECT m.*, f.path
				FROM metadata m
				JOIN files f ON m.fileId = f.id
				WHERE f.path != \${trackId} AND m.album LIKE \${like}
	`.all();

			for (const row of rows) {
				if (totalAdded >= limit) break;
				const t = this.rowToTrack(row);
				if (!suggestions.has(t.id)) {
					suggestions.set(t.id, t);
					totalAdded++;
				}
			}
		}

		// ── 3. Same-folder suggestions (tracks in same directory) ───────────────
		if (track.filePath && track.filePath.length > 0) {
			const folder = path.dirname(track.filePath);
			if (folder.length > 0) {
				// Get all tracks in the same album folder, sorted by filename proximity
				const like = `%\${path.basename(folder)}%`;
				const rows = this.db!.query`
					SELECT m.*, f.path
					FROM metadata m
					JOIN files f ON m.fileId = f.id
					WHERE f.path LIKE \${folder + '/%'} AND f.path != \${trackId}
			`.all();

				for (const row of rows) {
					if (totalAdded >= limit) break;
					const t = this.rowToTrack(row);
					if (!suggestions.has(t.id)) {
						suggestions.set(t.id, t);
						totalAdded++;
					}
				}
			}
		}

		return Array.from(suggestions.values());
	}

	async getStreamUrl(track: UnifiedTrack): Promise<string> {
		if (track.source !== 'local') {
			throw new Error(
				`LocalMusicService.getStreamUrl: expected source='local', got '\${track.source}'`,
			);
		}
		const filePath = track.filePath ?? track.id;
		if (!filePath) {
			throw new Error('Track has no filePath — cannot construct stream URL');
		}
		try {
			await access(filePath);
			} catch {
				throw new Error(`File not found: \${filePath}`);
			}
		return filePath;
	}

	async getRecentlyAdded(_limit = 50): Promise<UnifiedTrack[]> {
		return [];
	}

	async getRecentlyPlayed(_limit = 50): Promise<UnifiedTrack[]> {
		return [];
	}

	private parseArtists(artistsJson: string): UnifiedArtist[] {
		try {
			const names = JSON.parse(artistsJson);
			if (Array.isArray(names)) {
				return names.map(name => ({ id: name, name }));
			}
		} catch {
			// ignore parse errors
		}
		return [];
	}

	private rowToTrack(row: {
		title: string;
		artists: string;
		album: string;
		duration: number;
		trackNumber: number | null;
		year: number | null;
		genre: string | null;
		path: string;
	}): UnifiedTrack {
		const artists = this.parseArtists(row.artists);
		const album: UnifiedAlbum = {
			id: path.dirname(row.path),
			name: row.album,
			artists,
			year: row.year ?? undefined,
		};
		return {
			id: row.path,
			title: row.title,
			artists,
			album,
			duration: row.duration,
			source: 'local',
			filePath: row.path,
			trackNumber: row.trackNumber ?? undefined,
			year: row.year ?? undefined,
			genres: row.genre ? JSON.parse(row.genre) : undefined,
		};
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
