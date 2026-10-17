'use client'

import { useState } from 'react'
import { FOOD_EXCHANGE_GROUPS } from '@/lib/nutrition/exchange-system'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Layers, Search } from 'lucide-react'

export function ExchangeGuide() {
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')

  const groups = Object.values(FOOD_EXCHANGE_GROUPS)

  const filteredGroups = groups.map((g) => {
    if (selectedGroup !== 'all' && g.id !== selectedGroup) return null

    const matchingExamples = g.examples.filter((ex) =>
      ex.food.toLowerCase().includes(search.toLowerCase())
    )

    if (search && matchingExamples.length === 0) return null

    return {
      ...g,
      examples: search ? matchingExamples : g.examples,
    }
  }).filter(Boolean) as typeof groups

  return (
    <div className="space-y-5">
      {/* Explicación clínica */}
      <Card className="rounded-3xl border-blue-200 bg-gradient-to-r from-blue-50/60 via-white to-white overflow-hidden shadow-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">
                Sistema Oficial de Intercambios de Alimentos (CESNID / SEEDO / EasyDiet)
              </h2>
              <p className="text-xs text-gray-600 max-w-2xl mt-0.5">
                En lugar de pesar alimentos en gramos rígidos, el paciente puede intercambiar 1 porción por cualquier alimento de su mismo grupo manteniendo las mismas calorías y macronutrientes.
              </p>
            </div>
          </div>
          <Badge className="bg-blue-600 text-white rounded-full font-bold px-3 py-1 text-xs shrink-0">
            Estándar Español de Nutrición
          </Badge>
        </CardContent>
      </Card>

      {/* Filtros rápidos */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedGroup('all')}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
              selectedGroup === 'all'
                ? 'bg-blue-700 text-white shadow-2xs font-bold'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos los Grupos
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGroup(g.id)}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                selectedGroup === g.id
                  ? 'bg-blue-700 text-white shadow-2xs font-bold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {g.shortName}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar alimento (pan, pollo, manzana...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Grupos y Raciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="rounded-3xl border-gray-200 overflow-hidden shadow-xs hover:border-blue-300 transition-all">
            <CardHeader className="p-4 bg-gray-50/70 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${group.badgeBg} ${group.badgeText}`}>
                  {group.name}
                </span>
                <span className="text-2xs font-black text-gray-500">
                  {group.macronutrientsPerExchange.kcal} kcal / ración
                </span>
              </div>
              <p className="text-2xs text-gray-500 mt-1 font-medium">
                {group.baseUnitDefinition}
              </p>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {group.examples.map((ex, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-gray-50/50 border border-gray-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900 truncate pr-1">{ex.food}</span>
                    <span className="font-extrabold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-lg text-2xs shrink-0">
                      {ex.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
