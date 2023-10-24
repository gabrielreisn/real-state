import { RadioGroup } from './Options'
import { MenuCombobox } from './Combobox'
import Image from 'next/image'

export const Hero = () => {
  return (
    <section className="relative flex items-center justify-center w-full h-[70vh]">
      <div className=" bg-white absolute p-8 lg:p-14 rounded-xl z-1 mx-4">
        <form className="flex flex-col gap-4">
          <h1 className="text-blue-900 font-semibold text-5xl">
            Encontre seu imóvel ideal
          </h1>
          <MenuCombobox />
          <RadioGroup
            options={[
              { value: 'aluguel', label: 'Aluguel' },
              { value: 'vanda', label: 'Venda' },
            ]}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-900 text-white rounded"
          >
            Buscar
          </button>
        </form>
      </div>
      <Image
        alt="alt"
        fill
        className="w-full h-full aspect-video object-cover"
        src="https://images.unsplash.com/photo-1673865255404-9ccc4b7bc99e?auto=format&fit=crop&q=80&w=5048&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      />
    </section>
  )
}
