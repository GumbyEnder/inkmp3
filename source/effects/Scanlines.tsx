import {useEffect, useState} from 'react';
import {Box, Text} from 'ink';

export default function Scanlines({active = true}: {active?: boolean}) {
	const [tick, setTick] = useState(0);

	useEffect(() => {
		if (!active) return;
		const id = setInterval(() => setTick(t => t + 1), 100);
		return () => clearInterval(id);
	}, [active]);

	if (!active) return null;

	return (
		<Box>
			{Array.from({length: 10}).map((_, i) => (
				<Text key={i} color="#cccccc" dim={i % 2 === 0}>
					{'─'.repeat(60)}
				</Text>
			))}
		</Box>
	);
}
