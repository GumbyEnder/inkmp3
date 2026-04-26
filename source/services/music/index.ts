// Music Service — Public API
// Re-exports all types and singleton getters.

export * from './api.ts';
export {YouTubeMusicService, getYouTubeMusicService} from './youtube.service';
export {LocalMusicService, getLocalMusicService} from './local.service';
export {
	MusicServiceFactoryImpl,
	getMusicServiceFactory,
	initializeMusicServiceFactory,
} from './factory';
