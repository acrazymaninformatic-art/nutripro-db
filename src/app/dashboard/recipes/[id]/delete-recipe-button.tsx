'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteRecipe } from '../actions'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

export function DeleteRecipeButton({ recipeId, recipeName }: { recipeId: string; recipeName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(`¿Deseas eliminar la receta "${recipeName}" del catálogo?`)
    if (!confirmed) return

    setLoading(true)
    try {
      await deleteRecipe(recipeId)
      router.push('/dashboard/recipes')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error al eliminar la receta')
      setLoading(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1.5"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span>Eliminar Receta</span>
    </Button>
  )
}
