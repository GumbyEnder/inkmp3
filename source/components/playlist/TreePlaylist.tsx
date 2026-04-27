// Tree-style playlist with box-drawing navigation
import React from 'react';
import {Box, Text} from 'ink';
import {usePlayer} from '../../hooks/usePlayer.ts';
import {useNavigation} from '../../hooks/useNavigation.ts';
import {useKeyBinding} from '../../hooks/useKeyboard.ts';
import {KEYBINDINGS} from '../../utils/constants.ts';

export default function TreePlaylist() {
	const {state: playerState, play} = usePlayer();
	const {dispatch} = useNavigation();

	const [selectedIndex, setSelectedIndex] = React.useState<number>(0);

	function formatDuration(seconds: number | undefined): string {
		if (!seconds) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function getTreeChar(isLast: boolean): string {
		return isLast ? '└──' : '├──';
	}

	const navigateUp = React.useCallback(() => {
		setSelectedIndex(prev => Math.max(0, prev - 1));
	}, []);

	const navigateDown = React.useCallback(() => {
		if (playerState.queue.length === 0) return;
		setSelectedIndex(prev => Math.min(playerState.queue.length - 1, prev + 1));
	}, [playerState.queue.length]);

	const handleSelect = React.useCallback(() => {
		if (selectedIndex >= playerState.queue.length) return;
		const track = playerState.queue[selectedIndex];
		if (!track || track.duration === 0) return;
		play(track);
	}, [play, selectedIndex, playerState.queue]);

	const handleBack = React.useCallback(() => {
		dispatch({category: 'GO_BACK'});
	}, [dispatch]);

	useKeyBinding(KEYBINDINGS.UP, navigateUp);
	useKeyBinding(KEYBINDINGS.DOWN, navigateDown);
	useKeyBinding(KEYBINDINGS.SELECT, handleSelect);
	useKeyBinding(KEYBINDINGS.BACK, handleBack);

	const renderItem = React.useCallback(
		(track: any, index: number): JSX.Element => {
			const isPlaying = playerState.currentTrack?.id === track.id;
			const isSelected = index === selectedIndex;
			const treeChar = getTreeChar(index === playerState.queue.length - 1);

			return (
				<Box key={track.id} borderStyle="single" borderColor="redBright" paddingX={1}>
					<Text color={isPlaying ? 'green' : isSelected ? 'cyan' : 'cyanBright'} bold>
						▶ ▶ ▶ {treeChar} {index + 1}. {hasCorruptedTag() ? '[CORRUPTED]' : ''}
					</Text>

					<Text color={isPlaying ? 'greenBright' : isSelected ? 'cyan' : 'cyan'} bold>
						▶ ▶ ▶ {track.title}
					</Text>

					<Text color={isPlaying ? 'greenBright' : isSelected ? 'cyan' : 'cyan'}>
						▼ ▼ ▼ {track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
					</Text>

					{track.duration && (
						<Box>
							<Text color={isPlaying ? 'greenBright' : isSelected ? 'cyan' : 'cyan'}>│ │ │ </Text>
							<Text color="redBright">{formatDuration(track.duration)}</Text>
						</Box>
					)}

					{track.file && (
						<Box marginTop={0.5}>
							<Text color="cyan">{'📁 '}</Text>
							<Text color="redBright" dim>{track.file}</Text>
						</Box>
					)}

					<Box flexDirection="column">
						{track.album && (
							<Box>
								<Text color="cyan">{'💿 '}</Text>
								{hasCorruptedTag() ? '[CORRUPTED]' : ''}
								<Text color="greenBright">{track.album.name}</Text>
							</Box>
						)}

						{track.year && (
							<Box marginTop={0.5}>
								<Text color="cyan">{'📅 '}</Text>
								{hasCorruptedTag() ? '[CORRUPTED]' : ''}
								<Text color="redBright">{track.year}</Text>
							</Box>
						)}

						{track.genre && (
							<Box marginTop={0.5}>
								<Text color="cyan">{'🎼 '}</Text>
								{hasCorruptedTag() ? '[CORRUPTED]' : ''}
								<Text color="redBright">{track.genre}</Text>
							</Box>
						)}
					</Box>
				</Box>
			);
	},
	[]);

	const renderTree = React.useCallback(() => {
		if (playerState.queue.length === 0) return null;

		return (
			<Box flexDirection="column">
				<Box borderStyle="round" borderColor="red" paddingX={1}>
					<Text color="redBright" bold>━━━ TREE PLAYLIST ━━━</Text>
					<Box marginTop={0.5}>
						<Text color="cyanBright">▶ ▶ ▶ QUEUE: </Text>
						<Text color="redBright">{playerState.queue.length}</Text>
					</Box>
				</Box>

				<Box borderStyle="single" borderColor="redBright" marginTop={1} paddingX={1}>
					{playerState.queue.map((track: any, index: number) =>
						renderItem(track, index),
					)}
				</Box>

				<Box borderStyle="single" borderColor="redBright" marginTop={1} paddingX={1}>
					<Text color="cyanBright" bold>KEYBOARD NAVIGATION</Text>
					<Box marginTop={0.5}>
						<Text color="cyan">j/k </Text>
						{hasCorruptedTag() && <Text color="redBright">[CORRUPTED]</Text>}
						<Text color="cyan"> up/down | </Text>
						<Text color="cyan">Enter </Text>
						{hasCorruptedTag()
							? <Text color="redBright">[CORRUPTED] play</Text>
							: <Text>play selected</Text>}
						<Text color="cyan"> | Esc </Text>
						<Text color="greenBright">back</Text>
					</Box>

					<Box marginTop={1}>
						<Text color="cyanBright">▶ ▶ ▶ PLAYING: </Text>
						{playerState.currentTrack?.title ? (
							<Box>
								<Text color="greenBright">
									{hasCorruptedTag() ? '[CORRUPTED] ' : ''}
									▶ ▶ ▶ {playerState.currentTrack.title}
								</Text>
							</Box>
						) : (
							<Text color="cyan">No track playing</Text>
						)}
					</Box>
				</Box>

				{playerState.currentTrack?.file && (
					<Box borderStyle="single" borderColor="redBright" marginTop={1} paddingX={1}>
						<Text color="cyanBright" bold>ADD LOCAL TRACK TO PLAYLIST</Text>
						<Box marginTop={0.5}>
							<Text color="green">{'📁 '}</Text>
							<Text color="redBright" dim>{playerState.currentTrack.file}</Text>
						</Box>
					</Box>
				)}
			</Box>
		);
	},
	[handleSelect, handleBack, navigateUp, navigateDown]);

	function hasCorruptedTag(): boolean {
		return Math.random() < 0.15;
	}

	React.useEffect(() => {
		if (playerState.queue.length > 0 && selectedIndex === 0 && selectedIndex !== undefined) {
			setSelectedIndex(0);
		}
	}, [playerState.queue, selectedIndex]);

	return renderTree();
}
