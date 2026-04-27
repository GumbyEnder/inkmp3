// MusicServiceFactory — singleton factory for unified MusicService
// Chooses between YouTubeMusicService and LocalMusicService based on config.

import type {MusicService, MusicSource, MusicServiceFactory} from './api.ts';
import {YouTubeMusicService, getYouTubeMusicService} from './youtube.service';
import {LocalMusicService, getLocalMusicService} from './local.service';
import {getConfigService} from '../config/config.service.ts';

/**
 * MusicServiceFactoryImpl — concrete factory implementation.
 *
 * Lifecycle:
 *   - Auto-initializes on first access (reads config, defaults to 'youtube')
 *   - getService(source) — gets or creates the singleton for that source
 *   - setSource(newSource) — switches active source (persists to config)
 *
 * Caching: one singleton per source (YouTube singleton + Local singleton).
 * Switching sources does NOT recreate existing singletons.
 */
export class MusicServiceFactoryImpl implements MusicServiceFactory {
	private currentSource: MusicSource;
	private youtubeService: YouTubeMusicService | null = null;
	private localService: LocalMusicService | null = null;

	constructor() {
		// Auto-initialize from config synchronously
		const config = getConfigService().get('musicSource') as MusicSource | undefined;
		this.currentSource = config ?? 'youtube';
		// Ensure YouTube service is available immediately (no async init needed)
		if (this.currentSource === 'youtube') {
			this.youtubeService = new YouTubeMusicService();
		}
		// Local service is lazy-created on first getService('local') call
	}

	/**
	 * Get the MusicService for the given source.
	 * Creates the singleton if it doesn't exist yet.
	 *
	 * @param source 'youtube' or 'local'
	 * @returns The service instance
	 */
	getService(source: MusicSource): MusicService {
		if (source === 'youtube') {
			if (!this.youtubeService) {
				this.youtubeService = new YouTubeMusicService();
			}
			return this.youtubeService;
		}

		// local
		if (!this.localService) {
			this.localService = new LocalMusicService();
		}
		return this.localService;
	}

	/**
	 * Get the currently active service.
	 *
	 * @returns The service matching `currentSource`
	 */
	getCurrentService(): MusicService {
		return this.getService(this.currentSource);
	}

	/**
	 * Switch the active music source at runtime.
	 *
	 * Behavior:
	 *   - Updates currentSource
	 *   - Returns newly active service
	 *   - Does NOT re-initialize the singleton (preserves cache/index)
	 *
	 * @param source New source to activate
	 * @returns The newly active service
	 */
	async setSource(source: MusicSource): Promise<MusicService> {
		if (source !== 'youtube' && source !== 'local') {
			throw new Error(`Invalid music source: ${source}`);
		}

		// If switching, lazy-init the target service now (so it's ready)
		this.getService(source);

		// Save to persistent config
		getConfigService().set('musicSource', source);

		this.currentSource = source;

		// Phase 2: Local service needs async init after first switch
		if (source === 'local') {
			await this.localService?.initialize().catch((err) => {
				console.error('LocalMusicService initialize failed:', err);
			});
		}

		return this.getCurrentService();
	}

	/**
	 * Get the current source string.
	 * Useful for UI conditional rendering.
	 */
	getSource(): MusicSource {
		return this.currentSource;
	}
}

// ─── Global singleton ─────────────────────────────────────────────────────

let factoryInstance: MusicServiceFactoryImpl | null = null;

/**
 * Get the global MusicServiceFactory.
 * Creates it on first call if not yet initialized.
 *
 * Note: In Phase 1, we call `initializeMusicServiceFactory()` explicitly
 * at app startup. After that, `getMusicServiceFactory()` always returns
 * the cached instance.
 */
export function getMusicServiceFactory(): MusicServiceFactoryImpl {
	if (!factoryInstance) {
		factoryInstance = new MusicServiceFactoryImpl();
	}
	return factoryInstance;
}

// Re-export from api.ts
export {getMusicService, initializeMusicServiceFactory} from './api.ts';
