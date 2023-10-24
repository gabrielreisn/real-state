'use client'
import { Fragment, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'

type People = {
  id: number
  name: string
}

const people = [
  {
    id: 1,
    name: 'Jardim Camburi',
  },
  {
    id: 2,
    name: 'Jardim da Penha',
  },
  {
    id: 3,
    name: 'Praia do Canto',
  },
  {
    id: 4,
    name: 'Bento Ferreira',
  },
  {
    id: 5,
    name: 'Mata da Praia',
  },
  {
    id: 6,
    name: 'Santa Lúcia',
  },
  {
    id: 7,
    name: 'Jucutuquara',
  },
  {
    id: 8,
    name: 'Itararé',
  },
  {
    id: 9,
    name: 'Centro',
  },
  {
    id: 11,
    name: 'Ilha das Caieiras',
  },
  {
    id: 12,
    name: 'Vitória',
  },
  {
    id: 13,
    name: 'Vila Velha',
  },
  {
    id: 14,
    name: 'Praia da Costa',
  },
  {
    id: 15,
    name: 'Itapuã',
  },
  {
    id: 16,
    name: 'Praia de Itaparica',
  },
  {
    id: 17,
    name: 'Cód: 2002',
  },
  {
    id: 18,
    name: 'Cód: 2412',
  },
  {
    id: 19,
    name: 'Cód: 3123',
  },
  {
    id: 20,
    name: 'Cód: 1152',
  },
]

export function MenuCombobox() {
  const [selected, setSelected] = useState<People>({} as People)
  const [query, setQuery] = useState('')

  const filteredPeople =
    query === ''
      ? people
      : people.filter((person) =>
          person.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, '')),
        )

  return (
    <div className="">
      <Combobox value={selected} onChange={setSelected}>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded bg-white text-left border border-blue-800">
            <Combobox.Input
              placeholder="Busque por cidade, bairro ou código"
              className="w-full border-none py-4 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(person: People) => person.name}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              ^
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredPeople.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Opção não encontrada.
                </div>
              ) : (
                filteredPeople.map((person) => (
                  <Combobox.Option
                    key={person.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-6 pr-4 mx-1 rounded ${
                        active ? 'bg-blue-800 text-white' : 'text-gray-900'
                      }`
                    }
                    value={person}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {person.name}
                        </span>
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  )
}
