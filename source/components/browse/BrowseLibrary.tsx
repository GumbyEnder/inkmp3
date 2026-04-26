// BrowseLibrary — two-panel file browser for local music library
// Left: directory tree; Right: tracklist for selected directory
// Uses Ink components; integrates with MusicService and player store

import {useState, useEffect, useCallback} from 'react';
import {Box, Text} from 'ink';
import fg from 'fast-glob';
import path from 'node:path';
import {stat, readdir} from 'node:fs/promises';
import * as fs from 'node:fs';

import {getConfigService} from '../../services/config/config.service.ts';
import {getMusicService} from '../../services/music/index.ts';
import {usePlayer} from '../../hooks/usePlayer.ts';

import type {Track} from '../../types/player.types.ts';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.flac', '.m4a', '.ogg', '.opus', '.wav', '.aac']);

function normalizePath(p: string): string {
	if (p.startsWith('~')) {
		const home = process.env.HOME || process.env.USERPROFILE || '';
		return path.join(home, p.slice(1));
	}
	return path.resolve(p);
}

interface DirEntry {
	name: string;
	fullPath: string;
	isDir: boolean;
	mtime?: number;
}

async function listDir(
	dirPath: string,
	expandedDirs: Set<string>,
): Promise<DirEntry[]> {
	const entries: DirEntry[] = [];
	let names: string[];
	try {
		names = await readdir(dirPath);
	} catch {
		return [{name: '<error>', fullPath: '', isDir: false}];
	}

	for (const name of names) {
		if (name.startsWith('.')) continue;
		const fullPath = path.join(dirPath, name);
		let isDir = false;
		try {
			const s = await stat(fullPath);
			isDir = s.isDirectory();
			entries.push({name, fullPath, isDir, mtime: s.mtimeMs});
		} catch {}
	}
	entries.sort((a, b) => {
		if (a.isDir && !b.isDir) return -1;
		if (!a.isDir && b.isDir) return 1;
		return a.name.localeCompare(b.name);
	});
	return entries;
}

function buildTreeLines(
	rootPath: string,
	expandedDirs: Set<string>,
	dirCache: Map<string, DirEntry[]>,
	depth = 0,
): string[] {
	const lines: string[] = [];
	const entries = dirCache.get(rootPath) ?? [];
	for (const entry of entries) {
		if (!entry.isDir) continue;
		const isExpanded = expandedDirs.has(entry.fullPath);
		const indent = '  '.repeat(depth);
		const name = isExpanded ? `[${entry.name}]` : entry.name;
		lines.push(indent + name);
		if (isExpanded) {
			const sublines = buildTreeLines(entry.fullPath, expandedDirs, dirCache, depth + 1);
			lines.push(...sublines);
		}
	}
	return lines;
}

