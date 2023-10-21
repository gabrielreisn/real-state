import Link from 'next/link'
import { Logo } from './Logo'

const fakeLinks = [
  'Contato',
  'Imóveis para locação',
  'Imóveis para venda',
  'Quem somos',
  'Inicial',
]

export const Footer = () => {
  return (
    <footer className="w-full bg-blue-950">
      <section className="max-w-5xl flex gap-6 justify-between mx-auto py-14">
        <Link href="/">
          <Logo />
          <p className="text-white">CRECI: 000000 ES</p>
        </Link>
        <SubMenu links={fakeLinks} title="Sobre nós" />
        <SubMenu links={fakeLinks} title="Vendas" />
        <SubMenu links={fakeLinks} title="Produtos" />
      </section>
    </footer>
  )
}

const SubMenu = ({ links, title }: { links: string[]; title: string }) => {
  return (
    <div className="flex flex-col">
      <h3 className="text-white font-semibold">{title}</h3>
      {links.map((link) => (
        <Link key={link} className="text-blue-50 hover:underline ml-2" href="/">
          {link}
        </Link>
      ))}
    </div>
  )
}
