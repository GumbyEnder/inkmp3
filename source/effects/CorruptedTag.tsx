import {useEffect, useState} from 'react';
import {Box, Text} from 'ink';

interface Props {
	active?: boolean;
}

export default function CorruptedTag({active = true}: Props) {
	const [tick, setTick] = useState(0);
	const [flickerOn, setFlickerOn] = useState(true);

	useEffect(() => {
		if (!active) return;
		const id = setInterval(() => {
			setFlickerOn(prev => !prev);
		}, 500);
		return () => clearInterval(id);
	}, [active]);

	if (!active) {
		return (
			<Box padding={1}>
				<Text color="#880000" spacing={-1}>
					[CORRUPTED]
				</Text>
			</Box>
		);
	}

	return (
		<Box padding={1}>
			{Array.from({length: 8}).map((_, i) => (
				<Text key={i} color={flickerOn ? '#ff0000' : '#880000'} spacing={-1}>
					[CORRUPTED]
				</Text>
			))}
		</Box>
	);
}
