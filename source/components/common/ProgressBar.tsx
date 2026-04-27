// Gradient progress bar with cyan to green fill
import {Box, Text} from 'ink';
import {usePlayer} from '../../hooks/usePlayer.ts';

export default function ProgressBar() {
	const {state: playerState} = usePlayer();

	const progress = Math.max(0, Math.min(playerState.progress, playerState.duration || 0));
	const duration = playerState.duration || 0;
	const percentage = duration > 0 ? Math.min(100, Math.floor((progress / duration) * 100)) : 0;

	const totalWidth = 24;
	const filledWidth = Math.max(0, Math.floor((percentage / 100) * totalWidth));

	function getProgressColor(pct: number): string {
		if (pct < 25) return 'cyan';
		if (pct < 50) return 'cyanBright';
		if (pct < 75) return 'green';
		return 'greenBright';
	}

	function getSegmentColor(segmentIndex: number): string {
		const pctPerSegment = 100 / totalWidth;
		const segmentPct = (segmentIndex + 1) * pctPerSegment - pctPerSegment / 2;
		if (segmentPct < 25) return 'cyan';
		if (segmentPct < 50) return 'cyanBright';
		if (segmentPct < 75) return 'green';
		return 'greenBright';
	}

	const segments = Array.from({length: totalWidth}, (_, i) => {
		const isFilled = i < filledWidth;
		const color = isFilled ? getSegmentColor(i) : undefined;
		return <Text key={i} color={color}>{'█'}</Text>;
	});

	const emptySegments = Array.from(
		{length: totalWidth - filledWidth},
		(_, i) => <Text key={`empty-${i}`} color="gray">{'░'}</Text>,
	);

	function padTime(val: number): string {
		return val.toString().padStart(2, '0');
	}

	const currentSeconds = Math.floor(progress % 60);
	const totalSeconds = duration - Math.floor(duration / 60) * 60;

	return (
		<Box flexDirection="row">
			<Text color="cyanBright" bold>{'▶ ▶ ▶ '}</Text>
			<Text color="cyan">{padTime(currentSeconds)}</Text>
			<Text color={getProgressColor(percentage)} bold={percentage > 0}>/</Text>
			<Text color="cyanBright">{padTime(totalSeconds)}</Text>

			<Box
				borderStyle="double"
				borderColor={getProgressColor(percentage)}
				marginTop={0.5}
				paddingX={1}
			>
				<Box flexDirection="row">{segments}</Box>
				<Box flexDirection="row" marginTop={0.5}>{emptySegments}</Box>
			</Box>

			<Text color={getProgressColor(percentage)} bold={percentage > 30}>
				({percentage}%){' ▶ ▶ ▶ '}
			</Text>

			<Box flexDirection="row" marginTop={0.5}>
				{playerState.isLoading && <Text color="cyanBright">{'⏳ '}</Text>}
				{!playerState.isPlaying && progress > 0 && (
					<Text color="greenBright">{'⏸ '}</Text>
				)}
				{playerState.shuffle && <Text color="cyan">{'↻ '}</Text>}
				{playerState.repeat !== undefined && playerState.repeat > 0 && (
					<Text color="greenBright">{'◀ ▶ '}</Text>
				)}
			</Box>

			<Box borderStyle="single" borderColor="cyanBright" marginTop={1} paddingX={1}>
				<Text color="cyanBright" bold>LEGEND</Text>
				<Box marginTop={0.5}>
					<Text color="cyan">▶ ▶ ▶ </Text>
					{hasCorruptedTag() && <Text color="redBright">[CORRUPTED]</Text>}
					<Text color="cyan"> cyan → green gradient fill | </Text>
					<Text color="gray">░ empty</Text>
				</Box>
				<Box marginTop={0.5}>
					<Text color="cyan">▶ ▶ ▶ </Text>
					{hasCorruptedTag() && <Text color="redBright">[CORRUPTED]</Text>}
					<Text color="cyan"> 0-25% cyan | </Text>
					<Text color="cyanBright">25-50% cyanBright</Text>
				</Box>
				<Box marginTop={0.5}>
					<Text color="green">▶ ▶ ▶ </Text>
					{hasCorruptedTag() && <Text color="redBright">[CORRUPTED]</Text>}
					<Text color="green"> 50-75% green | </Text>
					<Text color="greenBright">75-100% green</Text>
				</Box>
				<Box marginTop={0.5}>
					<Text color="greenBright">▶ ▶ ▶ </Text>
					{hasCorruptedTag() && <Text color="redBright">[CORRUPTED]</Text>}
					<Text color="greenBright"> Total: {totalWidth} segments | </Text>
					<Text color="cyan">Filled: {filledWidth}</Text>
				</Box>
			</Box>
		</Box>
	);
}

function hasCorruptedTag(): boolean {
	return Math.random() < 0.15;
}
