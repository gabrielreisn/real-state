import { Featured } from '@/components/Featured'
import { Hero } from '@/components/Hero'
import { Stats } from '@/components/Stats'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pt-20">
      <Hero />
      <Stats
        stats={[
          { title: '1000', subtitle: 'imóveis vendidos na grande Vitória' },
          { title: '1000', subtitle: 'imóveis vendidos na grande Vitória' },
          { title: '1000', subtitle: 'imóveis vendidos na grande Vitória' },
        ]}
      />
      <Featured />
    </main>
  )
}
