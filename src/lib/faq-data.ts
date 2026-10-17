export interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

export const DEFAULT_FAQS: FAQItem[] = [
  // Citas
  {
    id: 'citas-1',
    category: 'Citas',
    question: '¿Cómo pido, cambio o cancelo una cita?',
    answer: 'En la sección «Mis Citas», solicita tu cita indicando tu modalidad preferida (Online o Presencial). Eva fija el día y la hora según la agenda de consulta. También puedes solicitar el cambio o cancelación de una cita ya asignada.',
  },
  {
    id: 'citas-2',
    category: 'Citas',
    question: '¿Dónde veo el enlace de mi videollamada?',
    answer: 'Si tu cita es Online, el enlace de Google Meet aparecerá visible directamente en la tarjeta de tu cita dentro de «Mis Citas» una vez que Eva haya confirmado el día y la hora.',
  },

  // Mi Plan
  {
    id: 'plan-1',
    category: 'Mi Plan',
    question: '¿Dónde veo las recetas?',
    answer: 'En «Mi Plan», haz clic sobre cualquier plato o preparación marcada para abrir la receta completa interactiva con sus ingredientes en gramos, pasos e información nutricional.',
  },
  {
    id: 'plan-2',
    category: 'Mi Plan',
    question: '¿Cómo descargo el plan en PDF o imprimo la lista de la compra?',
    answer: 'En la cabecera de «Mi Plan» tienes los botones para descargar tu Dossier Clínico en PDF de alta resolución y consultar la Lista de la Compra (una lista limpia para revisar lo necesario para tus comidas).',
  },
  {
    id: 'plan-3',
    category: 'Mi Plan',
    question: '¿Puedo cambiar un alimento por otro?',
    answer: 'Sí, tanto tu plan como el dossier en PDF incluyen una Guía de Intercambios equivalente para sustituir alimentos del mismo grupo nutricional respetando tus alergias.',
  },
  {
    id: 'plan-4',
    category: 'Mi Plan',
    question: '¿Cada cuánto se renueva mi plan?',
    answer: 'Eva renueva o ajusta tu plan nutricional tras cada consulta de seguimiento según tu progreso, adherencia y sensaciones digestivas.',
  },

  // Cuestionarios y Firmas
  {
    id: 'cuest-1',
    category: 'Cuestionarios y Firmas',
    question: '¿Cómo relleno un cuestionario o firmo un documento?',
    answer: 'Al entrar a tu portal verás un aviso si tienes cuestionarios o consentimientos pendientes. Puedes completarlos o firmarlos en pantalla directamente desde tu móvil u ordenador.',
  },
  {
    id: 'cuest-2',
    category: 'Cuestionarios y Firmas',
    question: '¿Puedo guardarlo y terminarlo más tarde?',
    answer: 'Sí, el cuestionario de anamnesis digital guarda tu avance para que puedas reanudarlo cuando te venga bien antes de enviarlo a Eva.',
  },
  {
    id: 'cuest-3',
    category: 'Cuestionarios y Firmas',
    question: '¿Por qué no puedo apuntar mi peso ni mis comidas?',
    answer: 'El portal es estrictamente informativo y clínico, no un diario de conteo ni una red social. Para evitar obsesiones con la báscula y asegurar el rigor diagnóstico, los datos antropométricos válidos son los que Eva registra en consulta.',
  },
  {
    id: 'cuest-4',
    category: 'Cuestionarios y Firmas',
    question: '¿Por qué no veo mi evolución o mi analítica?',
    answer: 'Cada elemento clínico (peso, composición, analíticas, notas) cuenta con un interruptor de publicación y permanece privado hasta que Eva lo revisa clínicamente y lo comparte contigo.',
  },

  // Mi Cuenta y mis datos
  {
    id: 'cuenta-1',
    category: 'Mi Cuenta y RGPD',
    question: 'He olvidado mi contraseña, ¿qué hago?',
    answer: 'En la pantalla de acceso pulsa «¿Has olvidado tu contraseña?». Si tu correo existe en el sistema, recibirás un enlace seguro de un solo uso con caducidad corta para fijar una nueva contraseña (mínimo 12 caracteres).',
  },
  {
    id: 'cuenta-2',
    category: 'Mi Cuenta y RGPD',
    question: '¿Cómo activo el segundo factor?',
    answer: 'El segundo factor (2FA) es obligatorio para la cuenta de administración y opcional para pacientes. Puedes consultar su activación con Eva desde consulta.',
  },
  {
    id: 'cuenta-3',
    category: 'Mi Cuenta y RGPD',
    question: '¿Quién puede ver mis datos?',
    answer: 'Únicamente tu nutricionista responsable (Eva Vidal). El sistema aplica aislamiento estricto por sesión y base de datos: ningún paciente puede ver datos ni nombres de otros.',
  },
  {
    id: 'cuenta-4',
    category: 'Mi Cuenta y RGPD',
    question: '¿Cómo pido una copia de mis datos o que los borren?',
    answer: 'En «Mi Cuenta» puedes descargar al momento una copia íntegra de tu ficha en JSON (Art. 20 RGPD) o registrar una solicitud formal de supresión (Art. 17 RGPD).',
  },

  // Dudas entre consultas
  {
    id: 'dudas-1',
    category: 'Dudas entre consultas',
    question: 'Tengo una duda sobre mi plan, ¿qué hago?',
    answer: 'Te recomendamos anotar todas tus dudas cotidianas para tratarlas con detalle y tiempo en tu próxima sesión de revisión programada. Recuerda que el portal es informativo y no es un chat.',
  },
]
