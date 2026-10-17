'use server'

import { requireAdmin } from '@/lib/auth'
import { getPortalFaqs, savePortalFaqs, DEFAULT_FAQS, type FAQItem } from '@/lib/faq-service'
import { revalidatePath } from 'next/cache'

export async function getFaqsAction(): Promise<FAQItem[]> {
  await requireAdmin()
  return await getPortalFaqs()
}

export async function updateFaqAction(id: string, newAnswer: string, newQuestion?: string): Promise<{ success: boolean; message: string }> {
  await requireAdmin()

  const currentFaqs = await getPortalFaqs()
  const updated = currentFaqs.map((f) => {
    if (f.id === id) {
      return {
        ...f,
        question: newQuestion ? newQuestion.trim() : f.question,
        answer: newAnswer.trim(),
      }
    }
    return f
  })

  await savePortalFaqs(updated)
  revalidatePath('/dashboard/settings')
  revalidatePath('/paciente')
  return { success: true, message: 'Respuesta guardada y publicada en el portal de pacientes.' }
}

export async function resetFaqsAction(): Promise<{ success: boolean; message: string }> {
  await requireAdmin()
  await savePortalFaqs(DEFAULT_FAQS)
  revalidatePath('/dashboard/settings')
  revalidatePath('/paciente')
  return { success: true, message: 'Preguntas frecuentes restauradas a los textos estándar.' }
}
