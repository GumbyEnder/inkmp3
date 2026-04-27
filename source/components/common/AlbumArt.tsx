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
    const { stdout } = Bun.spawnSync([
      "chafa",
      `--size=24x24`,
      `--format=unicode`,
      coverUrl,
    ]);

    if (stdout && typeof stdout === "string" || (Buffer.isBuffer(stdout) && stdout.length > 0)) {
      const asciiArt = Buffer.isBuffer(stdout) ? stdout.toString() : stdout;

      return (
        <Box borderStyle="double" borderColor="redBright">
          {asciiArt.split("\n").map((line: string, index: number) => (
            <Text key={index}>{line}</Text>
          ))}
        </Box>
      );
    }
  } catch {
    // chafa failed or is not available
  }

  return (
    <Box borderStyle="double" borderColor="redBright">
      {PLACEHOLDER_SKULL.map((line: string, index: number) => (
        <Text key={index}>{line}</Text>
      ))}
    </Box>
  );
}