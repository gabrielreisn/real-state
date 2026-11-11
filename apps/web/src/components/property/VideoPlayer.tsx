'use client';

import { BufferingIndicator, I18nProvider } from '@videojs/react';
import { CompatVideoSkin, Video as Media, VideoPlayer as Player } from '@videojs/react/video';
import Image from 'next/image';
import type { RefObject } from 'react';
import type { Video } from '@/content/types';
import '@videojs/react/video/compat-skin.css';
import styles from './VideoPlayer.module.css';

export function VideoPlayer({ media, videoRef, fullscreen }: { media: Video; videoRef: RefObject<HTMLVideoElement | null>; fullscreen: boolean }) {
  const poster = media.poster;
  const sizes = fullscreen ? '100vw' : '(min-width: 1024px) 800px, 100vw';

  return (
    <I18nProvider locale="pt-BR">
      <Player poster={poster?.src}>
        <CompatVideoSkin className={styles.player} renderPoster={(props) => poster ? (
          <Image {...props} src={poster.src} alt="" fill sizes={sizes} placeholder={poster.lqip ? 'blur' : 'empty'} blurDataURL={poster.lqip} />
        ) : null}>
          <Media ref={videoRef} src={media.src} aria-label={media.alt} playsInline crossOrigin="anonymous" preload={fullscreen ? 'none' : 'metadata'} disablePictureInPicture disableRemotePlayback />
          {poster ? (
            <BufferingIndicator delay={0} className={styles.loading} aria-hidden>
              <Image src={poster.src} alt="" fill sizes={sizes} placeholder={poster.lqip ? 'blur' : 'empty'} blurDataURL={poster.lqip} className="object-contain blur-md" />
            </BufferingIndicator>
          ) : null}
        </CompatVideoSkin>
      </Player>
    </I18nProvider>
  );
}
