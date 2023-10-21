'use client'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Logo } from './Logo'
import { Search } from './Icons/Search'
import { startTransition, useEffect, useRef, useState } from 'react'

export const Header = () => {
  const sentinelRef = useRef(null)
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(function detectScrollMovement() {
    if (!sentinelRef.current) {
      return
    }

    function intersectionCallback(entries: IntersectionObserverEntry[]) {
      entries.forEach((entry) => {
        startTransition(() => {
          setHasScrolled(!entry.isIntersecting)
        })
      })
    }

    const observer = new IntersectionObserver(intersectionCallback, {})

    observer.observe(sentinelRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div ref={sentinelRef} />
      <header className="w-full bg-blue-950 fixed z-10">
        <section
          className={clsx(
            'max-w-5xl flex gap-6 mx-auto items-center bg-blue-950 transition-height duration-150',
            hasScrolled ? 'h-16' : 'h-20',
          )}
        >
          <Link href="/">
            <Logo />
          </Link>
          <h3 className="text-white">Compre</h3>
          <h3 className="text-white">Alugue</h3>
          <h3 className="text-white">Como funciona</h3>
          <h3 className="text-white">Contato</h3>
          <SmallSearchBar />
        </section>
      </header>
    </>
  )
}

const SmallSearchBar = () => {
  return (
    <form className="ml-auto">
      <div className="relative rounded-full bg-white flex p-2">
        <input
          type="text"
          className="w-full rounded-full focus:outline-none text-black px-2"
          placeholder="Código"
        />
        <Search className="text-blue-900 w-6 h-6" />
      </div>
    </form>
  )
}
