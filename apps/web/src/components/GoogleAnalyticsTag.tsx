'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { preload } from 'react-dom';

export function GoogleAnalyticsTag({ measurementId }: { measurementId: string }) {
  // React deduplicates this with next/script's preload, keeping the higher priority.
  preload(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, {
    as: 'script',
    fetchPriority: 'high',
  });

  return <GoogleAnalytics gaId={measurementId} />;
}
