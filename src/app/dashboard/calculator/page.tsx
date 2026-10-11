import { ClinicalCalculator } from './calculator-client'

export const metadata = {
  title: 'Calculadora Nutricional & TMB | NutriPro',
  description: 'Calculadora metabólica clínica para dietistas y nutricionistas.',
}

export default function CalculatorPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <ClinicalCalculator />
    </div>
  )
}
