/**
 * Guías interactivas de la página de Ayuda. Cada paso puede llevar a una ruta
 * y señalar el elemento con `data-tour="<target>"`; sin target, la tarjeta se
 * muestra centrada (introducciones y cierres). `requires` usa los permisos de
 * `roles.js`: si el rol no lo tiene, la guía no se ofrece.
 */
export const TOURS = [
  {
    id: 'conoce-la-plataforma',
    title: 'Conoce la plataforma',
    description:
      'Un recorrido por el menú lateral y lo que hay en cada sección.',
    category: 'Primeros pasos',
    steps: [
      {
        title: 'Bienvenida a QR Suite',
        body: 'Aquí creas los códigos QR de los libros y recursos, cambias su destino sin reimprimir y ves cuántas veces se escanean.',
      },
      {
        route: '/',
        target: 'sidebar',
        title: 'El menú lateral',
        body: 'Desde aquí llegas a todas las secciones. Solo verás las que tu rol permite usar.',
        placement: 'right',
      },
      {
        route: '/',
        target: 'nav-inicio',
        title: 'Inicio',
        body: 'Resumen de proyectos, códigos y escaneos de los últimos días.',
        placement: 'right',
      },
      {
        route: '/',
        target: 'nav-estudio',
        title: 'Crear QR',
        body: 'El asistente para crear un código nuevo paso a paso.',
        placement: 'right',
      },
      {
        route: '/',
        target: 'nav-codigos',
        title: 'Códigos QR',
        body: 'La lista de todos los códigos, con buscador y filtros. Desde aquí abres la ficha de cada uno.',
        placement: 'right',
      },
      {
        route: '/',
        target: 'nav-analitica',
        title: 'Analítica',
        body: 'Escaneos por día, códigos más usados y exportación a CSV.',
        placement: 'right',
      },
      {
        route: '/',
        target: 'collapse-toggle',
        title: 'Plegar el menú',
        body: 'Pliega el menú para ganar espacio; vuelve a pulsarlo para desplegarlo.',
        placement: 'right',
      },
      {
        route: '/',
        target: 'user-info',
        title: 'Tu cuenta',
        body: 'Tu correo y tu rol. Usa «Cerrar sesión» al terminar en un equipo compartido.',
        placement: 'right',
      },
    ],
  },
  {
    id: 'crear-qr',
    title: 'Crear un código QR',
    description:
      'Los cuatro pasos del asistente: contenido, destino, estilo y guardar.',
    category: 'Primeros pasos',
    requires: 'qr:write',
    steps: [
      {
        route: '/estudio',
        target: 'wizard-steps',
        title: 'Un asistente en cuatro pasos',
        body: 'Contenido, Destino, Estilo y Guardar. Puedes volver a un paso anterior pulsando su nombre.',
        placement: 'bottom',
      },
      {
        route: '/estudio',
        target: 'studio-title',
        title: '1. Contenido',
        body: 'Pon un título claro y elige el proyecto al que pertenece. Las etiquetas ayudan a encontrarlo después.',
        placement: 'bottom',
      },
      {
        route: '/estudio',
        target: 'studio-form',
        title: '2. Destino',
        body: 'Indica la URL a la que llevará el código. Podrás cambiarla más adelante sin reimprimir.',
        placement: 'right',
      },
      {
        route: '/estudio',
        target: 'studio-preview',
        title: '3. Estilo',
        body: 'Colores, forma, marco y logotipo son opcionales. La vista previa y la comprobación de legibilidad se actualizan al momento.',
        placement: 'left',
      },
      {
        route: '/estudio',
        target: 'studio-actions',
        title: '4. Guardar',
        body: 'Usa «Siguiente» para avanzar. En el último paso elige «Guardar borrador» o «Guardar y publicar».',
        placement: 'top',
      },
      {
        title: 'Listo para imprimir',
        body: 'Al guardar se abre la ficha del código, desde donde lo descargas para enviarlo a imprenta.',
      },
    ],
  },
  {
    id: 'organizar-proyectos',
    title: 'Organizar proyectos',
    description: 'Agrupa los códigos por libro o asignatura.',
    category: 'Códigos',
    requires: 'project:write',
    steps: [
      {
        route: '/proyectos',
        target: 'nav-proyectos',
        title: 'Proyectos',
        body: 'Un proyecto agrupa los códigos de un libro o asignatura. Todo código pertenece a uno.',
        placement: 'right',
      },
      {
        route: '/proyectos',
        target: 'projects-new',
        title: 'Nuevo proyecto',
        body: 'Pulsa «Nuevo proyecto», escribe el nombre y, si quieres, el departamento, y pulsa «Crear».',
        placement: 'bottom',
      },
      {
        route: '/proyectos',
        target: 'projects-grid',
        title: 'Tus proyectos',
        body: 'Cada tarjeta muestra cuántos códigos tiene. «Ver códigos» abre la lista filtrada por ese proyecto.',
        placement: 'top',
      },
      {
        title: 'Eliminar con cuidado',
        body: 'El icono de la papelera borra el proyecto. Úsalo solo si ya no tiene códigos en uso.',
      },
    ],
  },
  {
    id: 'buscar-codigos',
    title: 'Buscar y filtrar códigos',
    description: 'Encuentra un código por título, etiqueta, proyecto o estado.',
    category: 'Códigos',
    steps: [
      {
        route: '/codigos',
        target: 'codes-search',
        title: 'Buscador',
        body: 'Escribe parte del título, del código corto o de una etiqueta.',
        placement: 'bottom',
      },
      {
        route: '/codigos',
        target: 'codes-filters',
        title: 'Filtros',
        body: 'Limita la lista a un proyecto o a un estado: borrador, publicado o retirado.',
        placement: 'bottom',
      },
      {
        route: '/codigos',
        target: 'codes-table',
        title: 'Resultados',
        body: 'Pulsa un código para abrir su ficha. Si no aparece nada, usa «Limpiar filtros».',
        placement: 'top',
      },
      {
        title: 'Filtros en la dirección',
        body: 'Los filtros quedan en la URL: puedes guardarla o compartirla para volver a la misma búsqueda.',
      },
    ],
  },
  {
    id: 'gestionar-codigo',
    title: 'Editar, publicar, retirar y descargar',
    description: 'Lo que puedes hacer desde la ficha de un código.',
    category: 'Códigos',
    steps: [
      {
        route: '/codigos',
        target: 'codes-table',
        title: 'Abre la ficha',
        body: 'Todo se hace desde la ficha de cada código. Para llegar, pulsa uno de esta lista.',
        placement: 'top',
      },
      {
        title: 'Cambiar el destino',
        body: 'En «Datos» edita el destino, el título, el proyecto o las etiquetas y pulsa «Guardar». El QR impreso no cambia.',
      },
      {
        title: 'Publicar o retirar',
        body: 'Los botones junto a «Al escanear lleva a» cambian el estado. Un código retirado lleva a la página fijada en Ajustes.',
      },
      {
        title: 'Descargar',
        body: 'En «Descargar» eliges formato y tamaño. Guarda o descarta los cambios pendientes antes de descargar.',
      },
      {
        title: 'Copiar la URL impresa',
        body: '«Copiar URL impresa» copia la dirección corta que codifica el QR, útil para enlaces digitales.',
      },
    ],
  },
  {
    id: 'importar-codigos',
    title: 'Importar códigos en lote',
    description: 'Trae QR ya impresos desde imágenes, enlaces o un CSV.',
    category: 'Códigos',
    requires: 'qr:write',
    steps: [
      {
        route: '/importar',
        target: 'nav-importar',
        title: 'Importar',
        body: 'Para QR que ya se imprimieron con otra plataforma: cada uno recibe una URL corta con el mismo destino.',
        placement: 'right',
      },
      {
        route: '/importar',
        target: 'import-source',
        title: 'Elige el origen',
        body: 'Arrastra imágenes de los QR, pega un enlace por línea o pulsa «Abrir CSV».',
        placement: 'bottom',
      },
      {
        route: '/importar',
        target: 'import-review',
        title: 'Revisa la lista',
        body: 'Solo se importan las entradas marcadas como listas; las demás se quedan en la lista para corregirlas.',
        placement: 'top',
      },
      {
        title: 'Proyecto, estado e importación',
        body: 'Elige proyecto y estado, añade etiquetas si quieres y pulsa «Importar códigos».',
      },
    ],
  },
  {
    id: 'ver-analitica',
    title: 'Ver la analítica y exportar CSV',
    description: 'Consulta los escaneos y descárgalos en una hoja de cálculo.',
    category: 'Análisis',
    requires: 'analytics:read',
    steps: [
      {
        route: '/analitica',
        target: 'analytics-filters',
        title: 'Periodo y proyecto',
        body: 'Elige el rango de días y, si quieres, un proyecto concreto.',
        placement: 'bottom',
      },
      {
        route: '/analitica',
        target: 'analytics-stats',
        title: 'Cifras clave',
        body: 'Escaneos, promedio diario y códigos activos, comparados con el periodo anterior.',
        placement: 'bottom',
      },
      {
        route: '/analitica',
        target: 'analytics-daily',
        title: 'Gráficos',
        body: 'Escaneos por día, códigos más escaneados y reparto por hora, material, proyecto y navegador.',
        placement: 'top',
      },
      {
        route: '/analitica',
        target: 'analytics-export',
        title: 'Exportar CSV',
        body: 'Descarga los escaneos del filtro actual para abrirlos en una hoja de cálculo.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'personas-y-roles',
    title: 'Gestionar personas y roles',
    description: 'Da acceso a una cuenta y elige qué puede hacer.',
    category: 'Administración',
    requires: 'settings:write',
    steps: [
      {
        route: '/ajustes',
        target: 'roles-card',
        title: 'Personas con acceso',
        body: 'Solo entran las cuentas institucionales que añadas aquí.',
        placement: 'top',
      },
      {
        route: '/ajustes',
        target: 'roles-form',
        title: 'Asignar un rol',
        body: 'Escribe el correo, elige el rol y pulsa «Asignar rol».',
        placement: 'bottom',
      },
      {
        title: 'Los tres roles',
        body: 'Administrador: control total. Editor: crea y descarga QR. Consultor: solo ve las métricas.',
      },
      {
        title: 'Cambiar o retirar el acceso',
        body: 'En la lista de personas puedes cambiar el rol de cada cuenta o retirarle el acceso.',
      },
    ],
  },
  {
    id: 'ajustes-organizacion',
    title: 'Ajustes de la organización',
    description: 'Nombre de la organización y página para códigos retirados.',
    category: 'Administración',
    requires: 'settings:write',
    steps: [
      {
        route: '/ajustes',
        target: 'nav-ajustes',
        title: 'Ajustes',
        body: 'Configuración común a toda la organización. Solo la cambian los administradores.',
        placement: 'right',
      },
      {
        route: '/ajustes',
        target: 'settings-org',
        title: 'Datos de la organización',
        body: 'Cambia el nombre y fija la página para códigos retirados. Sin ella no se puede retirar ningún código.',
        placement: 'bottom',
      },
      {
        title: 'Guarda los cambios',
        body: 'Pulsa «Guardar» al terminar; verás la confirmación «Guardado».',
      },
    ],
  },
]

export function getTour(id) {
  return TOURS.find((tour) => tour.id === id)
}
