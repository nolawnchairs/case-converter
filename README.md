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
Rama IX
```

The functionality is biased towards proper English-language conventions.

## Basic Usage

Instantiate an instance with an optional `options` parameter to the constructor then pass a string of single or multiple words to the convert method:

```typescript

const converter = new NameCaseConverter()
const cased = converter.convert('fordo baggins')
console.log(cased) // "Frodo Baggins"
```

The built-in converters are called in the following order:
  * Hyphenated words
  * Words starting with Mc or Mac
  * Words starting with L', O' or D'

## Options

The `NameCaseConverter` constructor takes an optional object as its parameter.

```typescript
interface NameCaseConverterOptions {
  ignores?: IgnoreRule[]
  converters?: Converter[]
  disableDefault?: ConverterId[] | boolean
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
`converters` - an array of `Converter` instances that will provide a user-defined conversion matched by the regex provided in the constructor, and operated on by the callback operator function provided. These converters will be called *before* any of the default converters used internally.

The operator callback function provides the following arguments:

```typescript
function (chunk: string, index: number, accumulated: string[], options: NameCaseConverterOptions) => string
```

`chunk` - The unaltered string chunk that was matched via regex

`index` - The index of the string chunk. This can be useful for determining if the chunk is the first word of multiple words

`accumulated` - A string array of the chunks already converted. Useful if the action to take on the current chunk depends on previous results of the iteration.

`options` - The `NameCaseConverterOptions` object provided. This can be useful if you need to pass options down to another conversion layer using the same configuration to any recursive implementations of `NameCaseConverter` within your custom converter

```typescript
new Converter(/^Mac[^aeiou]/, (value, index) => {
  return 'A custom string'
})

// An example leveraging chunk index
const converter = new NameCaseConverter({
  converters: [
    new Converter(/^De[A-Za-z]+$/, (chunk, index, accumulated) => {
      console.log(chunk, index, accumulated) // "DeSantos", 1, ["Dave"]
      return chunk
    })
  ]
})
const result = converter.convert('Dave DeSantos')
console.log(result) // "Dave DeSantos"
```

`disableDefault` - Provide an array of `ConverterId` enum values to selectively disable built-in converters, or supply `true` to disable all built-in converters. Supplying false will therefore have no effect.

```typescript
export enum ConverterId {
  HYPENATED,
  MC,
  MAC,
  DLO_APOSTRAPHE,
  ROMAN_NUMERALS,
}

const converter = NameCaseConverter.toTitleCase({
  disableDefault: [ConverterId.MC]
})
console.log(converter.convert('mcclane')) // "Mcclane"
```

## Global Options

Options can be applied globally. Any options passed to converters will be merged with global options, with user-defined options taking precedence. Any Converters or IgnoreRules passed to converters will be added to those set globally and will also take precedence.

```typescript
NameCaseConverter.setGlobalOptions({
  converters: [
    new Converter(/^De[A-Za-z]+$/, (chunk, index, accumulated) => {
      console.log(chunk, index, accumulated) // "DeSantos", 1, ["Dave"]
      return chunk
    })
  ],
  disableDefaults: [
    ConverterId.MAC,
  ],
})
```

> This is obviously a contrived example since it doesn't do anythig, but shows how a custom converter works.

## Title Case

The API also exposes a simple static title-case method. It will properly title case a word or all words in a sentence. If the input is a single word it will be capitalized indiscriminantly:

```typescript
const titleCased = NameCaseConverter.toTitleCase('frodo')
console.log(titleCased) // "Frodo"

const titleCased2 = NameCaseConverter.toTitleCase('McClane')
console.log(titleCased2) // "Mcclane"
```

If the input contains one or more spaces, each word passed through the default name case conversion layer, applying the  built-in rule sets without additional configuration. Common articles, conjunctions and prepositions are converted to lowercase:

```typescript
const titleCased = NameCaseConverter.toTitleCase('lord of the rings')
console.log(titleCased) // "Lord of the Rings"
```

### Title Case vs Name Case

While these two methods ostensibly do the same thing, name case is designed for converting people's names and allows granular control over string conversion via `IgnoreRule` and `Converter` implementations provided to it. Title case, on the other hand is not configurable, and is designed for converting sentences such as movie and book titles.

If you wish to add your own rules as to which words will be forced to lowercase, you can create a new instance of `NameCaseConverter` with your regular expression defined as a custom converter (which is what this method actually does internally):

```typescript
new NameCaseConverter(input, {
  converters: [
    new Converter(/^(whichever|words|you|want|to|be|forced|to|lowercase)$/i, (chunk, index) => {
      // The first chunk (word) passed will be title-cased, all others will be converted to lowercase
      return index ? chunk.toLowerCase() : NameCaseConverter.toTitleCase(chunk)
    })
  ]
})
```

## Functional API

For those who prefer a functional approach, the following functions are available:

### `toNameCase`
Converts a string and (all words) to a proper name-cased string. Alias for `new NameCaseConverter().convert(word)`

```typescript
function toNameCase(): string
function toNameCase(options: NameCaseConverterOptions): string

console.log(toNameCase('john mclane')) // "John McClane"
```

### `toTitleCase`
Converts a single word to Title Case. Alias for `NameCaseConverter.toTitleCase(word)`

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

### `createConverter`
Creates an instance of `Converter`
```typescript
function createConverter(regex: RegExp, callback: (value: string, chunkIndex: number) => string): Converter;

const result = toNameCase('Dave DeSantos', {
  converters: [
    createConverter(/^DeS[aeiou]+$/, chunk => toTitleCase(chunk))
  ]
})
console.log(result) // "Dave Desantos"
```

## Notes

* Output values are always trimmed. If the input string contains spaces, it is chunked and each chunk is trimmed before being joined with a single space.
* The following words are not capitalized when converting to title case, unless they're the first or only word in the string: `a`, `an`, `the`, `to`, `in`, `on`, `of`, `from`, `and`, `with`