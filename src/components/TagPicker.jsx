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
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
              value.includes(tag)
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-brand-soft text-brand-ink/80 hover:bg-brand-soft'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </Field>
  )
}
