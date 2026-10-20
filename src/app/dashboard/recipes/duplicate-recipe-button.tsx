'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2 } from 'lucide-react'
import { duplicateRecipe } from './actions'

export function DuplicateRecipeButton({ recipeId }: { recipeId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      title="Duplicar receta"
      aria-label="Duplicar receta"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await duplicateRecipe(recipeId)
            router.refresh()
          } catch {
            // El error se muestra en el centro de notificaciones global.
          }
        })
      }
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.95] disabled:opacity-60"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}
