const { CaseConverter, Converter, ConverterId, IgnoreRule, toNameCase, toTitleCase } = require('.')

CaseConverter.setGlobalOptions({
  ignores: [
    IgnoreRule.exact('TRIGGER_GLOBAL'),
    IgnoreRule.regex(/^G{3,}/),
  ]
})

test('Ensure standard names come back as title cased', () => {
  const result = toNameCase('robbins')
  expect(result).toBe('Robbins')
})

test('Ensure names starting with Mc or Mac is properly cased', () => {
  const result = toNameCase('macintosh mcclintock MCDONALD')
  expect(result).toBe('MacIntosh McClintock McDonald')
})

test('Ensure names starting with L\', O\' or D\' is properly cased', () => {
  expect(toNameCase(`d'artagnan`)).toBe(`D'Artagnan`)
  expect(toNameCase(`O'NEILL`)).toBe(`O'Neill`)
  expect(toNameCase(`l'Amour`)).toBe(`L'Amour`)
})

test('Ensure hyphenized names are properly cased', () => {
  const converter = new CaseConverter()
  const result = converter.toNameCase(`saint-claire royce-Calvert d'arne-SMITH ROLLS-ROYCE`)
  expect(result).toBe(`Saint-Claire Royce-Calvert D'Arne-Smith Rolls-Royce`)
})

test('Ensure string-based ingore rules indeed bypass conversion', () => {
  const converter = new CaseConverter({
    ignores: [
      IgnoreRule.insensitive('mixedcaseword')
    ]
  })
  const result = converter.toNameCase('MIXEDcaseWord')
  expect(result).toBe('MIXEDcaseWord')
})

test('Ensure string-array-based ingore rules indeed bypass conversion', () => {
  const converter = new CaseConverter({
    ignores: [
      IgnoreRule.insensitive(['frodo', 'baggins'])
    ]
  })
  const result = converter.toNameCase('FRODO baggins')
  expect(result).toBe('FRODO baggins')
  expect(result).not.toBe('Frodo Baggins')
})

test('Ensure regex-based ingore rules indeed bypass conversion', () => {
  const converter = new CaseConverter({
    ignores: [
      IgnoreRule.regex(/^al-/i)
    ]
  })
  const result = converter.toNameCase('Al-shalah')
  expect(result).toBe('Al-shalah')
})

test('Ensure default converter omission works', () => {
  const make = (value, disableDefault = true) => new CaseConverter({ disableDefault }).toNameCase(value)

  expect(make('frodo baggins')).toBe('Frodo Baggins')
  expect(make('john mcclane')).toBe('John Mcclane')
  expect(make(`Paddy o'brien`)).toBe('Paddy O\'brien')
  expect(make('henry viii', false)).toBe('Henry VIII')

  expect(make('john mcclane', [ConverterId.MC])).toBe('John Mcclane')
  expect(make('saint-claire', [ConverterId.HYPENATED])).toBe('Saint-claire')
  expect(make(`l'amour o'brien`, [ConverterId.DLO_APOSTRAPHE])).toBe(`L'amour O'brien`)
  expect(make('Henry VIII', [ConverterId.ROMAN_NUMERALS])).toBe('Henry Viii')
})

test('Ensure custom operator works', () => {
  const converter = new CaseConverter({
    converters: [new Converter(/^De[A-Z][a-z]+$/, (w, i) => `${w}_${i}`)]
  })
  const result = converter.toNameCase('Dave DeSantos')
  expect(result).toBe('Dave DeSantos_1')
})

test('Ensure title case works for multiple words', () => {
  expect(CaseConverter.toTitleCase('lord of the rings')).toBe('Lord of the Rings')
  expect(CaseConverter.toTitleCase('OF MICE AND MEN')).toBe('Of Mice and Men')
})


test('Ensure functional API exports and runs correctly', () => {
  expect(toNameCase('frodo baggins d\'artagnan saint-claire')).toBe('Frodo Baggins d\'Artagnan Saint-Claire')
  expect(toTitleCase('frodo')).toBe('Frodo')
  expect(toTitleCase('the fellowship of the ring')).toBe('The Fellowship of the Ring')
})

test('Ensure global options are set', () => {
  expect(toNameCase('TRIGGER_GLOBAL')).toBe('TRIGGER_GLOBAL')
  expect(toNameCase('GGG')).toBe('GGG')
  expect(toNameCase('GG')).toBe('Gg')
})


test('Ensure global ignore is overridden', () => {
  expect(toNameCase('GG', { ignores: [IgnoreRule.exact('GG')] })).toBe('GG')
  expect(toNameCase('gg', { ignores: [IgnoreRule.insensitive('GG')] })).toBe('gg')
  expect(toNameCase('gg', { ignores: [IgnoreRule.regex(/^GG/i)] })).toBe('gg')
})
