import Image from 'next/image'

export const Hero = () => {
  return (
    <section className="relative">
      <div className="w-1/2 mx-24 my-40 bg-white absolute p-6 rounded-lg z-10">
        <form className="flex flex-col gap-4">
          <h1 className="text-blue-900 font-semibold text-5xl">
            Encontre seu imóvel ideal
          </h1>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-900 text-white rounded-lg"
          >
            Buscar
          </button>
        </form>
      </div>
      <Image
        fill
        alt="alt"
        className="!relative aspect-video"
        src="https://images.unsplash.com/photo-1673865255404-9ccc4b7bc99e?auto=format&fit=crop&q=80&w=5048&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      />
    </section>
  )
}
