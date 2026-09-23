import { ALLOWED_DOMAIN } from '../lib/config.js'

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
      <h2 className="text-lg font-extrabold tracking-tight text-brand-ink">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-brand-ink/80">{children}</div>
    </section>
  )
}

export function Privacy() {
  return (
    <div className="min-h-dvh bg-brand-page">
      <header className="bg-linear-to-r from-brand-deep to-brand-hero-light px-4 py-6 text-white shadow-soft sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <img
            src="/logo-blanco.png"
            alt=""
            width="512"
            height="512"
            className="size-9"
          />
          <p className="text-lg font-extrabold tracking-tight">QR Suite</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-ink">
          Aviso de privacidad
        </h1>
        <p className="mt-2 text-sm text-brand-ink/65">
          Actualizado el {UPDATED_AT}
        </p>

        <div className="mt-10 text-[15px] leading-relaxed">
          <Section title="Qué es esta plataforma">
            <p>
              QR Suite genera y administra códigos QR para material educativo
              impreso. Cada código apunta a una dirección corta que puede
              redirigirse a otro destino sin reimprimir el libro, y la
              plataforma registra cuántas veces se escanea cada uno.
            </p>
          </Section>

          <Section title="Datos de las personas que administran">
            <p>
              Para entrar al panel se usa una cuenta de Google del dominio
              institucional <strong>@{ALLOWED_DOMAIN}</strong>. De esa cuenta se
              guarda:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>La dirección de correo electrónico.</li>
              <li>El nombre que muestra la cuenta de Google.</li>
              <li>El rol asignado dentro de la plataforma.</li>
            </ul>
            <p>
              No se guarda la contraseña: la autenticación la realiza Google y
              la plataforma nunca la recibe.
            </p>
          </Section>

          <Section title="Datos de quien escanea un código">
            <p>
              Al abrir un código QR se registra el evento para medir el uso de
              los recursos. De cada escaneo se guarda:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>La fecha y la hora.</li>
              <li>El código escaneado.</li>
              <li>El sistema operativo y el navegador detectados.</li>
              <li>
                La cadena de identificación del navegador (<em>user agent</em>).
              </li>
            </ul>
            <p>
              No se pide ni se guarda ningún dato que identifique a la persona:
              ni nombre, ni correo, ni ubicación, ni dirección IP. Las cifras se
              usan de forma agregada, para saber qué materiales se consultan
              más.
            </p>
          </Section>

          <Section title="Dónde se guardan">
            <p>
              Los datos se almacenan en Cloud Firestore, el servicio de bases de
              datos de Google Cloud, en servidores ubicados en Estados Unidos.
              El acceso está restringido por reglas de seguridad: sin una cuenta
              autorizada del dominio institucional no se puede consultar ninguna
              información del panel.
            </p>
          </Section>

          <Section title="Con quién se comparten">
            <p>
              Con nadie. No se venden, no se ceden a terceros y no se usan con
              fines publicitarios. Tampoco se emplean cookies de seguimiento ni
              herramientas de analítica externas.
            </p>
          </Section>

          <Section title="Cuánto tiempo se conservan">
            <p>
              Los registros de escaneo se conservan mientras el código
              correspondiente siga activo. Al eliminar un código o un proyecto
              se borran también sus registros asociados.
            </p>
          </Section>

          <Section title="Tus derechos">
            <p>
              Puedes solicitar que se consulte, corrija o elimine la información
              asociada a tu cuenta administradora, así como retirar tu acceso a
              la plataforma.
            </p>
            {CONTACT_EMAIL ? (
              <p>
                Para hacerlo, escribe a{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-brand-primary-deep underline underline-offset-4"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            ) : (
              <p>
                Para hacerlo, dirígete a la persona responsable de la plataforma
                dentro de la institución.
              </p>
            )}
          </Section>
        </div>
      </main>
    </div>
  )
}
