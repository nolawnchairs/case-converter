# Name Case Converter

A simple, no-dependency library that will convert strings to proper name title case. Useful for standardizing user input that may be entered in all lowercase or all uppercase.

This library will detect and maintain proper letter case for common names and surnames, such as:

```
McDonald
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

`ignores` - An array of `IgnoreRule` instances that will skip validation based on the defined rule. `IgnoreRule` contains three static factory methods:

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

// An example leveraging chunk index
const converter = new NameCaseConverter('Dave DeSantos', {
  converters: [
    new CustomConverter(/^De[A-Z][a-z]+$/, (w, i) => `${w}_${i}`)
  ]
})
const result = converter.toString()
console.log(result) // "Dave DeSantos_1"
```

> This is obviously a contrived example, but shows how a custom converter works

## Title Case

The API also exposes a simple static title-case method, while used internally, and will properly title case a word or sentence. If the input is a single word it will be capitalized indiscriminantly:

```typescript
const titleCased = NameCaseConverter.toTitleCase('frodo')
console.log(titleCased) // "Frodo"

const titleCased2 = NameCaseConverter.toTitleCase('McClane')
console.log(titleCased2) // "Mcclane"
```

If the input contains one or more spaces, each word is capitalized except for common articles, conjunctions and prepositions:

```typescript
const titleCased = NameCaseConverter.toTitleCase('lord of the rings')
console.log(titleCased) // "Lord of the Rings"
```

### Title Case vs Name Case

While these two methods ostensibly do the same thing, name case is designed for converting people's names and allows granular control over string conversion via `IgnoreRule` and `CustomConverter` implementations provided to it. Title case, on the other hand is not configurable, and is designed for converting sentences such as movie and book titles.
## Functional API

For those who prefer a functional approach, the following functions are available:

### `toNameCase`
Converts a string and (all words) to a proper name-cased string. Alias for new NameCaseConverter().toString()

```typescript
function toNameCase(input: string): string
function toNameCase(input: string, options: NameCaseConverterOptions): string

console.log(toNameCase('john mclane')) // "John McClane"
```

### `toTitleCase`
Converts a single word to Title Case. Alias for NameCaseConverter.toTitleCase()

```typescript
function toTitleCase(input: string): string

console.log(toTitleCase('LORD OF THE RINGS')) // "Lord of the Rings"
```

### `createIgnoreRule`
Creates an instance of an `IgnoreRule` for customizing `toNameCase` or `new NameCaseConverter()`. The optional `caseInsensitive` parameter for the string-based overloads will default to `false` if not provided.

```typescript
function createIgnoreRule(matcher: string, caseInsensitive?: boolean): IgnoreRule;
function createIgnoreRule(matcher: string[], caseInsensitive?: boolean): IgnoreRule;
function createIgnoreRule(matcher: RegExp): IgnoreRule;
```

### `createCustomConverter`
Creates an instance of `CustomConverter`
```typescript
function createConverter(regex: RegExp, callback: (value: string, chunkIndex: number) => string): CustomConverter;

const result = toNameCase('Dave DeSantos', {
  converters: [
    createConverter(/^DeS[aeiou]+$/, w => toTitleCase(w))
  ]
})
console.log(result) // "Dave Desantos"
```

## Notes

* Output values are always trimmed. If the input string contains spaces, it is chunked and each chunk is trimmed before being joined with a single space.
* The following words are not capitalized when converting to title case, unless they're the first or only word in the string: `a`, `an`, `the`, `to`, `in`, `on`, `of`, `from`, `and`, `with`