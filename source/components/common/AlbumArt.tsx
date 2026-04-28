import { Box, Text } from "ink";

interface Props {
  coverUrl?: string;
}

const PLACEHOLDER_SKULL: string[] = [
  "▓▓▓▓▓▒░░░░░░▓▓▓▓▓",
  "▓▒▓▓▒░░░░░░░░░▒▓▓",
  "▓░▓▓░░░░░░░░░░░▓",
  "▓░▓▓░░░▓▓░░░░░▓",
  "▓▒░▓░░░▓░░░░░░▒",
  "▓░░▓░▓▓▓░░░░░░",
  "▓░░▓░▒░░▓░░░░░",
  "▓░▓░░▒░░░▒▓░░░",
  "▓▒░▓▓░░░░░▓░▓▒",
  "▓░░▓▓░░░░░░▓░░",
  "▓▒▓▓░░░░░░░░▓▒",
];

export function AlbumArt({ coverUrl }: Props) {
  if (!coverUrl || typeof coverUrl !== "string" || coverUrl.trim() === "") {
    return (
      <Box borderStyle="double" borderColor="redBright">
        <Text dimColor={true}>
          [ NO BLOOD PORTRAIT ]
        </Text>
      </Box>
    );
  }

  try {
    const { stdout, success } = Bun.spawnSync([
      "chafa",
      "--size=24x24",
      "--format=unicode",
      coverUrl,
    ]);

    if (success && stdout && (Buffer.isBuffer(stdout) ? stdout.length > 0 : typeof stdout === "string" && stdout.length > 0)) {
      const asciiArt = Buffer.isBuffer(stdout) ? stdout.toString() : stdout;

      return (
        <Box borderStyle="double" borderColor="magenta" paddingX={1}>
          <Text color="magenta">{asciiArt}</Text>
        </Box>
      );
    }
  } catch (err) {
    // chafa binary missing, spawn failed, or unsupported platform (e.g., Windows)
    console.debug("AlbumArt: chafa not available or failed:", err);
  }

  // Fallback placeholder when chafa is unavailable or fails
  return (
    <Box borderStyle="double" borderColor="yellow">
      <Text color="yellow" dimColor={true}>
        [ ALBUM ART UNAVAILABLE ]
      </Text>
    </Box>
  );
}
