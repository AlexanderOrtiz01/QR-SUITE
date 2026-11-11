import { useState } from 'react'
import { urlIssue } from '../lib/urls.js'
import { Field, Input } from './ui.jsx'
import { IconExternal } from './icons.jsx'

/**
 * Campo de un enlace de destino. El error aparece al salir del campo o al
 * intentar avanzar (`showError`), no mientras se escribe; y un enlace válido se
 * puede abrir para comprobarlo. Abrirlo no suma un escaneo, porque no pasa por
 * la URL corta.
 */
export function DestinationField({
  label,
  hint,
  value,
  onChange,
  required = false,
  disabled = false,
  showError = false,
  placeholder,
  testable = true,
}) {
  const [touched, setTouched] = useState(false)
  const issue = urlIssue(value, { required })
  const canTest = testable && value.trim() && !issue

  return (
    <Field
      label={label}
      hint={hint}
      error={touched || showError ? issue : ''}
      action={
        canTest ? (
          <a
            href={value.trim()}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary-deep underline-offset-2 hover:underline max-lg:min-h-11"
          >
            Probar destino
            <IconExternal className="size-3.5 shrink-0" />
          </a>
        ) : null
      }
    >
      <Input
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onBlur={() => setTouched(true)}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

/**
 * El destino de prueba es opcional y la mayoría no lo necesita: queda plegado
 * tras un botón salvo que ya tenga valor.
 */
export function TestDestinationField({
  value,
  onChange,
  disabled = false,
  showError = false,
}) {
  const [open, setOpen] = useState(Boolean(value))

  if (!open && !value) {
    if (disabled) return null
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-brand-primary-deep underline-offset-2 hover:underline max-lg:min-h-11"
      >
        Añadir un destino de prueba
      </button>
    )
  }

  return (
    <DestinationField
      label="Destino de prueba (opcional)"
      hint="Mientras el código sea un borrador, lleva aquí en lugar de al destino final."
      value={value}
      onChange={onChange}
      disabled={disabled}
      showError={showError}
      placeholder="https://drive.google.com/…"
    />
  )
}
