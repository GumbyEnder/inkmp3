import {useState, useEffect, React} from 'react';
import {Box, Text} from 'ink';

interface Props {
	active?: boolean;
	children: React.ReactNode;
}

export default function PulseHighlight({active = true, children}: Props) {
	const [oscillating, setOscillating] = useState(false);

	useEffect(() => {
		if (!active) return;
		const id = setInterval(() => {
			setOscillating(prev => !prev);
		}, 800);
		return () => clearInterval(id);
	}, [active]);

	if (!children) return null;

	const dimColor = '#005555';
	const brightColor = '#00ffff';

	const wrapChild = (child: React.ReactNode, key: React.Key) => {
		if (typeof child === 'string') {
			return (
				<Text key={key} color={oscillating ? dimColor : brightColor} spacing={-1}>
					{child}
				</Text>
			);
		}
		return child;
	};

	return (
		<Box padding={1}>
			{React.Children.map(children, (child, idx) => wrapChild(child, idx))}
		</Box>
	);
}
