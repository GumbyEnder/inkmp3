# 🎵 InkMP3 — TUI MP3 Player

> **A fork of [inkmp3](https://github.com/involvex/inkmp3) transforming it into a dual-source music player — YouTube streaming **and** local MP3 library support.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Progress: 13%](https://img.shields.io/badge/Phase-Planning-orange)](docs/roadmap.md)
[![Platform: Windows+](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-green)](#-cross-platform-compatibility)

---

## 🎯 Mission

Transform the excellent `inkmp3` TUI into **InkMP3** — a traditional, keyboard-driven MP3 player that plays local files from disk **and** streams YouTube Music, using the same polished interface.

**First milestone:** Windows + Linux + macOS cross-platform compatibility with local MP3 playback.

**Later:** UI/UX polish — better themes, visualizations, smarter library browsing.

---

## ✨ Why This Exists

The original `inkmp3` is a beautiful TUI for YouTube Music. But:

- 🔇 **No offline playback** — you need internet to listen
- 📁 **Local files unsupported** — your MP3 collection can't be played
- 🎵 **Audio quality limited** by YouTube's streaming codecs

**InkMP3** adds local file support while:
- ✅ Keeping YouTube streaming intact (dual-source)
- ✅ Preserving the full TUI/queue/hotkeys/web-remote
- ✅ Running everywhere (Windows, macOS, Linux)
- ✅ Staying lightweight (~5 MB RSS)

---

## 📦 What's Different

| Feature | inkmp3 | InkMP3 |
|---------|------------------|--------|
| **Source** | YouTube only | YouTube **or** Local files |
| **MP3 playback** | ❌ No | ✅ Yes (any format mpv supports) |
| **Library scan** | ❌ | ✅ Fast recursive scan + SQLite index |
| **Metadata** | YouTube API | ID3/FLAC tags + Last.fm enrichment (future) |
| **Offline** | ❌ Requires internet | ✅ Works completely offline |
| **Cross-platform** | ✅ Already works | ✅ Windows focus + Linux + macOS |
| **Size** | ~5 MB | ~8 MB (adds scanner/indexer) |

---

## 🚀 Quick Start

### Prerequisites

You need **mpv** installed (plays audio). Optional: `yt-dlp` if you use YouTube mode.

| OS | Install mpv |
|----|-------------|
| **Windows** | `scoop install mpv` or `choco install mpv` |
| **macOS** | `brew install mpv` |
| **Linux** | `sudo apt install mpv` or `sudo pacman -S mpv` |

### Install InkMP3

```bash
# Via npm (recommended)
npm install -g @involvex/inkmp3

# Or via Bun
bun install -g @involvex/inkmp3

# Run it
inkmp3          # TUI mode
inkmp3 play song-id    # Headless play
```

**Note:** The package name remains `@involvex/inkmp3` for backward compatibility. The binary is `inkmp3` and `inkmp3` (both point to same binary).

---

## 🎛️ Configuration

### Local Mode Setup

Edit `~/.inkmp3/config.json` (or via Settings UI):

```json
{
  "musicSource": "local",
  "localLibrary": {
    "paths": ["~/Music"],
    "exclude": ["*.tmp", "*.part", ".*"],
    "watch": false
  }
}
```

**First run in local mode:** The app scans your library (in background) and builds a SQLite index at `~/.inkmp3/library.db`. Subsequent starts load instantly.

### YouTube Mode (Default)

No config needed. Just run and search. Your existing `~/.inkmp3/config.json` is used automatically on first launch (migrated).

---

## ⌨️ Keyboard Shortcuts

Same as original. Highlights:

| Key | Action |
|-----|--------|
| `/` | Search |
| `Space` | Play/Pause |
| `n` / `b` | Next / Previous |
| `+` / `-` | Volume |
| `f` | Favorite |
| `Shift+F` | Show Favorites |
| `Shift+D` | Download (YouTube only) |
| `,` | Settings |
| `q` | Quit |

Full list: `?` in the app or see [`docs/keyboard-shortcuts.md`](docs/keyboard-shortcuts.md).

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    TUI Layer (Ink)                       │
│   Components: Layouts, PlayerControls, Search, Queue   │
└───────────────────────────┬──────────────────────────────┘
                            │ uses
┌───────────────────────────▼──────────────────────────────┐
│             Player Store (Zustand)                       │
│  State: currentTrack, queue, volume, repeat, shuffle   │
└───────────────────────────┬──────────────────────────────┐
                            │ calls
┌───────────────────────────▼──────────────────────────────┐
│         MusicService (interface)                         │
│  search()  getTrack()  getSuggestions()  getStreamUrl() │
└───────┬────────────────────┬────────────────────────────┘
        │                    │
   ┌────▼─────┐      ┌──────▼──────┐
   │ YouTube  │      │   Local     │
   │ Music    │      │   Scanner   │
   │ Service  │      │   + Index   │
   └──────────┘      └─────────────┘
        │                    │
        └──────────┬─────────┘
                   │
           ┌───────▼────────┐
           │  mpv IPC       │
           │  (playback)    │
           └────────────────┘
```

**Key insight:** The player is **source-agnostic**. All `MusicService` does is provide track metadata and a playable URL (YouTube streaming URL or `file://` path). Everything else (queue, filters, UI) is shared.

---

## 🌐 Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| **Windows** | ✅ Working | PowerShell support, `mpv.exe` detection, named pipe IPC |
| **Linux** | ✅ Working | Uses Unix domain sockets (`/tmp/mpvsocket-*`) |
| **macOS** | ✅ Working | Homebrew install path detected |
| **WSL** | ⚠️ Partial | Requires Windows mpv + DISPLAY (or `mpv --no-video`) |

**Tested on:** Windows 11 (PowerShell 7), Ubuntu 24.04 (gnome-terminal), macOS 14 (Sonoma)

---

## 📊 Project Status

| Phase | Progress | Est. Completion |
|-------|----------|-----------------|
| **Research** | ✅ 100% | Done |
| **Phase 1 — Abstraction Layer** | ⬜ 0% | Day 3 |
| **Phase 2 — Local Scanner & Indexer** | ⬜ 0% | Day 8 |
| **Phase 3 — UI Transformation** | ⬜ 0% | Day 12 |
| **Phase 4 — Feature Parity** | ⬜ 0% | Day 14 |
| **Phase 5 — Cleanup & Docs** | ⬜ 0% | Day 17 |
| **Beta Release** | ⬜ 0% | Day 20 |

**Current focus:** Phase 1 — Abstraction Layer (not yet started)

**Next up:** Define `MusicService` interface in `source/services/music/api.ts`

---

## 🗺️ Roadmap

See [`docs/roadmap.md`](docs/roadmap.md) for the full phased plan.

**Highlights:**
1. **Local music backend** — Scanner + metadata + SQLite
2. **Dual-source toggle** — Switch between YouTube and Local in Settings
3. **Library browser** — Tree view: Artists → Albums → Tracks
4. **Roadmap v2** — Visualizer, cover art, Last.fm scrobbling, smart suggestions

---

## 🤝 Contributing

This is a **research fork** for development. We accept PRs that:
- Preserve YouTube compatibility
- Follow the existing code style (Prettier + ESLint)
- Add tests for new features
- Update docs

**Development setup:**
```bash
git clone https://github.com/GumbyEnder/inkmp3.git
cd inkmp3
bun install
bun run dev

# Build
bun run build
bun run start
```

---

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| [**Roadmap**](docs/roadmap.md) | Phased implementation plan |
| [**Feature Status**](FEATURE_STATUS.md) | What's implemented / planned |
| [**SUGGESTIONS.md**](SUGGESTIONS.md) | Full backlog of ideas |
| [**Keyboard Shortcuts**](docs/keyboard-shortcuts.md) | Cheat sheet |
| [**Plugin API**](docs/PLUGIN_API.md) | Write plugins |
| [**Architecture**](docs/architecture.md) | System design |

---

## 📜 License

MIT — same as upstream. Copyright (c) 2026 involvex + contributors.

---

## 🙏 Acknowledgments

- **involvex** — Original author of `inkmp3`, amazing TUI foundation
- **Bun** — Blazing-fast runtime + built-in SQLite
- **Ink** — React for CLIs
- **mpv** — The best media player, period

---

**Status:** 🟡 In active development  
**Last updated:** 2026-04-25  
**Maintainer:** Frodo (GumbyEnder)


---

## 🛑 Project Status — Paused (2026-04-26)

**Current phase:** Repository renamed to `INKMP3` — awaiting Phase 4 feature completion.

**Just completed:**
- ✅ Phase 1 — MusicService abstraction + YouTube adapter
- ✅ Phase 2 — LocalMusicService (scanner, metadata, SQLite index)  
- ✅ Phase 3 — UI unification (BrowseLibrary, source-aware search, type migration)

**Why paused?** Rename complete; resuming requires manual smoke-test of local mode on target machine.

---

### 📋 Resume Prompt — Start Here When Ready

When you're ready to resume development, ask Frodo:

> **"Resume INKMP3 Phase 4 — feature completion"**

Frodo will:
1. Verify local library scanning works on your machine (sample MP3 library path)
2. Implement **P4-1 M3U Import UI** (menu item + `/import m3u <file>` CLI binding)
3. Implement **P4-2 Local Suggestions** (same-folder / same-artist recommendations)
4. Verify **P4-3 Web Remote** parity for local tracks
5. Run **P4-4 Smoke Test** — browse, search, play local tracks end-to-end
6. Move into **Phase 5 Polish** (unit tests, Windows edge cases, README expansion)

**Pre-resume checklist (optional):**
- [ ] Sample MP3 library accessible at known path (e.g., `~/Music` or `D:\Music`)
- [ ] `bun install` completes successfully (regenerate `bun.lockb` if needed)
- [ ] `bun start` launches TUI and BrowseLibrary (`Ctrl+B`) renders

**Phase 4 ticket:** [`.github/PROJECTS.md` → Feature Completion column]  
**Technical reference:** [`03_Resources/Technical References/LocalMusicService-Implementation.md`](03_Resources/Technical%20References/LocalMusicService-Implementation.md)

