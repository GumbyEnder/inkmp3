// Comprehensive tests for LocalMusicService (Phase 2)
// Bun.test — covers scanner, metadata, SQLite index, and MusicService methods

import { test, expect, beforeEach, afterEach, describe } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdir, rm, writeFile, access, stat } from 'node:fs/promises';
import { join, resolve, basename, extname, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import type { Track, Album, Artist, SearchResponse } from '../api.ts';
import { LocalMusicService } from '../local.service.ts';
import { getConfigService } from '../config/config.service.ts';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Create a temp directory and return its path */
function makeTempDir(): string {
	const dir = join(tmpdir(), `inkmp3-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
	mkdirSync(dir, { recursive: true });
	return dir;
}

/** Write dummy audio file with minimal metadata placeholder */
async function createAudioFile(dir: string, name: string, meta: Record<string, any> = {}): Promise<string> {
	const filePath = join(dir, name);
	// In real tests we'd write actual MP3/FLAC bytes. For speed, we write a tiny placeholder
	// and monkey-patch music-metadata parseFile to return our fake metadata.
	await writeFile(filePath, Buffer.from('dummy-audio-data'));
	return filePath;
}

// ─── Test Suite ────────────────────────────────────────────────────────────

describe('LocalMusicService', () => {
	let service: LocalMusicService;
	let tempLibDir: string;
	let originalParseFile: any;

	beforeEach(async () => {
		// Create fresh temp library
		tempLibDir = makeTempDir();

		// Override config.get to point library to temp dir
		const config = getConfigService();
		config.set('localLibrary', {
			paths: [tempLibDir],
			exclude: [],
			watch: false,
		});

		// Create service instance
		service = new LocalMusicService();

		// Monkey-patch music-metadata parseFile to return controllable fake metadata
		const parseFileModule = await import('music-metadata');
		originalParseFile = parseFileModule.parseFile;
		parseFileModule.parseFile = async (filePath: string) => {
			const filename = basename(filePath, extname(filePath));
			// Map filename to fake tags based on known test file names
			if (filename === 'song1') {
				return {
					format: { duration: 180 },
					common: {
						title: 'Test Song One',
						artist: 'Test Artist Alpha',
						album: 'Test Album A',
						track: { no: 1 },
						year: 2024,
						genre: ['rock'],
					},
				};
			} else if (filename === 'song2') {
				return {
					format: { duration: 240 },
					common: {
						title: 'Test Song Two',
						artist: 'Test Artist Beta',
						album: 'Test Album B',
						track: { no: 2 },
						year: 2025,
						genre: ['jazz'],
					},
				};
			} else {
				// Unknown file — return minimal metadata (triggers fallback)
				return {
					format: { duration: 0 },
					common: {},
				};
			}
		};

		// Initialize service (boots DB + starts background scan)
		await service.initialize();
	});

	afterEach(async () => {
		// Clean up temp directory
		try {
			await rm(tempLibDir, { recursive: true, force: true });
		} catch {}
		// Restore parseFile
		const parseFileModule = await import('music-metadata');
		parseFileModule.parseFile = originalParseFile;
	});

	// ─── Scanner & Indexer ────────────────────────────────────────────────────

	describe('Scanner & Indexer', () => {
		test('indexes audio files discovered in library directory', async () => {
			// Create sample audio files
			await createAudioFile(tempLibDir, 'song1.mp3');
			await createAudioFile(tempLibDir, 'song2.flac');
			await createAudioFile(tempLibDir, 'not-audio.txt'); // ignored

			// Trigger immediate re-scan (wait for debounce)
			await new Promise(r => setTimeout(r, 2500));

			// Query DB to confirm files indexed
			const getCount = () => {
				const db = (service as any).db;
				const row = db.query\`SELECT COUNT(*) as c FROM metadata\`.first();
				return row?.c ?? 0;
			};

			expect(getCount()).toBe(2);
		});

		test('skips unchanged files on re-scan', async () => {
			// Initial files
			await createAudioFile(tempLibDir, 'song1.mp3');

			// Wait for first scan
			await new Promise(r => setTimeout(r, 2500));

			// Get initial count
			const db = (service as any).db;
			const firstCount = db.query\`SELECT COUNT(*) as c FROM metadata\`.first().c;
			expect(firstCount).toBe(1);

			// No-op re-scan (same files, same mtime)
			await new Promise(r => setTimeout(r, 2500));
			const secondCount = db.query\`SELECT COUNT(*) as c FROM metadata\`.first().c;
			expect(secondCount).toBe(1);
		});
	});

	// ═══ Metadata ─═══════════════════════════════════════════════════════════

	describe('Metadata Extractor', () => {
		test('maps ID3/FLAC tags to LocalTrack fields', async () => {
			await createAudioFile(tempLibDir, 'song1.mp3');
			await new Promise(r => setTimeout(r, 2500));

			const track = await service.getTrack(join(tempLibDir, 'song1.mp3'));
			expect(track).not.toBeNull();
			expect(track!.title).toBe('Test Song One');
			expect(track!.artists[0].name).toBe('Test Artist Alpha');
			expect(track!.album.name).toBe('Test Album A');
			expect(track!.duration).toBe(180);
			expect(track!.trackNumber).toBe(1);
			expect(track!.genres).toContain('rock');
		});

		test('falls back to filename when tags missing', async () => {
			await createAudioFile(tempLibDir, 'unknown-file.ogg');
			await new Promise(r => setTimeout(r, 2500));

			const track = await service.getTrack(join(tempLibDir, 'unknown-file.ogg'));
			expect(track).not.toBeNull();
			expect(track!.title).toBe('unknown-file');
		});
	});

	// ═══ Search ─═════════════════════════════════════════════════════════════

	describe('Search', () => {
		beforeEach(async () => {
			await createAudioFile(tempLibDir, 'alpha-song.mp3');
			await createAudioFile(tempLibDir, 'beta-track.flac');
			await new Promise(r => setTimeout(r, 2500));
		});

		test('returns tracks matching title query (case-insensitive LIKE)', async () => {
			const result: SearchResponse = await service.search('alpha');
			expect(result.results.length).toBeGreaterThan(0);
			expect(result.results.some(r => (r.data as Track).title.toLowerCase().includes('alpha'))).toBe(true);
		});

		test('returns tracks matching album query', async () => {
			const result: SearchResponse = await service.search('album');
			expect(result.results.length).toBeGreaterThan(0);
		});

		test('hasMore is always false for local', async () => {
			const result = await service.search('test');
			expect(result.hasMore).toBe(false);
		});
	});

	// ═══ Get Track/Album/Artist ─════════════════════════════════════════════

	describe('Retrieval', () => {
		test('getTrack returns full Track with source=local', async () => {
			await createAudioFile(tempLibDir, 'song1.mp3');
			await new Promise(r => setTimeout(r, 2500));

			const filePath = join(tempLibDir, 'song1.mp3');
			const track = await service.getTrack(filePath);
			expect(track).not.toBeNull();
			expect(track!.source).toBe('local');
			expect(track!.filePath).toBe(filePath);
			expect(track!.album.id).toBe(dirname(filePath));
		});

		test('getTrack returns null for unknown file', async () => {
			const track = await service.getTrack('/nonexistent/file.mp3');
			expect(track).toBeNull();
		});

		test('getAlbum returns album with tracklist', async () => {
			await createAudioFile(tempLibDir, 'song1.mp3');
			await createAudioFile(tempLibDir, 'song2.mp3');
			await new Promise(r => setTimeout(r, 2500));

			const albumDir = tempLibDir;
			const album = await service.getAlbum(albumDir);
			expect(album).not.toBeNull();
			expect(album!.tracks.length).toBe(2);
			expect(album!.name).toBe('Test Album A'); // first file's album
		});

		test('getArtist returns artist if any track matches', async () => {
			await createAudioFile(tempLibDir, 'song1.mp3');
			await new Promise(r => setTimeout(r, 2500));

			const artist = await service.getArtist('Test Artist Alpha');
			expect(artist).not.toBeNull();
			expect(artist!.name).toBe('Test Artist Alpha');
		});

		test('getSuggestions returns tracks by same artist', async () => {
			await createAudioFile(tempLibDir, 'song1.mp3');
			await createAudioFile(tempLibDir, 'song2.mp3'); // different artist
			await new Promise(r => setTimeout(r, 2500));

			const path = join(tempLibDir, 'song1.mp3');
			const suggestions = await service.getSuggestions(path, 5);
			expect(suggestions.length).toBeGreaterThan(0);
			expect(suggestions.every(s => s.artists.some(a => a.name === 'Test Artist Alpha'))).toBe(true);
			// Ensure the current track is not in suggestions
			expect(suggestions.some(s => s.id === path)).toBe(false);
		});
	});

	// ═══ Stream URL ─══════════════════════════════════════════════════════════

	describe('getStreamUrl', () => {
		test('returns absolute filePath for valid local track', async () => {
			await createAudioFile(tempLibDir, 'song1.mp3');
			await new Promise(r => setTimeout(r, 2500));

			const track = await service.getTrack(join(tempLibDir, 'song1.mp3'));
			expect(track).not.toBeNull();
			const url = await service.getStreamUrl(track!);
			expect(url).toBe(track!.filePath);
		});

		test('throws for non-local track (source mismatch)', async () => {
			const fake = { source: 'youtube', id: 'abc123' } as Track;
			await expect(service.getStreamUrl(fake)).rejects.toThrow(/expected source='local'/);
		});

		test('throws if file does not exist on disk', async () => {
			const fake = { source: 'local', filePath: '/no/such/file.mp3', id: '/no/such/file.mp3' } as Track;
			await expect(service.getStreamUrl(fake)).rejects.toThrow(/File not found/);
		});
	});
});
