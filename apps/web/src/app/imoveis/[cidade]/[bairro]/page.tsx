import { ListingsPage, type ListingsProps, listingsMetadata } from '../../listings-page';

export async function generateMetadata({ params, searchParams }: { params: Promise<{ cidade: string; bairro: string }>; searchParams: ListingsProps['searchParams'] }) {
  return listingsMetadata({ segments: params.then((p) => [p.cidade, p.bairro]), searchParams });
}

export default function Page({ params, searchParams }: { params: Promise<{ cidade: string; bairro: string }>; searchParams: ListingsProps['searchParams'] }) {
  return <ListingsPage segments={params.then((p) => [p.cidade, p.bairro])} searchParams={searchParams} />;
}
