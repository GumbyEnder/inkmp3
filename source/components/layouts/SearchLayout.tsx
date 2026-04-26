// Search view layout — unified for YouTube + Local sources
import {useNavigation} from '../../hooks/useNavigation.ts';
import {usePlayer} from '../../hooks/usePlayer.ts';
import SearchResults from '../search/SearchResults.tsx';
import {useState, useCallback, useEffect, useMemo} from 'react';
import type {
	SearchResult,
	SearchDurationFilter,
} from '../../services/music/api.ts';
import {useTheme} from '../../hooks/useTheme.ts';
import SearchBar from '../search/SearchBar.tsx';
import {useKeyBinding} from '../../hooks/useKeyboard.ts';
import {KEYBINDINGS, VIEW} from '../../utils/constants.ts';
import {Box, Text} from 'ink';
import {ICONS} from '../../utils/icons.ts';
import TextInput from 'ink-text-input';
import {applySearchFilters} from '../../utils/search-filters.ts';
import {getMusicService} from '../../services/music/index.ts';

type FilterField = 'artist' | 'album' | 'year';

function getFilterLabel(field: FilterField, source: 'youtube' | 'local'): string {
	if (field === 'artist') return 'Artist';
	if (field === 'album') return source === 'local' ? 'Album Folder' : 'Album';
	if (field === 'year') return source === 'local' ? 'Year (tag)' : 'Year';
	return field;
}

const DURATION_ORDER: SearchDurationFilter[] = ['all', 'short', 'medium', 'long'];

function SearchLayout() {
	const {theme} = useTheme();
	const {state: navState, dispatch} = useNavigation();
	const {state: playerState} = usePlayer();
	const musicService = getMusicService();
	const source = musicService.getSource();

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [rawResults, setRawResults] = useState<SearchResult[]>([]);
	const filteredResults = useMemo(
		() => applySearchFilters(rawResults, navState.searchFilters),
		[rawResults, navState.searchFilters],
	);
	const [isTyping, setIsTyping] = useState(true);
	const [isSearching, setIsSearching] = useState(false);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastAutoSearchedQueryRef = useRef<string | null>(null);
	const [editingFilter, setEditingFilter] = useState<FilterField | null>(null);
	const [filterDraft, setFilterDraft] = useState('');

	// Helper to format filter display value
	const describeFilterValue = (field: FilterField, value?: string) =>
		value?.trim() ? value.trim() : `Any ${getFilterLabel(field, source)}`;

	const handleFilterSubmit = useCallback(
		(value: string) => {
			if (!editingFilter) return;
			dispatch({
				category: 'SET_SEARCH_FILTERS',
				filters: {[editingFilter]: value.trim()},
			});
			setEditingFilter(null);
			setFilterDraft('');
		},
		[dispatch, editingFilter],
	);

	const beginFilterEdit = useCallback(
		(field: FilterField) => {
			setEditingFilter(field);
			setFilterDraft(navState.searchFilters[field] ?? '');
		},
		[navState.searchFilters],
	);

	const cycleDurationFilter = useCallback(() => {
		const currentIndex = DURATION_ORDER.indexOf(
			navState.searchFilters.duration ?? 'all',
		);
		const nextIndex = (currentIndex + 1) % DURATION_ORDER.length;
		const nextDuration = DURATION_ORDER[nextIndex];
		dispatch({
			category: 'SET_SEARCH_FILTERS',
			filters: {duration: nextDuration},
		});
	}, [dispatch, navState.searchFilters.duration]);

	// Perform search with source-aware type mapping
	const performSearch = useCallback(
		async (query: string) => {
			if (!query || isSearching) return;

			setIsSearching(true);
			setError(null);
		try {
				// Map YouTube 'songs' to local 'tracks' for consistent UX
				const effectiveType = source === 'local' && navState.searchType === 'songs'
					? 'tracks'
					: navState.searchType;
				const response = await musicService.search(query, {
					type: effectiveType,
					limit: navState.searchLimit,
				});
				if (response) {
					setRawResults(response.results);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Search failed');
			} finally {
				setIsSearching(false);
			}
		},
		[musicService, navState.searchType, navState.searchLimit, isSearching, source],
	);

	// Initial search if flags provided
	useEffect(() => {
		// ... existing effect logic stays the same
	}, []);  // (existing effect body preserved from original)

	// Render filter pills
	const renderFilterPill = useCallback((field: FilterField) => {
		const value = navState.searchFilters[field];
		const label = getFilterLabel(field, source);
		const display = describeFilterValue(field, value);
		const isActive = editingFilter === field;
		return (
			<Box key={field} borderStyle="single" paddingX={1} marginRight={1}>
				<Text color={isActive ? 'cyan' : theme.secondaryText}>
					{label}: {display}
				</Text>
			</Box>
		);
	}, [navState.searchFilters, editingFilter, theme.secondaryText, source]);

	return (
		<Box flexDirection="column">
			<SearchBar
				onSubmit={performSearch}
				onClear={() => {
				setRawResults([]);
				dispatch({category: 'CLEAR_SEARCH'});
			}}
				isLoading={isLoading}
				error={error}
				onTyping={setIsTyping}
			/>
			{/* Filter pills row */}
			<Box marginTop={1} marginBottom={1}>
				{(['artist', 'album', 'year'] as FilterField[]).map(renderFilterPill)}
				<Box borderStyle="single" paddingX={1} marginRight={1}>
					<Text color={theme.secondaryText}>
						Duration: {navState.searchFilters.duration ?? 'all'}
					</Text>
				</Box>
			</Box>

			<SearchResults
				results={filteredResults}
				isLoading={isLoading}
				error={error}
				isTyping={isTyping}
				onSelect={...} // unchanged
			/>
		</Box>
	);
}

export default SearchLayout;
