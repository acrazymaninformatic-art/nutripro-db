export function calculateAgeAtDate(birthDate: Date | string, referenceDate = new Date()) {
  const birth = new Date(birthDate)
  let age = referenceDate.getFullYear() - birth.getFullYear()
  const month = referenceDate.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && referenceDate.getDate() < birth.getDate())) age -= 1
  return age
}

export function isMinorAtDate(birthDate: Date | string, referenceDate = new Date()) {
  return calculateAgeAtDate(birthDate, referenceDate) < 18
}
