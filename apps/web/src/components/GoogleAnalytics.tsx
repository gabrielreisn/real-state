import { GoogleAnalyticsTag } from './GoogleAnalyticsTag';

export function GoogleAnalytics() {
  const measurementId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-754VY12EFX').trim();

  if (
    process.env.NODE_ENV !== 'production' ||
    (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') ||
    !measurementId ||
    !/^G-[A-Z0-9]+$/.test(measurementId)
  ) {
    return null;
  }

  return <GoogleAnalyticsTag measurementId={measurementId} />;
}
