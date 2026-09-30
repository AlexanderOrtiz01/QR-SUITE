import { Field } from './ui.jsx'

export function TagPicker({ options, value, onChange, label = 'Etiquetas' }) {
  function toggle(tag) {
    onChange(
      value.includes(tag)
        ? value.filter((item) => item !== tag)
        : [...value, tag],
    )
  }

  return (
    <Field label={label} hint="Capítulo, unidad o tipo de recurso.">
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition-[background-color,transform] duration-200 ease-ios active:scale-[0.96] ${
              value.includes(tag)
                ? 'glass-tint text-white'
                : 'border-white/80 bg-white/55 text-brand-ink/80 hover:bg-white/85'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </Field>
  )
}
