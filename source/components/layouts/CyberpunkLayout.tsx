// Cyberpunk 3-column grid layout
import {Box, Text} from 'ink';
import {usePlayer} from '../../hooks/usePlayer.ts';
import FFTVisualizer from '../visualizer/FFTVisualizer.tsx';
import TreePlaylist from '../playlist/TreePlaylist.tsx';
import ProgressBar from '../common/ProgressBar.tsx';

export default function CyberpunkLayout() {
	const {state: playerState} = usePlayer();

	return (
		<Box flexDirection="row">
			{/* LEFT COLUMN (30%) - Visualizer + Metadata */}
			<Box flex={1}>
				<Box borderStyle="double" borderColor="green" paddingX={1}>
					<Text color="cyanBright" bold>━━━ VISUALIZER ━━━</Text>
					<FFTVisualizer />
				</Box>

				<Box borderStyle="round" borderColor="greenBright" marginTop={1} paddingX={1}>
					<Text color="cyan" bold>TRACK METADATA</Text>

					{playerState.currentTrack?.file && (
						<Box marginTop={1}>
							<Text color="green">{'📁 '}</Text>
							<Text color="greenBright" dim>{playerState.currentTrack.file}</Text>
						</Box>
					)}

					{playerState.currentTrack?.album && (
						<Box marginTop={1}>
							<Text color="green">{'💿 '}</Text>
							<Text>{getCorruptedTag()}</Text>
							<Text color="greenBright">{playerState.currentTrack.album.name}</Text>
						</Box>
					)}

					{playerState.currentTrack?.artists && (
						<Box marginTop={1}>
							<Text color="green">{'🎤 '}</Text>
							<Text>{getCorruptedTag()}</Text>
							<Text color="greenBright">
								{playerState.currentTrack.artists.map(a => a.name).join(', ')}
							</Text>
						</Box>
					)}

					{playerState.currentTrack?.title && (
						<Box marginTop={1}>
							<Text color="green">{'🎵 '}</Text>
							<Text>{getCorruptedTag()}</Text>
							<Text color="greenBright" bold>{playerState.currentTrack.title}</Text>
						</Box>
					)}
				</Box>
			</Box>

			{/* CENTER COLUMN (40%) - Now Playing + Progress */}
			<Box flex={1.3}>
				<Box borderStyle="double" borderColor="cyanBright" paddingX={1}>
					<Text color="cyanBright" bold>━━━ NOW PLAYING ━━━</Text>

					{playerState.currentTrack && (
						<Box borderStyle="round" borderColor="cyan" marginTop={1} paddingX={1}>
							<Text bold color="cyan">{playerState.currentTrack.title}</Text>
							<Box>{' • '}</Box>
							<Text color="cyan">▼ ▼ ▼</Text>
							<Text color="greenBright">
								{playerState.currentTrack.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
							</Text>
						</Box>
					)}

					{playerState.currentTrack.album && (
						<Box>
							<Text color="greenBright">{'▶ ▶ ▶ '}</Text>
							<Text>{playerState.currentTrack.album.name}</Text>
						</Box>
					)}

					<Box marginTop={1}>
						<Text color="green">{'► ◄ '}</Text>
						<ProgressBar />
					</Box>

					<Box marginTop={1}>
						<Text color="greenBright">{'│ │ │ '}</Text>
						<Text>{playerState.progress?.toFixed(1)}</Text>
						<Text color="greenBright">{'/ '}</Text>
						<Text>{playerState.duration?.toFixed(1)}</Text>
					</Box>

					<Box marginTop={1}>
						{playerState.isLoading && (
							<Box>
								<Text color="greenBright">{'⏳ '}</Text>
								<Text>Loading...</Text>
							</Box>
						)}
						{!playerState.isPlaying && playerState.progress > 0 && (
							<Box>
								<Text color="greenBright">{'⏸ '}</Text>
							</Box>
						)}
						{playerState.shuffle && (
							<Text color="cyan">{'↻ '}</Text>
						)}
					</Box>

					{playerState.error && (
						<Box>
							<Box color="red">{'✗ '}</Box>
							<ErrorText>{playerState.error}</ErrorText>
						</Box>
					)}
				</Box>

				<Box borderStyle="single" borderColor="greenBright" marginTop={1} paddingX={1}>
					<Text color="cyanBright" bold>LYRICS / NOW PLAYING TEXT</Text>
					{playerState.subtitle && (
						<Box>
							<SubtitleText>{playerState.subtitle}</SubtitleText>
						</Box>
					)}
				</Box>

				<Box borderStyle="single" borderColor="greenBright" marginTop={1} paddingX={1}>
					<Text color="cyanBright" bold>KEYBOARD NAVIGATION</Text>
					<NavHint>j/k up/down | Enter select track | Tab switch panels | Esc back</NavHint>
				</Box>
			</Box>

			{/* RIGHT COLUMN (30%) - Tree-style Playlist */}
			<Box flex={1}>
				<Box borderStyle="double" borderColor="redBright" paddingX={1}>
					<Text color="redBright" bold>━━━ PLAYLIST ━━━</Text>

					{playerState.queue.length > 0 ? (
						<Box borderStyle="round" borderColor="red" marginTop={1} paddingX={1}>
							<Text color="cyan" bold>QUEUE ({playerState.queue.length})</Text>

							{playerState.queue.map((track, index) => {
								const isPlaying = playerState.currentTrack?.id === track.id;
								return (
									<Box key={track.id} borderStyle="single" borderColor="redBright" paddingX={1}>
										<Text color={isPlaying ? 'green' : 'cyanBright'}>{`▶ `}{index + 1}</Text>
										<Text color={isPlaying ? 'greenBright' : 'cyan'}>{track.title}</Text>
										<Text color={isPlaying ? 'greenBright' : 'cyan'}>
											▼ ▼ ▼ {track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
										</Text>
										{track.duration && (
											<Box>
												<Text color="redBright">{formatDuration(track.duration)}</Text>
											</Box>
										)}
										{track.file && (
											<Box marginTop={0.5}>
												<Text color="cyan">{'📁 '}</Text>
												<Text color="redBright" dim>{track.file}</Text>
											</Box>
										)}
									</Box>
								);
							})}
						</Box>
					) : (
						<Text color="cyanBright">Empty playlist. Load local tracks or search YouTube.</Text>
					)}

					<Box borderStyle="single" borderColor="redBright" marginTop={1} paddingX={1}>
						<Text color="cyanBright" bold>PLAYLIST ACTIONS</Text>
						<HintText>Enter play selected | j/k navigate | Esc back</HintText>
					</Box>

					{playerState.currentTrack?.file && (
						<Box borderStyle="single" borderColor="redBright" marginTop={1} paddingX={1}>
							<Text color="cyanBright" bold>ADD LOCAL TRACK</Text>
							<FileText>{playerState.currentTrack.file}</FileText>
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
}

// Helper function to randomly add corrupted tags
function getCorruptedTag(): string {
	const corruptionChance = 0.15;
	if (Math.random() < corruptionChance) {
		return '[CORRUPTED] ';
	}
	return '';
}

// Format duration helper
function formatDuration(seconds: number | undefined): string {
	if (!seconds) return '0:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export {formatDuration};
