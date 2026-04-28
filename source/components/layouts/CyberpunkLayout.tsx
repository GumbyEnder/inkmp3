// CyberpunkLayout - Responsive TUI music player layout
// Automatically adapts to narrow terminals (< 120 cols) by switching to compact mode
// Compatible with Ink 7.x + TypeScript strict mode

import React from 'react';
import {Box, Text} from 'ink';
import {usePlayer} from '../../hooks/usePlayer.ts';
import {useTerminalSize} from '../../hooks/useTerminalSize.ts';
import FFTVisualizer from '../visualizer/FFTVisualizer.tsx';
import { AlbumArt } from '../common/AlbumArt';
import TreePlaylist from '../playlist/TreePlaylist.tsx';
import ProgressBar from '../common/ProgressBar.tsx';

const COMPACT_WIDTH_THRESHOLD = 120;

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function getTrackDisplayInfo(track: {title?: string; artists?: Array<{name: string}>; album?: {name: string}} | null | undefined): React.ReactNode {
  if (!track) return <Text color="gray">—</Text>;

  const parts: React.ReactNode[] = [];

  // Title (always)
  parts.push(<Text color="cyan" key="title" bold>{track.title || '(unknown)'}</Text>);

  // Artist(s)
  if (track.artists && track.artists.length > 0) {
    const artistStr = track.artists.map(a => a.name).join(', ');
    parts.push(<Text key="artist" color="gray"> • {truncate(artistStr, 30)}</Text>);
  }

  // Album
  if (track.album?.name) {
    parts.push(<Text key="album" color="gray"> • {truncate(track.album.name, 40)}</Text>);
  }

  return <>{parts}</>;
}

