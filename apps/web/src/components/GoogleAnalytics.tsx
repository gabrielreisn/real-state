import Script from 'next/script';

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

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
