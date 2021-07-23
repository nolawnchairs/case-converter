const { NameCaseConverter, CustomConverter, IgnoreRule, toNameCase, toTitleCase } = require('.')

test('Ensure standard names come back as title cased', () => {
  const converter = new NameCaseConverter('robbins')
  const result = converter.toString()
  expect(result).toBe('Robbins')
})

test('Ensure names starting with Mc or Mac is properly cased', () => {
  const converter = new NameCaseConverter('macintosh mcclintock MCDONALD')
  const result = converter.toString()
  expect(result).toBe('MacIntosh McClintock McDonald')
})

test('Ensure names starting with L\', O\' or D\' is properly cased', () => {
  expect(toNameCase(`d'artagnan`)).toBe(`D'Artagnan`)
  expect(toNameCase(`O'NEILL`)).toBe(`O'Neill`)
  expect(toNameCase(`l'Amour`)).toBe(`L'Amour`)
})

test('Ensure hyphenized names are properly cased', () => {
  const converter = new NameCaseConverter(`saint-claire royce-Calvert d'arne-SMITH ROLLS-ROYCE`)
  const result = converter.toString()
  expect(result).toBe(`Saint-Claire Royce-Calvert D'Arne-Smith Rolls-Royce`)
})

test('Ensure string-based ingore rules indeed bypass conversion', () => {
  const converter = new NameCaseConverter('MIXEDcaseWord', {
    ignores: [
      IgnoreRule.insensitive('mixedcaseword')
    ]
  })
  const result = converter.toString()
  expect(result).toBe('MIXEDcaseWord')
})

test('Ensure string-array-based ingore rules indeed bypass conversion', () => {
  const converter = new NameCaseConverter('FRODO baggins', {
    ignores: [
      IgnoreRule.insensitive(['frodo', 'baggins'])
    ]
  })
  const result = converter.toString()
  expect(result).toBe('FRODO baggins')
  expect(result).not.toBe('Frodo Baggins')
})

test('Ensure regex-based ingore rules indeed bypass conversion', () => {
  const converter = new NameCaseConverter('Al-shalah', {
    ignores: [
      IgnoreRule.regex(/^al-/i)
    ]
  })
  const result = converter.toString()
  expect(result).toBe('Al-shalah')
})

test('Ensure custom operator works', () => {
  const converter = new NameCaseConverter('Dave DeSantos', {
    converters: [new CustomConverter(/^De[A-Z][a-z]+$/, (w, i) => `${w}_${i}`)]
  })
  const result = converter.toString()
  expect(result).toBe('Dave DeSantos_1')
})

test('Ensure title case works for multiple words', () => {
  expect(NameCaseConverter.toTitleCase('lord of the rings')).toBe('Lord of the Rings')
  expect(NameCaseConverter.toTitleCase('OF MICE AND MEN')).toBe('Of Mice and Men')
})


test('Ensure functional API exports and runs correctly', () => {
  expect(toNameCase('frodo baggins d\'artagnan saint-claire')).toBe('Frodo Baggins d\'Artagnan Saint-Claire')
  expect(toTitleCase('frodo')).toBe('Frodo')
  expect(toTitleCase('the fellowship of the ring')).toBe('The Fellowship of the Ring')
})