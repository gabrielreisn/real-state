import { ListingsPage, type ListingsProps, listingsMetadata } from './listings-page';

export async function generateMetadata({ searchParams }: { searchParams: ListingsProps['searchParams'] }) {
  return listingsMetadata({ segments: Promise.resolve([]), searchParams });
}

export default function Page({ searchParams }: { searchParams: ListingsProps['searchParams'] }) {
  return <ListingsPage segments={Promise.resolve([])} searchParams={searchParams} />;
}
