# InkMP3 — GitHub Projects Kanban Board

> **Board:** [InkMP3 Roadmap](https://github.com/GumbyEnder/inkmp3/projects)  
> **Owner:** @GumbyEnder  
> **Created:** 2026-04-25

---

## Quick Setup (Manual)

1. Go to the repo → **Projects** tab → **New Project**
2. Select **"New project (classic)"** (not beta)
3. Name: `InkMP3 Roadmap`
4. Add columns: **Backlog**, **In Progress**, **Done**, **Blocked** (drag to reorder)
5. Copy cards from this doc into the appropriate columns

---

## Column Definitions

| Column | WIP Limit | Description |
|--------|-----------|-------------|
| 🟧 **Backlog** | ∞ | Planned tasks, not yet started |
| 🔵 **In Progress** | 3 | Active development (max 3 concurrent) |
| 🟢 **Done** | ∞ | Completed, verified, merged |
| 🔴 **Blocked** | ∞ | Waiting on external dependency or decision |

---

## Card Template (copy for each task)

```
Title: P1-1 — Define MusicService interface
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 4h  
**Owner:** @dev  
**Status:** todo  
**Phase:** Phase 1 — Abstraction Layer

**Description:**
Create interfaces/api.ts with search(), getTrack(), getSuggestions(), getStreamUrl(), plus PlayOption extensions for local paths.

**Blockers:** None  
**Dependencies:** None  
**Tags:** #architecture #core

[Milestone: Phase 1 — Abstraction Layer]
```

---

## Task Cards (copy all)

### Backlog

#### Epic: Phase 1 — Abstraction Layer

```
Title: P1-1 — Define MusicService interface
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 4h  
**Owner:** @dev  
**Status:** todo  
**Phase:** Phase 1 — Abstraction Layer

**Description:**
Create `source/services/music/api.ts` with the MusicService interface contract: search(), getTrack(), getSuggestions(), getStreamUrl(). Define unified Track type that supports both YouTube (videoId) and local (filePath) sources.

**Acceptance Criteria:**
- [ ] Interface compiles with no errors
- [ ] YouTubeMusicService stub implements all methods
- [ ] LocalMusicService stub exists (empty methods)
- [ ] Unit test proves service factory returns correct singleton

**Blockers:** None  
**Dependencies:** None  
**Tags:** #architecture #core  
[Milestone: Phase 1 — Abstraction Layer]
```

```
Title: P1-2 — Refactor player.store.tsx to use MusicService
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 6h  
**Owner:** @dev  
**Status:** todo  
**Phase:** Phase 1 — Abstraction Layer

**Description:**
Refactor `source/stores/player.store.tsx` to inject MusicService via React context/hook instead of direct singleton. Update all 31 files that import from `youtube-music/types` or `youtube-music/api` to use the interface. This is the largest change.

**Acceptance Criteria:**
- [ ] player.store compiles against MusicService interface
- [ ] All 31 dependent files update imports successfully
- [ ] TypeScript shows zero errors in full build
- [ ] No YouTube API calls leak into player store

**Blockers:** P1-1  
**Dependencies:** None  
**Tags:** #refactor #core  
[Milestone: Phase 1 — Abstraction Layer]
```

```
Title: P1-3 — Add musicSource config toggle
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 2h  
**Owner:** @dev  
**Status:** todo  
**Phase:** Phase 1 — Abstraction Layer

**Description:**
Extend config schema (`source/services/config/config.service.ts`) with `musicSource: 'youtube' | 'local'`, default 'youtube'. Add UI toggle in Settings.tsx under "Playback" section. Persist to config.json.

**Acceptance Criteria:**
- [ ] Config schema validates enum
- [ ] Settings UI renders radio buttons or dropdown
- [ ] Value persists across restarts
- [ ] Default is 'youtube' (backward compatible)

**Blockers:** P1-2  
**Dependencies:** None  
**Tags:** #config #ui  
[Milestone: Phase 1 — Abstraction Layer]
```

```
Title: P1-4 — Create MusicServiceFactory singleton
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 3h  
**Owner:** @dev  
**Status:** todo  
**Phase:** Phase 1 — Abstraction Layer

**Description:**
Implement `source/services/music/service-factory.ts` — singleton factory that reads `config.get('musicSource')` and returns either `YouTubeMusicService` (wraps existing api.ts) or `LocalMusicService` (new stub). Ensure proper TypeScript types.

**Acceptance Criteria:**
- [ ] Factory returns correct implementation based on config
- [ ] Singleton pattern (only one instance per runtime)
- [ ] YouTube mode works unchanged when selected
- [ ] Local mode returns stub without error

**Blockers:** P1-3  
**Dependencies:** None  
**Tags:** #core  
[Milestone: Phase 1 — Abstraction Layer]
```

#### Epic: Phase 2 — Local Scanner & Indexer

```
Title: P2-1 — Scanner with fast-glob
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 4h  
**Owner:** @dev  
**Status:** todo  
**Phase:** Phase 2 — Local Scanner & Indexer

**Description:**
Implement `source/services/local-music/scanner.ts` using `fast-glob`. Recursively discover audio files: .mp3, .flac, .ogg, .m4a, .aac, .wav. Support exclude patterns (temp files, hidden folders). Return array of `{filePath, size, mtime}`.

**Acceptance Criteria:**
- [ ] Scans 10k files in <10 seconds
- [ ] Respects `.gitignore` patterns and user excludes
- [ ] Works on Windows (`C:\Music\`) and Unix (`~/Music`)
- [ ] Handles symlinks gracefully (no infinite loops)

**Blockers:** P1-4  
**Dependencies:** None  
**Tags:** #scanner #data  
[Milestone: Phase 2 — Local Scanner & Indexer]
```

```
Title: P2-2 — Integrate music-metadata reader
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 4h  
**Owner:** @dev  
**Status:** todo  
**Phase:** Phase 2 — Local Scanner & Indexer

**Description:**
Implement `source/services/local-music/metadata.ts`. Use `music-metadata` to parse ID3v2.3/v2.4, FLAC/Vorbis, MP4 tags. Normalize fields: title, artist[] (multi-support), album, trackNumber, year, genre, duration, embedded picture (optional).

**Acceptance Criteria:**
- [ ] Correctly parses MP3 with ID3v2.3 and v2.4
- [ ] Extracts multiple artists into array
- [ ] Falls back to filename if tags missing (configurable)
- [ ] Handles Unicode in tags (UTF-8, UTF-16)

**Blockers:** P2-1  
**Dependencies:** None  
**Tags:** #metadata #data  
[Milestone: Phase 2 — Local Scanner & Indexer]
```

```
Title: P2-3 — SQLite index schema + bulk upsert
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 6h  
**Owner:** @dev  
**Status:** todo  
**Phase:** Phase 2 — Local Scanner & Indexer

**Description:**
Implement `source/services/local-music/indexer.ts` with `better-sqlite3` or `Bun.sqlite`. Schema: tracks (with FTS5), artists, albums. Bulk upsert from scanner+metadata results. Handle migrations (keep schema version).

**Acceptance Criteria:**
- [ ] 10k tracks indexed in <5 seconds (bulk transaction)
- [ ] FTS5 search returns correct ranked results
- [ ] Database stored in config dir (`~/.inkmp3/library.db`)
- [ ] WAL mode enabled for NAS/CIFS safety

**Blockers:** P2-2  
**Dependencies:** None  
**Tags:** #database #data  
[Milestone: Phase 2 — Local Scanner & Indexer]
```

```
Title: P2-4 — Implement LocalMusicService API
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 8h  
**Owner:** @dev  
**Status:** todo  
**Phase:** Phase 2 — Local Scanner & Indexer

**Description:**
`source/services/local-music/api.ts` — full MusicService implementation. search() uses FTS5; getTrack(filePath) returns from index; getSuggestions(trackId) → same artist/album tracks; getStreamUrl() returns `file://` URI. Implement getTrending() as "recently added" (optional).

**Acceptance Criteria:**
- [ ] search("beatles") returns matching local tracks
- [ ] getTrack("/path/to/song.mp3") returns full metadata
- [ ] getSuggestions returns 10 related tracks
- [ ] getStreamUrl produces valid file:// URI accepted by mpv

**Blockers:** P2-3  
**Dependencies:** None  
**Tags:** #api #core  
[Milestone: Phase 2 — Local Scanner & Indexer]
```

```
Title: P2-5 — Library watch mode (optional)
Body:
**Type:** task  
**Priority:** MEDIUM  
**Estimate:** 6h  
**Owner:** @dev  
**Status:** todo  
**Phase:** Phase 2 — Local Scanner & Indexer

**Description:**
Add `chokidar` watcher on configured library paths. On file create/delete/rename, incrementally update SQLite index. Debounce rapid changes (e.g., bulk copy). Add config flag `localLibrary.watch: boolean`.

**Acceptance Criteria:**
- [ ] New file discovered and indexed within 5 seconds
- [ ] Deleted file removed from index
- [ ] No duplicate entries on simultaneous writes
- [ ] CPU usage <2% when idle

**Blockers:** P2-4  
**Dependencies:** None  
**Tags:** #watcher #data  
[Milestone: Phase 2 — Local Scanner & Indexer]
```

#### Epic: Phase 3 — UI Transformation

```
Title: P3-1 — Create LibraryLayout (tree browser)
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 8h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 3 — UI Transformation

**Description:**
New component: `source/components/layouts/LibraryLayout.tsx`. Tree navigation: Artists list → select → Album list → select → Track list. Bind to LocalMusicService API. Use Ink `<Box>` + `<Text>` components.

**Acceptance Criteria:**
- [ ] Artist list loads and renders alphabetically
- [ ] Selecting artist shows album list (with counts)
- [ ] Selecting album shows tracks (with duration)
- [ ] Enter on track initiates playback via playerService

**Blockers:** P2-4  
**Dependencies:** None  
**Tags:** #ui #tui  
[Milestone: Phase 3 — UI Transformation]
```

```
Title: P3-2 — Replace HomeLayout with LibraryLayout
Body:
**Type:** task  
**Priority:** MEDIUM  
**Estimate:** 3h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 3 — UI Transformation

**Description:**
Update `source/components/layouts/MainLayout.tsx` to conditionally render LibraryLayout when `musicSource=local`. Hide HomeLayout, ExploreLayout, GenresLayout, etc. Add "Switch Source" button in Settings.

**Acceptance Criteria:**
- [ ] Starting app with `musicSource=local` shows LibraryLayout
- [ ] Starting app with `musicSource=youtube` shows HomeLayout (unchanged)
- [ ] Switching source in Settings triggers full UI re-render

**Blockers:** P3-1  
**Dependencies:** None  
**Tags:** #ui  
[Milestone: Phase 3 — UI Transformation]
```

```
Title: P3-3 — Adapt SearchLayout for unified service
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 4h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 3 — UI Transformation

**Description:**
`source/components/search/SearchLayout.tsx` already calls `getMusicService().search()`. Verify it works with both backends. Add file path column to results when source=local. Ensure search input UX unchanged.

**Acceptance Criteria:**
- [ ] Typing "radiohead" shows YouTube results (youtube mode)
- [ ] Typing "radiohead" shows local file results (local mode)
- [ ] Results show: Title — Artist — [Album] — Duration
- [ ] Local results also display truncated file path

**Blockers:** P2-4  
**Dependencies:** None  
**Tags:** #ui #search  
[Milestone: Phase 3 — UI Transformation]
```

```
Title: P3-4 — Create RecentLayout (recently added/played)
Body:
**Type:** task  
**Priority:** MEDIUM  
**Estimate:** 4h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 3 — UI Transformation

**Description:**
Replace `TrendingLayout.tsx` with `RecentLayout.tsx`. Show tracks sorted by `mtime` (filesystem last modified) OR `last_played_at` from index. Add "Last Added" vs "Last Played" toggle.

**Acceptance Criteria:**
- [ ] Layout shows 50 most recent tracks
- [ ] Can sort by added or played
- [ ] Selection plays track
- [ ] Refresh button rescans library

**Blockers:** P2-4  
**Dependencies:** None  
**Tags:** #ui  
[Milestone: Phase 3 — UI Transformation]
```

```
Title: P3-5 — Hide YouTube-specific navigation layouts
Body:
**Type:** task  
**Priority:** LOW  
**Estimate:** 2h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 3 — UI Transformation

**Description:**
Deprecate ExploreLayout, GenresLayout, NewReleasesLayout. When `musicSource=local`, these views show empty state message: "YouTube-only feature — switch to YouTube mode in Settings". When `musicSource=youtube` they work as before.

**Acceptance Criteria:**
- [ ] Keybindings (Shift+M, Shift+N) show toast: "Not available in local mode"
- [ ] Direct navigation via state shows same message
- [ ] No crashes when accidentally accessed

**Blockers:** P3-2  
**Dependencies:** None  
**Tags:** #ui  
[Milestone: Phase 3 — UI Transformation]
```

#### Epic: Phase 4 — Feature Parity

```
Title: P4-1 — Adapt Favorites for local file paths
Body:
**Type:** task  
**Priority:** HIGH  
**Estimate:** 2h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 4 — Feature Parity

**Description:**
Favorites store (`source/services/favorites/favorites.service.ts`) currently persists `trackId` (YouTube videoId). Change to hybrid: `{source: 'youtube'|'local', id: string}`. For local, `id` = absolute filePath. Update save/load migration (detect old format and upgrade).

**Acceptance Criteria:**
- [ ] Pressing 'f' on local track adds to favorites
- [ ] Favorites list shows both YouTube and local tracks correctly
- [ ] Old YouTube-only favorites.json imports transparently
- [ ] Favorites persist across restarts

**Blockers:** P1-2  
**Dependencies:** None  
**Tags:** #persistence #core  
[Milestone: Phase 4 — Feature Parity]
```

```
Title: P4-2 — Adapt History for local tracks
Body:
**Type:** task  
**Priority:** MEDIUM  
**Estimate:** 2h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 4 — Feature Parity

**Description:**
History service uses Track type; ensure filePath persistence works. Update history view (`source/components/layouts/HistoryLayout.tsx`) to display local track info correctly.

**Acceptance Criteria:**
- [ ] Playback of local track adds to history
- [ ] History view shows title/artist for both sources
- [ ] History limit (e.g., 1000) respected

**Blockers:** P1-2  
**Dependencies:** None  
**Tags:** #persistence  
[Milestone: Phase 4 — Feature Parity]
```

```
Title: P4-3 — Disable download for local mode
Body:
**Type:** task  
**Priority:** LOW  
**Estimate:** 1h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 4 — Feature Parity

**Description:**
Download service (`source/services/download/download.service.ts`): if musicSource=local, show toast: "Downloads unavailable for local library" and no-op on Shift+D. YouTube mode unchanged.

**Acceptance Criteria:**
- [ ] Shift+D in local mode shows message
- [ ] No attempt to call ytdl-core
- [ ] YouTube mode still downloads

**Blockers:** P1-3  
**Dependencies:** None  
**Tags:** #ux  
[Milestone: Phase 4 — Feature Parity]
```

```
Title: P4-4 — Adapt Export to local file paths
Body:
**Type:** task  
**Priority:** LOW  
**Estimate:** 2h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 4 — Feature Parity

**Description:**
Export service (`source/services/export/export.service.ts`): when source=local, write M3U/M3U8 playlist files with `file://` paths instead of YouTube URLs. When source=youtube, keep existing behavior.

**Acceptance Criteria:**
- [ ] Export → M3U produces valid playlist with file paths
- [ ] Export → JSON still works
- [ ] YouTube export unchanged

**Blockers:** P4-1  
**Dependencies:** None  
**Tags:** #export  
[Milestone: Phase 4 — Feature Parity]
```

#### Epic: Phase 5 — Cleanup & Documentation

```
Title: P5-1 — Remove/disable download service for local mode
Body:
**Type:** task  
**Priority:** LOW  
**Estimate:** 2h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 5 — Cleanup & Docs

**Description:**
Conditionally bypass ytdl-core code path when musicSource=local to reduce bundle size. Guard all ytdl-core imports with `if (musicSource === 'youtube')` or require() dynamically.

**Acceptance Criteria:**
- [ ] Bundle size reduced by ~500 KB when local mode
- [ ] No ytdl-core loaded in local mode (verify with process.memoryUsage)
- [ ] YouTube mode still downloads correctly

**Blockers:** P4-3  
**Dependencies:** None  
**Tags:** #cleanup  
[Milestone: Phase 5 — Cleanup & Documentation]
```

```
Title: P5-2 — Update LLM tools for local search
Body:
**Type:** task  
**Priority:** LOW  
**Estimate:** 3h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 5 — Cleanup & Docs

**Description:**
Add `search_local_library` tool to LLM service (`source/services/llm/tool-definitions.ts`). Deprecate `search_youtube` when in local mode. Keep YouTube tool active for youtube source.

**Acceptance Criteria:**
- [ ] LLM chat can search local library (returns track list)
- [ ] LLM chat can still search YouTube when in youtube mode
- [ ] Tool schema updates correctly per mode

**Blockers:** P3-3  
**Dependencies:** None  
**Tags:** #llm #plugins  
[Milestone: Phase 5 — Cleanup & Documentation]
```

```
Title: P5-3 — Update documentation
Body:
**Type:** task  
**Priority:** MEDIUM  
**Estimate:** 4h  
**Owner:** docs  
**Status:** todo  
**Phase:** Phase 5 — Cleanup & Docs

**Description:**
Update README.md with local mode setup instructions. Update docs/roadmap.md to reflect dual-source strategy. Update SUGGESTIONS.md → tag "Implemented: Local Library". Update FEATURE_STATUS.md → add "Local Music Backend" row (status: Implemented). Add migration guide.

**Acceptance Criteria:**
- [ ] README has "Local Mode" section with screenshots
- [ ] Roadmap explains how to switch sources
- [ ] Feature status table updated
- [ ] CHANGELOG.md entry for v0.0.72 (Local Mode)

**Blockers:** P3-4  
**Dependencies:** None  
**Tags:** #docs  
[Milestone: Phase 5 — Cleanup & Documentation]
```

```
Title: P5-4 — Write tests for scanner + indexer
Body:
**Type:** task  
**Priority:** MEDIUM  
**Estimate:** 6h  
**Owner:** dev  
**Status:** todo  
**Phase:** Phase 5 — Cleanup & Docs

**Description:**
Create `tests/local-music/` using Ava. Test: fast-glob patterns (ignore works), metadata extraction edge cases (missing tags, Unicode), SQLite upsert idempotency, FTS search accuracy (partial matches, ranked).

**Acceptance Criteria:**
- [ ] Scanner test suite passes on Windows & Unix
- [ ] Metadata parser handles 10 fixture files (MP3, FLAC, M4A)
- [ ] Indexer test: re-scanning same files does not duplicate
- [ ] Search test: "query" returns expected tracks in order

**Blockers:** P2-4  
**Dependencies:** None  
**Tags:** #testing  
[Milestone: Phase 5 — Cleanup & Documentation]
```

---

### Done

```
Title: R-1 — Clone & examine codebase
Body:
**Type:** research  
**Priority:** HIGH  
**Estimate:** 2h  
**Owner:** Frodo  
**Status:** Done  
**Completed:** 2026-04-25  

**Summary:**
Analyzed 21,700 LOC, identified 31 YouTube-dependent files, confirmed mpv IPC is source-agnostic. Project rebranded to "InkMP3".

[Milestone: Research]
```

```
Title: R-2 — Assess conversion effort
Body:
**Type:** analysis  
**Priority:** HIGH  
**Estimate:** 2h  
**Owner:** Frodo  
**Status:** Done  
**Completed:** 2026-04-25  

**Summary:**
Determined abstraction-first approach; estimated 16-23 days; designed MusicService interface; recommended side-by-side architecture.

[Milestone: Research]
```

```
Title: R-3 — Create Obsidian vault + Kanban
Body:
**Type:** setup  
**Priority:** HIGH  
**Estimate:** 1h  
**Owner:** Frodo  
**Status:** Done  
**Completed:** 2026-04-25  

**Summary:**
Created ~/vaults/InkMP3 with full project structure, master note, ADR-001, kanban board, technical references.

[Milestone: Research]
```

```
Title: R-4 — Create GitHub repo & push code
Body:
**Type:** setup  
**Priority:** HIGH  
**Estimate:** 1h  
**Owner:** Frodo  
**Status:** Done  
**Completed:** 2026-04-25  

**Summary:**
Created https://github.com/GumbyEnder/inkmp3. Pushed main branch from inkmp3 fork. Ready for development.

[Milestone: Research]
```

---
- [x] P1: Unified MusicService interface + Track type
- [x] P1: YouTubeMusicService adapter
- [x] P1: MusicServiceFactory + runtime switching
- [x] P1: Settings toggle + config `musicSource`
- [x] P2: Fast-glob scanner + mtime/size index
- [x] P2: SQLite schema + Bun.sqlite integration
- [x] P2: Implement search/FTS, getTrack/Album/Artist/Playlist
- [x] P2: Background indexer with debounce
- [x] P3: BrowseLibrary (two-panel, keyboard nav, playback)
- [x] P3: VIEW.LIBRARY + ctrl+b keybinding
- [x] P3: SearchLayout → unified MusicService
- [x] P3: Source-aware filter labels (Songs→Tracks)
- [x] P3: Migrate stores/hooks from `videoId` → `id`
- [x] P3: ImportService.importM3U() stub
- [x] P3: Update README with local mode docs

## Milestones

| Milestone | Target Date | Status | Tasks |
|-----------|-------------|--------|-------|
| **Phase 1 — Abstraction Layer** | Day 3 | ⬜ Not started | P1-1, P1-2, P1-3, P1-4 |
| **Phase 2 — Local Scanner & Indexer** | Day 8 | ⬜ Not started | P2-1, P2-2, P2-3, P2-4, P2-5 |
| **Phase 3 — UI Transformation** | Day 12 | ⬜ Not started | P3-1, P3-2, P3-3, P3-4, P3-5 |
| **Phase 4 — Feature Parity** | Day 14 | ⬜ Not started | P4-1, P4-2, P4-3, P4-4 |
| **Phase 5 — Cleanup & Docs** | Day 17 | ⬜ Not started | P5-1, P5-2, P5-3, P5-4 |
| **Research (Completed)** | — | ✅ Done | R-1, R-2, R-3, R-4 |

---

## Quick Reference

| Item | Link |
|------|------|
| **GitHub Repo** | https://github.com/GumbyEnder/inkmp3 |
| **Original Repo** | https://github.com/involvex/inkmp3 |
| **Obsidian Vault** | ~/vaults/InkMP3/ |
| **Local Code** | /mnt/nas/github_repos/inkmp3/ |
| **Project Hub** | `01_Projects/InkMP3.md` (Obsidian) |
| **ADR-001** | `Architecture Decision Records/ADR-001-local-music-service.md` |
| **Tech Refs** | `03_Resources/Technical References/Libraries.md` |

---

## Board Protocol (Hermes)

All card movements on this board must be mirrored in:
1. Obsidian `.kanban/InkMP3.md`
2. Hermes brief (`zustand.yaml` project: `InkMP3`)
3. Agent Events ledger

This ensures cross-platform visibility (local dev ↔ remote coordination).



---

## 🛑 PAUSED — Resume When Ready

**Trigger phrase:** "Resume INKMP3 Phase 4 — feature completion"

**Next column:** Feature Completion (Phase 4) is ready to activate.
- All Phase 1–3 tasks are **Done**
- Board tracking synced to Obsidian
- Repository renamed to `INKMP3` (main branch)

Frodo will pick up from the first incomplete Phase 4 card.

