import { ImageResponse } from 'next/og';
import { sanityFetch } from '@/lib/sanity/live';
import { IMAGE_PROJECTION, type SanityImage, toImage } from '@/lib/sanity/image';
import { BrandMark } from './brand-mark';

/** Read the published artwork for metadata, without preview markers. */
export async function siteIcon(size: { width: number; height: number }) {
  const logo = toImage(await sanityFetch<SanityImage>(
    `*[_id == "siteSettings"][0].logo ${IMAGE_PROJECTION}`,
    {},
    { published: true },
  ));

  return new ImageResponse(
    logo ? (
      // ImageResponse renders images directly rather than through next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo.src} alt="" width={size.width} height={size.height} style={{ objectFit: 'contain' }} />
    ) : <BrandMark size={size.width} />,
    size,
  );
}
