type Sized = { width?: number; height?: number };

// Below 3:2 the frame pushes the rest of the page too far down; above 2.4:1 it becomes a sliver.
const NARROWEST_FRAME = 3 / 2;
const WIDEST_FRAME = 2.4;

const ratioOf = ({ width, height }: Sized) => (width && height ? width / height : undefined);

/**
 * The proportions of a listing's photo frame: the typical landscape photo, so those fill it.
 * One frame per listing, so the page below doesn't jump from photo to photo.
 */
export function galleryFrameRatio(images: Sized[]) {
  const landscape = images
    .map((image) => ratioOf(image) ?? 0)
    .filter((ratio) => ratio > 1)
    .sort((a, b) => a - b);
  const median = landscape[Math.floor(landscape.length / 2)] ?? NARROWEST_FRAME;
  return Math.min(Math.max(median, NARROWEST_FRAME), WIDEST_FRAME);
}
