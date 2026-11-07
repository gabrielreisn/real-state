import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="mt-3 text-slate">O imóvel ou a página que você procura não está disponível.</p>
      <Link href="/" className="mt-8 inline-block bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark">
        Ver todos os imóveis
      </Link>
    </section>
  );
}
