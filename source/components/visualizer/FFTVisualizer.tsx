// FFT Visualizer Component
import {Box, Text} from 'ink';
import {useEffect, useState, useCallback} from 'react';

const BLOCK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export default function FFTVisualizer() {
	const BAR_WIDTH = 24;
	const UPDATE_INTERVAL = 50;

	const [bars, setBars] = useState<number[]>(
		Array.from({length: BAR_WIDTH}, () => Math.random() * 100),
	);

	const simulateAudioData = useCallback(() => {
		let baseLevel = 60;
		for (let i = 1; i < BAR_WIDTH / 2; i++) {
			const harmonic = Math.sin(i * 0.3) * 20;
			baseLevel += harmonic;
			const noise = (Math.random() - 0.5) * 10;
			baseLevel += noise;
			baseLevel = Math.max(10, Math.min(90, baseLevel));
		}
		return Array.from({length: BAR_WIDTH}, (__, i) => {
			let value = baseLevel;
			if (i < 8) {
				value += Math.sin(i * 0.5) * 15;
			}
			if (i >= 8 && i < 20) {
				value += Math.sin(i * 0.3 + 1) * 10;
			}
			if (i >= 20) {
				value -= (i - 20) * 2;
			}
			return Math.max(5, Math.min(80, value));
		});
	}, []);

	const getBarColor = useCallback((i: number, height: number): string => {
		if (i < 8) {
			const shade = Math.floor((height / 100) * 6);
			return ['cyan', 'greenBright'][shade];
		} else if (i < 20) {
			const shade = Math.floor((height / 80) * 3);
			return ['cyan', 'green', 'greenBright'][Math.min(2, shade)];
		} else {
			const shade = Math.floor((height / 80) * 4);
			return ['red', 'yellow', 'yellowBright'][Math.min(2, shade)];
		}
	}, []);

	const getAnimatedColor = useCallback(
		(i: number, height: number): string => {
		if (Math.random() < 0.05) {
			return 'whiteBright';
		}
		return getBarColor(i, height);
	},
	[getBarColor],
	);

	useEffect(() => {
		setBars(simulateAudioData());
		const interval = setInterval(() => {
			setBars(prevBars => {
				return prevBars.map((oldHeight, i) => {
					const newHeight = simulateAudioData()[i];
					const lerpFactor = 0.85;
					const smoothed = oldHeight * lerpFactor + newHeight * (1 - lerpFactor);
					return Math.max(0, smoothed);
				});
			});
		}, UPDATE_INTERVAL);
		return () => clearInterval(interval);
	}, [simulateAudioData]);

	const renderBars = useCallback(() => {
		if (bars.length === 0) return null;
		return (
			<Box flexDirection="row">
				{bars.map((height, i) => {
					const char = BLOCK_CHARS[Math.floor(height / 12.5)];
					const color = getAnimatedColor(i, height);
					return <Text key={i} color={color}>{char}</Text>;
				})}
			</Box>
		);
	}, [bars, getAnimatedColor]);

	const renderWaveform = useCallback(() => {
		if (bars.length === 0) return null;
		const waveHeight = Math.max(5, Math.min(bars[0], 15));
		return (
			<Box flexDirection="column">
				{renderBars()}
				<Box marginTop={0.5}>
					{Array.from({length: BAR_WIDTH}).map((_, i) => {
						const waveY = Math.sin(i * 0.4 + Date.now() / 200) * 8;
						const barHeight = bars[i] + waveY;
						return (
							<Box key={i} flexDirection="row">
								<Text color="greenBright">{'│'}</Text>
								{barHeight > 5 && (
									<Text color={getAnimatedColor(i, barHeight)}>•</Text>
								)}
								<Text color="greenBright">{'│'}</Text>
							</Box>
						);
					})}
				</Box>
			</Box>
		);
	}, [renderBars, getAnimatedColor, bars]);

	return (
		<Box flexDirection="column">
			{renderWaveform()}
			<Box borderStyle="single" borderColor="cyanBright" marginTop={1} paddingX={1}>
				<Text color="cyanBright" bold>LEGEND</Text>
				<Box flexDirection="row">
					{Array.from({length: 3}).map((_, i) => {
						const color = ['cyan', 'greenBright'][i];
						return (
							<Text key={`low-${i}`} color={color}>
								▁ {['BASS', 'LOW', 'MID'][i]}
							</Text>
						);
					})}
					{Array.from({length: 3}).map((_, i) => {
						const color = ['green', 'greenBright'][i];
						return (
							<Text key={`mid-${i}`} color={color}>
								▂ {['MID', 'VOCAL', 'HI-MID'][i]}
							</Text>
						);
					})}
					{Array.from({length: 3}).map((_, i) => {
						const color = ['red', 'yellow', 'yellowBright'][i];
						return (
							<Text key={`high-${i}`} color={color}>
								▃ {['HI-MID', 'HIGH', 'BRIGHT'][i]}
							</Text>
						);
					})}
					{Array.from({length: 1}).map((_, i) => {
						return (
							<Text key={`flash-${i}`} color="whiteBright">
								▄ FLASH
							</Text>
						);
					})}
				</Box>
				<Box marginTop={1}>
					<Text color="cyanBright">Update: {UPDATE_INTERVAL}ms | Bars: {BAR_WIDTH}</Text>
				</Box>
			</Box>
			<Box borderStyle="single" borderColor="greenBright" marginTop={1} paddingX={1}>
				<Text color="cyanBright" bold>STATUS</Text>
				<Text color="greenBright">{'▶ '}</Text>
				<Text color="cyan">Visualizer Active | Simulated Audio Data | Ready for real audio hookup</Text>
			</Box>
		</Box>
	);
}
