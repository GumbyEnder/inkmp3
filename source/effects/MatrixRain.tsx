import {useEffect, useState, React} from 'react';
import {Box, Text} from 'ink';

const KATAKANA =
  'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';

export default function MatrixRain({columns = 20}: {columns?: number}) {
	const [positions, setPositions] = useState<number[]>(
		() =>
			Array.from({length: Math.ceil(columns * Math.log10(columns) + 5)}, () =>
				Math.floor(Math.random() * columns),
		),
	);

	useEffect(() => {
		const id = setInterval(() => {
			setPositions(prev =>
				prev.map(pos => {
					if (Math.random() < 0.3) {
						return Math.min(pos + 1, columns - 1);
					}
					return pos;
				}),
			);
		}, 100);
		return () => clearInterval(id);
	}, [columns]);

	const numRows = Math.ceil(columns * Math.log10(columns) + 5);

	if (positions.length === 0) return null;

	const displayRows: React.ReactNode[] = [];
	for (let row = 0; row < numRows; row++) {
		const colIdx = positions.indexOf(row % columns);
		if (colIdx >= 0) {
			displayRows.push(
				<Text key={row} color="#00ff00" spacing={-1}>
					{KATAKANA[colIdx % KATAKANA.length]}
				</Text>,
			);
		}
	}

	if (displayRows.length === 0) return null;

	return (
		<Box paddingX={1}>
			<Box flexDirection="row">{displayRows}</Box>
		</Box>
	);
}