export default function CyberpunkLayout() {
  const {columns} = useTerminalSize();
  const {state: playerState} = usePlayer();
  const currentTrack = playerState.currentTrack;
  const isCompact = columns < COMPACT_WIDTH_THRESHOLD;

  // ──────────────────────────────────────────────────────────────
  //  Render helpers
  // ──────────────────────────────────────────────────────────────

  const renderTopBar = () => (
    <Box
      borderStyle="single"
      borderBottom
      paddingX={1}
      flexDirection="row"
      justifyContent="space-between"
    >
      <Text bold>♯ CYBERPUNK PLAYER</Text>
      <Box flexDirection="row" alignItems="center">
        <Text color="red">■</Text>
        <Text color="gray" paddingX={1}>
          LIVE • VIZ: {isCompact ? 'COMPACT' : 'ACTIVE'}
        </Text>
      </Box>
    </Box>
  );

  const renderVisualizer = () => {
    if (isCompact) return null;

    return (
      <Box
        borderStyle="single"
        borderBottom
        paddingX={1}
        flexDirection="column"
        alignItems="center"
      >
        <Text color="gray" fontSize={8}>SPECTRUM</Text>
        {Array.from({length: Math.min(30, columns - 4)}).map((_, i) => {
          const amplitude = Math.random();
          const bar = '│'.repeat(Math.floor(amplitude * 5) + 1);
          return (
            <Text
              key={i}
              color={amplitude > 0.8 ? 'yellow' : amplitude > 0.5 ? 'cyan' : 'gray'}
            >
              {bar.padEnd(5)}
            </Text>
          );
        })}
      </Box>
    );
  };

  const renderLeftColumn = () => (
    <Box flexDirection="column" borderStyle="single" borderTop={false} borderBottom paddingX={1}>
      {!isCompact && FFTVisualizer()}
      {!isCompact && <AlbumArt />}

      <Box borderStyle="double" paddingX={1} flexDirection="column" alignItems="center">
        <Text bold color="green">═══ LEGEND ═══</Text>

        {currentTrack ? (
          <Box flexDirection="column" marginTop={1}>
            <Box flexDirection="row" alignItems="baseline">
              <Text color="cyan" fontSize={7} bold>🎵</Text>
              {getTrackDisplayInfo(currentTrack)}
            </Box>

            {currentTrack.duration && !isCompact && (
              <Box flexDirection="row" alignItems="center" marginTop={0.5}>
                <Text color="red" fontSize={6}>⏱</Text>
                <Text color="gray" paddingX={1}>
                  {Math.floor(currentTrack.duration / 60)}:
                  {String(Math.floor(currentTrack.duration % 60)).padStart(2, '0')}
                </Text>
              </Box>
            )}
          </Box>
        ) : (
          <Box flexDirection="column" alignItems="center" paddingY={1}>
            <Text color="gray" fontSize={8}>═══ LEGEND ═══</Text>
            <Text color="gray" paddingX={1}>No track loaded</Text>
          </Box>
        )}
      </Box>

      {!isCompact && (
        <Box borderStyle="single" borderTop={false} paddingX={1} marginTop={0.5}>
          <Text color="gray" fontSize={7}>═══ STATUS ═══</Text>
          <Text color="yellow" paddingX={1}>{isCompact ? 'COMPACT' : 'NORMAL'} MODE</Text>
        </Box>
      )}
    </Box>
  );

  const renderCenterColumn = () => {
    if (isCompact) {
      return (
        <Box flexDirection="column" paddingX={0} alignItems="center">
          {renderVisualizer()}
          <Box borderStyle="single" borderTop={false} paddingX={1} flexDirection="column">
            <Text bold color="red">PLAYLIST</Text>
            {currentTrack ? (
              <Box flexDirection="row" alignItems="center" paddingX={1}>
                <Text color="yellow" fontSize={7}>▶</Text>
                <Text paddingX={1}>{currentTrack.title}</Text>
              </Box>
            ) : (
              <Text color="gray" paddingX={1}>No playlist</Text>
            )}
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" borderStyle="single" borderTop={false} paddingX={1}>
        {renderVisualizer()}

        <Box borderStyle="single" borderTop paddingX={1} flexDirection="column">
          <Text bold color="cyan">═══ TRACKLIST ═══</Text>

          {currentTrack ? (
            <Box flexDirection="row" alignItems="center" paddingX={1}>
              <Text color="yellow">•───</Text>
              <Text paddingX={1}>{currentTrack.title}</Text>
            </Box>
          ) : (
            <Text color="gray" paddingX={1}>No tracks</Text>
          )}
        </Box>
      </Box>
    );
  };

  const renderRightColumn = () => {
    if (isCompact) return null;

    return (
      <Box flex={1} flexDirection="column" borderStyle="single" borderTop={false} paddingX={1} alignItems="center">
        {currentTrack ? (
          <Box borderStyle="double" paddingX={1} flexDirection="column" alignItems="center">
            <Text bold color="magenta">═══ TRACK ═══</Text>
            {getTrackDisplayInfo(currentTrack)}
          </Box>
        ) : (
          <Box borderStyle="single" borderTop paddingX={1} alignItems="center">
            <Text color="gray" fontSize={8}>═══ TRACK ═══</Text>
          </Box>
        )}

        <Box borderStyle="single" borderTop paddingX={1} marginTop={0.5} alignItems="center">
          <Text color="gray" fontSize={6}>═══ ART ═══</Text>
        </Box>
      </Box>
    );
  };

  const renderFooter = () => (
    <Box
      borderTop
      paddingX={1}
      flexDirection="row"
      justifyContent="space-between"
    >
      {isCompact ? (
        <Box flexDirection="column">
          <Text color="cyan" fontSize={7}>⮀ ⏮ │ ⏭ ⏯</Text>
          <Text color="gray" paddingX={1}>← ↑↓ → • Enter Play</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text color="cyan" fontSize={7}>⮀ ⏮ │ ⏭ ⏯</Text>
          <Text color="gray" paddingX={1}>← ↑↓ → • Enter Play</Text>
        </Box>
      )}
    </Box>
  );

  // ──────────────────────────────────────────────────────────────
  //  Main layout
  // ──────────────────────────────────────────────────────────────
  return (
    <Box flexDirection="column">
      {renderTopBar()}

      <Box flexGrow={1} flexDirection="row">
        <Box flex={1}>{renderLeftColumn()}</Box>
        <Box flex={2}>{renderCenterColumn()}</Box>
        {!isCompact && <Box flex={1}>{renderRightColumn()}</Box>}
      </Box>

      {renderFooter()}
    </Box>
  );
}
