import { ClinicalCalculator } from './calculator-client'

export const metadata = {
  title: 'Calculadora Nutricional & TMB | EVSoftware',
  description: 'Calculadora metabólica clínica para dietistas y nutricionistas · Eva Vidal Nutrición.',
}

export default function CalculatorPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <ClinicalCalculator />
    </div>
  )
}
