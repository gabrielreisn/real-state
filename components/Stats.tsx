type Props = {
  stats: Array<{
    title: string
    subtitle: string
  }>
}

export const Stats = ({ stats }: Props) => {
  return (
    <div className="bg-white py-12 sm:py-16 w-full">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              className="mx-auto flex max-w-xs flex-col gap-y-4 border-2 border-blue-800 p-6 rounded-lg"
              key={stat.title + i}
            >
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                {stat.title}
              </dd>
              <dt className="text-base leading-7 text-gray-600">
                {stat.subtitle}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
