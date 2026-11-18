export function breakLongTextAtCharacters(word) {
  return Array.from(word)
}

export function isPdfFieldFullWidth(label, value) {
  const normalizedLabel = String(label || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')

  return (
    /adresse|address|localisation|google|maps|gps|url|site web/.test(normalizedLabel) ||
    String(value ?? '').length > 50
  )
}
