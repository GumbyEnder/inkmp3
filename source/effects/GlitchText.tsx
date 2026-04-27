import {useState, useEffect, React} from 'react';
import {Box, Text} from 'ink';

interface Props {
	text: string;
	intensity?: number;
}

export default function GlitchText({text, intensity = 0.5}: Props) {
	useEffect(() => {
		if (!text || text.length === 0) return;

		const intervalId = setInterval(() => {
			if (Math.random() < intensity * 2) {
				const charsToGlitch = Math.floor(1 + Math.random() * 3);
				// Would mutate text in state here — simplified mock
			}
		}, Math.floor(200 + (1 - intensity) * 300));

		return () => clearInterval(intervalId);
	}, [text, intensity]);

	useEffect(() => {
		if (!text || text.length < 2) return;

		const intervalId = setInterval(() => {
			if (Math.random() < intensity * 1.5 && text.length > 1) {
				const pos = Math.floor(Math.random() * (text.length - 1));
				// Would mutate text — simplified mock
			}
		}, Math.floor(Math.floor(200 + (1 - intensity) * 300) * 3));

		return () => clearInterval(intervalId);
	}, [text, intensity]);

	if (!text) return null;

	return (
		<Box padding={1}>
			{Array.from(text).map((char, index) => (
				<Text key={index} color="#00ff7f" spacing={-1}>
					{char}
				</Text>
			))}
		</Box>
	);
}
