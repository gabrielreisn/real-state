type Props = {
  options: Array<{
    label: string
    value: string
  }>
}

export function RadioGroup({ options }: Props) {
  return (
    <div className="flex gap-10 border border-blue-800 rounded p-2 border-opacity-70">
      {options.map((option, i) => (
        <label className="flex items-center space-x-2" key={option.label + i}>
          <input
            type="radio"
            name="radio-group"
            className="form-radio accent-blue-800"
            value={option.value}
          />
          <span className="text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  )
}
