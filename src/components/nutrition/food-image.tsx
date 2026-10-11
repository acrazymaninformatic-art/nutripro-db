'use client'

import { useState } from 'react'
import { FALLBACK_FOOD_SVG } from '@/lib/nutrition'

interface FoodImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  category?: string | null
}

export function FoodImage({
  src,
  alt,
  className = 'h-full w-full object-cover',
  width,
  height,
  loading = 'lazy',
}: FoodImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      onError={() => {
        if (currentSrc !== FALLBACK_FOOD_SVG) {
          setCurrentSrc(FALLBACK_FOOD_SVG)
        }
      }}
    />
  )
}