export default function BrowseLibrary() {
	const config = getConfigService();
	const {play} = usePlayer();

	const libraryPaths = (config.get('localLibrary')?.paths ?? ['~/Music']).map(normalizePath);
	const rootPath = libraryPaths[0] || '~/Music';

	const [selectedPath, setSelectedPath] = useState(rootPath);
	const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([rootPath]));
	const [dirCache, setDirCache] = useState<Map<string, DirEntry[]>>(new Map());
	const [tracks, setTracks] = useState<Track[]>([]);
	const [trackSelection, setTrackSelection] = useState(0);
	const [loadingTracks, setLoadingTracks] = useState(false);
	const [selectedTreeIndex, setSelectedTreeIndex] = useState(0);

	// Cache all expanded directories on mount and on expand changes
	useEffect(() => {
		async function populate() {
			const cache = new Map<string, DirEntry[]>();
			for (const dir of expandedDirs) {
				const entries = await listDir(dir, expandedDirs);
				cache.set(dir, entries);
			}
		setDirCache(cache);
		}
		populate();
	}, [expandedDirs]);

	// Build tree lines from cache whenever cache or expandedDirs changes
	const treeLines = buildTreeLines(rootPath, expandedDirs, dirCache);

	// When selectedPath changes, load its tracklist
	useEffect(() => {
		async function loadTracks() {
			setLoadingTracks(true);
			setTracks([]);
			setTrackSelection(0);
			const entries = await listDir(selectedPath, expandedDirs);
			// Ensure dirCache up-to-date
			setDirCache(prev => new Map(prev).set(selectedPath, entries));
			const audioEntries = entries.filter(e => !e.isDir && AUDIO_EXTENSIONS.has(path.extname(e.name).toLowerCase()));
			const service = getMusicService();
			const trackPromises = audioEntries.map(e => service.getTrack(e.fullPath));
			const results = await Promise.all(trackPromises);
			const valid = results.filter((t): t is Track => t !== null);
			setTracks(valid);
			setLoadingTracks(false);
		}
		loadTracks();
	}, [selectedPath, expandedDirs]);

	// Keyboard event handler (parent should pass useKeyBinding(HANDLE_KEY, ...))
	const handleKey = useCallback((key: string) => {
		if (focusedPanel === 'tree') {
				if (key === 'ArrowDown') {
					setSelectedTreeIndex(i => Math.min(treeLines.length - 1, i + 1));
				} else if (key === 'ArrowUp') {
					setSelectedTreeIndex(i => Math.max(0, i - 1));
				} else if (key === 'Enter') {
					// Toggle expansion of highlighted directory
					const line = treeLines[selectedTreeIndex];
					if (line) {
						// Extract dir name from line (without brackets/indent)
						const trimmed = line.trim().replace(/^\[|\]$/g, '');
						// Reconstruct full path by matching against dirCache entries
						for (const [dirPath, entries] of dirCache) {
							const found = entries.find(e => e.isDir && (e.name === trimmed || (e.name.replace(/^\[|\]$/g,'') === trimmed)));
							if (found) {
								const newExpanded = new Set(expandedDirs);
								if (newExpanded.has(found.fullPath)) {
									newExpanded.delete(found.fullPath);
								} else {
									newExpanded.add(found.fullPath);
								}
								setExpandedDirs(newExpanded);
								break;
							}
						}
				}
			} else if (key === 'Tab' || key === ' ') {
				// Switch focus to tracklist (parent should handle)
			}
		} else {
			// tracks panel focused
			if (key === 'ArrowDown') {
				setTrackSelection(i => Math.min(tracks.length - 1, i + 1));
			} else if (key === 'ArrowUp') {
				setTrackSelection(i => Math.max(0, i - 1));
			} else if (key === 'Enter') {
				const track = tracks[trackSelection];
				if (track) {
					play(track);
				}
			} else if (key === 'Tab' || key === ' ') {
				// Switch to tree (parent)
			}
		}
	}, [focusedPanel, treeLines, selectedTreeIndex, expandedDirs, dirCache, tracks, trackSelection, playTrack]);

	// Breadcrumb
	const breadcrumb = selectedPath.replace(/^~/, process.env.HOME || '');

	return (
		<Box flexDirection="column">
			<Text bold>Browse Library</Text>
			<Box flexDirection="row">
				{/* Left: tree */}
			<Box width={30} borderStyle="single" paddingX={1} flexDirection="column">
					<Text>Library: {rootPath}</Text>
					{treeLines.map((line, i) => (
						<Text key={i} bold={focusedPanel === 'tree' && i === selectedTreeIndex}>{line}</Text>
					))}
				</Box>
				{/* Right: tracks */}
				<Box flexDirection="column" flexGrow={1}>
					<Text>Directory: {breadcrumb}</Text>
					{loadingTracks ? (
						<Text dim>Loading...</Text>
					) : tracks.length === 0 ? (
						<Text dim>(no audio files)</Text>
					) : (
						tracks.map((track, i) => (
							<Text
								key={track.id}
								color={focusedPanel === 'tracks' && i === trackSelection ? 'cyan' : undefined}
							>
								{track.title} — {track.artists.map(a => a.name).join(', ')} ({formatDuration(track.duration)})
							</Text>
						))
					)}
				</Box>
			</Box>
			<Text dim>Tab=focus • Enter=play/expand • ↑↓=nav</Text>
		</Box>
	);
}

function formatDuration(seconds?: number): string {
	if (!seconds) return '--:--';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return \`\${m}:\${s.toString().padStart(2, '0')}\`;
}
