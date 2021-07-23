# Name Case Converter

A simple, no-dependency library that will convert strings to proper name title case. Useful for standardizing user input that may be entered in all lowercase or all uppercase.

This library will detect and maintain proper letter case for common names and surnames, such as:

```
McDonand
MacLamore
O'Brien
L'Agnes
D'Artagnan
Saint-Claire
```

The functionality is biased towards proper English-language conventions.

## Basic Usage

Provide a string of single or multiple words to the constructor

```typescript

const input = 'fordo baggins'
const cased = new NameCaseConverter(input).toString()
console.log(cased) // "Frodo Baggins"

```

## Options

The `NameCaseConverter` constructor takes an optional object second parameter.

```typescript
interface NameCaseConverterOptions {
  ignores?: IgnoreRule[]
  converters?: CustomConverter[]
}
```

`ignores` - An array of `IngoreRule` instances that will skip validation based on the defined rule. `IgnoreRule` contains three static factory methods:

```typescript
// Provide Regex
IgnoreRule.regex(/^Mac[^aeiou]/)

// Provide a case-insensitive string or array of strings
IgnoreRule.insensitive('frodo')
IgnoreRule.insensitive(['frodo', 'sam', 'merry'])

// Provide a case-sensitive string or array of strings
IgnoreRule.exact('Frodo')
IgnoreRule.exact(['Frodo', 'Sam', 'Merry'])
```
`converters` - an array of `CustomConverter` instances that will provide a user-defined conversion matched by the regex provided in the constructor. The callback function will pass the `value`, the unaltered (but trimmed) value being operated on, as well as the `index`, which is the chunk index of the value. The callback function will be called for each "chunk" making up the word (each separate word in a space-separated input):

```typescript
new CustomConverter(/^Mac[^aeiou]/, (value, index) => {
  return 'A custom string'
})

// An example leverageing chunk index
const converter = new NameCaseConverter('Dave DeSantos', {
  converters: [
    new CustomConverter(/^De[A-Z][a-z]+$/, (w, i) => `${w}_${i}`)
  ]
})
const result = converter.toString()
console.log(result) // "Dave DeSantos_1"

```

## Title Case

The API also exposes a simple static title-case method, while used internally, and will properly title case a word or sentence. If the input is a single word it will be capitalized:

```typescript
const titleCased = NameCaseConverter.toTitleCase('frodo')
console.log(titleCased) // "Frodo"
```

If the input contains one or more spaces, each word is capitalized except for common articles, conjunctions and prepositions:

```typescript
const titleCased = NameCaseConverter.toTitleCase('lord of the rings')
console.log(titleCased) // "Lord of the Rings"
```

## Functional API

For those who prefer a functional approach, you can import the functional library like so:

```typescript
import { toNameCase, toTitleCase } = from '@nolawnchairs/name-case/functional'
```

```typescript
// Converts a string and (all words) to a proper name-cased string
// Alias for new NameCaseConverter().toString()
function toNameCase(input: string, options?: NameCaseConverterOptions): string

console.log(toNameCase('john mclane')) // "John McClane"

// Converts a single word to Title Case
// Alias to NameCaseConverter.toTitleCase()
function toTitleCase(input: string): string

console.log(
  toNameCase('frodo baggins'),
  toTitleCase('samwise')) // "Frodo Baggins", "Samwise"
```

## Notes

* Output values are always trimmed. If the input string contains spaces, it is chunked and each chunk is trimmed before being joined with a single space.