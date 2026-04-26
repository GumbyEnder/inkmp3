# 🚀 InkMP3 — Project Kick OFF

**Date:** 2026-04-25  
**Status:** 🔵 Phase 0 Complete — Phase 1 Ready to Start  
**Owner:** Frodo (GumbyEnder)

---

## ✅ What's Done (Today)

| # | Task | Result |
|---|------|--------|
| 1 | ✅ Clone `youtube-music-cli` to NAS | `/mnt/nas/github_repos/youtube-music-cli` |
| 2 | ✅ Analyze codebase (21,700 LOC) | 31 YT-dependent files identified |
| 3 | ✅ Assess conversion effort | 16–23 days, side-by-side architecture recommended |
| 4 | ✅ Create Obsidian vault `InkMP3` | Full project planning, ADR-001, kanban |
| 5 | ✅ Create GitHub repo | `GumbyEnder/inkmp3` — https://github.com/GumbyEnder/inkmp3 |
| 6 | ✅ Push code to GitHub | main branch synced, upstream preserved |
| 7 | ✅ Write comprehensive README | 9 KB with architecture, quickstart, platform matrix |
| 8 | ✅ Document GitHub Projects board | `.github/PROJECTS.md` with 20 task cards |
| 9 | ✅ Commit Phase 1 kickoff | `3bc53aa` — documentation baseline |

---

## 📁 Deliverables

### GitHub Repository
- **URL:** https://github.com/GumbyEnder/inkmp3
- **Branch:** `main` (fork of `involvex/youtube-music-cli`)
- **Commits:** 1 (docs: add InkMP3 project vault, GitHub Projects board, and Phase 1 kickoff)
- **New files:**
  - `.github/PROJECTS.md` (21 KB kanban card templates)
  - Updated `README.md` (InkMP3 branded)
  - All Obsidian vault docs committed for reference

### Obsidian Vault
- **Path:** `~/vaults/InkMP3/`
- **Notes:** 8 markdown files, ~1000 lines
- **Kanban:** `.kanban/InkMP3.md` (Hermes-compatible)
- **ADR:** `ADR-001` — Dual-source architecture accepted

### Project Board
- GitHub Projects board needs manual creation (CLI scopes insufficient)
- **Template ready:** Copy cards from `.github/PROJECTS.md` into GitHub Projects UI
- Columns: **Backlog** | **In Progress** | **Done** | **Blocked**

---

## 🎯 Immediate Next Steps (Next 72 Hours)

### Phase 1 — Abstraction Layer (Start Now)

#### Task 1: P1-1 — Define MusicService Interface
**Owner:** dev (@GumbyEnder or delegate)  
**Estimate:** 4h  
**Priority:** CRITICAL

Create `source/services/music/api.ts`:
```ts
export interface MusicService {
  search(query: string): Promise<SearchResponse>
  getTrack(id: string): Promise<Track | null>
  getSuggestions(trackId: string): Promise<Track[]>
  getStreamUrl(track: Track): Promise<string>
  getTrending?(): Promise<Track[]>
}
```

Define unified `Track` type:
```ts
export interface Track {
  id: string;                    // videoId OR filePath
  title: string;
  artists: Artist[];
  album?: Album;
  duration: number;
  source: 'youtube' | 'local';
  // YouTube: videoId, streamUrl
  // Local: filePath, coverArtPath?
}
```

**Acceptance:** TypeScript compiles, no errors in existing codebase yet (we haven't refactored).

---

#### Task 2: P1-2 — Refactor player.store.tsx
**Owner:** dev  
**Estimate:** 6h  
**Priority:** CRITICAL  
**Depends On:** P1-1

Refactor `source/stores/player.store.tsx` to inject `MusicService` via React context/hook. Replace `getMusicService()` singleton. Update all 31 files that import `youtube-music/types` or `youtube-music/api` to use the new generic Track.

**Biggest change** — affects most of codebase. Do incrementally: create PR with interface, then PR with refactor.

**Acceptance:** Full build succeeds with 0 TypeScript errors. YouTube mode unaffected (service returns same data).

---

#### Task 3: P1-3 — Add musicSource config toggle
**Owner:** dev  
**Estimate:** 2h  
**Depends On:** P1-2

Add to `config.service.ts`:
```ts
interface AppConfig {
  musicSource: 'youtube' | 'local';
  // ... existing keys
}
```

UI: `source/components/settings/Settings.tsx` — add radio/select under "Playback" section.

**Acceptance:** Toggle persists, defaults to 'youtube' (backwards compatible).

---

#### Task 4: P1-4 — Create MusicServiceFactory
**Owner:** dev  
**Estimate:** 3h  
**Depends On:** P1-3

`source/services/music/service-factory.ts` — singleton that returns:
```ts
if (config.get('musicSource') === 'local')
  return LocalMusicService.getInstance();
else
  return YouTubeMusicService.getInstance();
```

**Acceptance:** Factory returns proper implementation. YouTube mode unchanged by default.

---

## 🔴 Blockers / Questions

None yet. Architecture signed off. Ready to code.

---

## 📊 Metrics

| Metric | Value |
|--------|-------|
| GitHub repo | https://github.com/GumbyEnder/inkmp3 |
| Obsidian vault | ~/vaults/InkMP3/ |
| Code location | /mnt/nas/github_repos/youtube-music-cli/ |
| Total tasks | 20 (5 phases) |
| Phase 1 estimate | 3 days (15h) |
| Total project estimate | 17 days (85h) |
| Current completion | 13% (research done, implementation pending) |

---

## 🗺️ Visual Timeline

```
Day 1–3   [████░░░░░░] Phase 1 — Abstraction (interface + refactor)
Day 4–8   [░░░░████░░] Phase 2 — Scanner + Indexer (SQLite + fast-glob)
Day 9–12  [░░░░░░████] Phase 3 — UI Transform (Library view + search)
Day 13–14 [░░░░░░░░██] Phase 4 — Feature Parity (favorites/history)
Day 15–17 [░░░░░░░░░█] Phase 5 — Cleanup + Docs + Tests
Day 18–20 [░░░░░░░░░░] Beta release candidate
```

---

## 🧭 Frodo's PM Reminder

**Stick to the sequence.** No skipping. Validate each phase before moving on.

**Non-negotiable:** YouTube mode must remain fully functional throughout. Any regression is a blocker.

**Once Phase 1 merges,** we'll have a working dual-source toggle (even though Local returns stub). That's the architectural milestone.

---

> **Let's begin.** Phase 1, Task P1-1 — start coding the MusicService interface.
