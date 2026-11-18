import { ALLOWED_DOMAIN } from '../lib/config.js'
import { Picture } from '../components/ui.jsx'

/**
 * Aviso de privacidad.
 *
 * Google lo exige para publicar la pantalla de consentimiento de OAuth, pero
 * su razón de ser es otra: describir exactamente qué guarda la plataforma.
 * Si cambia lo que se recoge, esta página cambia con ello.
 *
 * Va fuera del panel porque tiene que poder leerse sin iniciar sesión.
 */

/** Dirección a la que escribir para ejercer los derechos de abajo. */
const CONTACT_EMAIL = ''

const UPDATED_AT = '23 de septiembre de 2026'

function Section({ title, children }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-lg font-bold tracking-tight text-brand-ink">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-brand-ink/80">{children}</div>
    </section>
  )
}

export function Privacy() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-3 z-10 px-3">
        <div className="glass-thick mx-auto flex max-w-2xl items-center gap-3 rounded-full py-2 pr-5 pl-3">
          <Picture
            src="/logo-azul-192.webp"
            alt=""
            width="192"
            height="192"
            className="size-8"
          />
          <p className="font-bold tracking-tight">QR Suite</p>
        </div>
      </header>

      <main className="glass mx-3 my-8 rounded-[2rem] px-6 py-10 sm:mx-auto sm:max-w-2xl sm:px-10">
        <h1 className="text-3xl font-bold tracking-tight text-brand-ink">
          Aviso de privacidad
        </h1>
        <p className="mt-2 text-sm text-brand-ink/75">
          Actualizado el {UPDATED_AT}
        </p>

        <div className="mt-10 text-[15px] leading-relaxed">
          <Section title="Qué es esta plataforma">
            <p>
              QR Suite genera y administra códigos QR para material educativo
              impreso. Cada código usa una dirección corta cuyo destino puede
              cambiarse sin reimprimir, y se cuenta cuántas veces se escanea.
            </p>
          </Section>

          <Section title="Datos de quien administra">
            <p>
              Se entra con una cuenta de Google{' '}
              <strong>@{ALLOWED_DOMAIN}</strong>. Se guarda:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>El correo electrónico.</li>
              <li>El nombre de la cuenta de Google.</li>
              <li>El rol dentro de la plataforma.</li>
            </ul>
            <p>
              La contraseña nunca llega a la plataforma: la autenticación la
              hace Google.
            </p>
          </Section>

          <Section title="Datos de quien escanea">
            <p>Cada escaneo se registra para medir el uso. Se guarda:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>La fecha y la hora.</li>
              <li>El código escaneado.</li>
              <li>El sistema operativo y el navegador.</li>
              <li>
                La cadena de identificación del navegador (<em>user agent</em>).
              </li>
            </ul>
            <p>
              No se guarda nombre, correo, ubicación ni dirección IP. Las cifras
              se usan solo de forma agregada.
            </p>
          </Section>

          <Section title="Dónde se guardan">
            <p>
              En Cloud Firestore (Google Cloud), con servidores en Estados
              Unidos. Las reglas de seguridad solo dejan consultar el panel con
              una cuenta autorizada del dominio institucional.
            </p>
          </Section>

          <Section title="Con quién se comparten">
            <p>
              Con nadie. No se venden, no se ceden a terceros ni se usan con
              fines publicitarios. No hay cookies de seguimiento ni analítica
              externa.
            </p>
          </Section>

          <Section title="Cuánto tiempo se conservan">
            <p>
              Los escaneos se conservan mientras su código siga activo. Al
              eliminar un código o un proyecto se borran también sus registros.
            </p>
          </Section>

          <Section title="Tus derechos">
            <p>
              Puedes pedir que se consulte, corrija o elimine la información de
              tu cuenta administradora, o que se retire tu acceso.{' '}
              {CONTACT_EMAIL ? (
                <>
                  Escribe a{' '}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="font-semibold text-brand-primary-deep underline underline-offset-4"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  .
                </>
              ) : (
                'Dirígete a la persona responsable de la plataforma en la institución.'
              )}
            </p>
          </Section>
        </div>
      </main>
    </div>
  )
}
