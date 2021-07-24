
export type ConverterOperator = (chunk: string, index: number, accumulated: string[], options: NameCaseConverterOptions) => string

export class CustomConverter {
  /**
   * Creates an instance of CustomConverter. Provide a regex matcher and
   * an operator function. The operator function supplies a string that was matched to the provided regex
   * and returns the final value to apply to the output
   *
   * @param {RegExp} regex the regex that will be matched against input strings
   * @param {ConverterOperator} operator a function that returns the desired output
   * @memberof CustomConverter
   */
  constructor(
    readonly regex: RegExp,
    readonly operator: ConverterOperator) { }
}

export class IgnoreRule {

  /**
   * Creates an instance of IgnoreRule. Not exposed to the public API,
   * instead use static factory methods
   *
   * @param {(string | string[] | RegExp)} matcher string, string array or regex matcher
   * @param {boolean} [caseInsensitive=false] whether a string matcher is case-insensitive
   * @memberof IgnoreRule
   */
  constructor(
    readonly matcher: string | string[] | RegExp,
    readonly caseInsensitive = false) { }

  /**
   * Create a new IgnoreRule using regex
   *
   * @static
   * @param {RegExp} matcher
   * @return {*}  {IgnoreRule}
   * @memberof IgnoreRule
   */
  static regex(matcher: RegExp): IgnoreRule {
    return new IgnoreRule(matcher)
  }

  /**
   * Create a new IgnoreRule using a case-sensitive string match
   *
   * @static
   * @param {string|string[]} matcher
   * @return {*}  {IgnoreRule}
   * @memberof IgnoreRule
   */
  static exact(matcher: string | string[]): IgnoreRule {
    return new IgnoreRule(matcher, false)
  }

  /**
   * Create a new IgnoreRule using a case-insensitive string match
   *
   * @static
   * @param {string|string[]} matcher
   * @return {*}  {IgnoreRule}
   * @memberof IgnoreRule
   */
  static insensitive(matcher: string | string[]): IgnoreRule {
    return new IgnoreRule(matcher, true)
  }
}

/**
 * Options for the NameCaseConverter instance
 *
 * @export
 * @interface NameCaseConverterOptions
 */
export interface NameCaseConverterOptions {
  ignores?: IgnoreRule[]
  converters?: CustomConverter[]
}

/**
 * Built-in converters
 */
const defaultConverters = [
  // Hyphenated words
  new CustomConverter(/-/, (chunk, _, __, options) => chunk.split('-').map(p => p.trim())
    .map(part => new NameCaseConverter(part, options).toString()).join('-')),
  // Words starting with Mc or Mac
  new CustomConverter(/^ma?c[A-Za-z]+$/i, chunk =>
    chunk.replace(/^(ma?c)([A-Za-z]+)$/i, '$1 $2').split(' ').map(p => NameCaseConverter.toTitleCase(p)).join('')),
  // Words starting with L, O or D plus apostrophe
  new CustomConverter(/^[ldo]\'/i, (chunk, index) => {
    const suffix = NameCaseConverter.toTitleCase(chunk.substring(2, chunk.length))
    return index
      ? chunk.charAt(0) + '\'' + suffix
      : chunk.charAt(0).toUpperCase() + '\'' + suffix
  })
]

/**
 * The base NameCaseConverter class
 *
 * @export
 * @class NameCaseConverter
 */
export class NameCaseConverter {

  private input: string = ''

  /**
   * Creates an instance of NameCaseConverter.
   * @param {string} input the input value to convert
   * @param {NameCaseConverterOptions} [options] an optional object of options to apply
   * @memberof NameCaseConverter
   */
  constructor(
    input: string,
    readonly options?: NameCaseConverterOptions) {
    this.input = input.trim()
  }

  /**
   * Processes each space-separated part of the input
   * into proper name-case
   *
   * @return {*}  {string}
   * @memberof NameCaseConverter
   */
  toString(): string {
    const words = this.input.split(/\s+/)
    const accumulated: string[] = []
    for (const word of words) {
      const current = this.parseWord(word, accumulated)
      accumulated.push(current)
    }
    return accumulated.join(' ')
  }
  /**
   * Converts a string to Title Case
   *
   * @static
   * @param {string} word the input string
   * @param {number} chunkIndex the index of the current chunk being processed
   * @return {*}  {string}
   * @memberof NameCaseConverter
   */
  private parseWord(word: string, accumulated: string[]): string {
    // Match any ignore rules provided in the options
    if (this.options?.ignores?.length) {
      for (const rule of this.options.ignores) {
        if (typeof rule.matcher == 'string' && this.matches(word, rule.matcher, rule.caseInsensitive)) {
          return word
        } else if (rule.matcher instanceof RegExp) {
          if (rule.matcher.test(word))
            return word
        } else if (Array.isArray(rule.matcher)) {
          if (rule.matcher.find(s => this.matches(word, s, rule.caseInsensitive)))
            return word
        }
      }
    }

    // Merge provided custom converters with default converters
    const converters = [...(this.options?.converters ?? []), ...defaultConverters]

    // Run through converters
    for (const converter of converters) {
      if (converter.regex.test(word)) {
        return converter.operator(word, accumulated.length, accumulated, this.options)
      }
    }

    // Simply return a title cased string in any other case
    return NameCaseConverter.toTitleCase(word)
  }

  /**
   * Converts a string to Title Case without applying
   * name-case rules
   *
   * @static
   * @param {string} input the input string
   * @return {*}  {string}
   * @memberof NameCaseConverter
   */
  static toTitleCase(input: string): string {
    if (/\s+/.test(input)) {
      return new NameCaseConverter(input, {
        converters: [
          new CustomConverter(/^(a|an|the|to|in|on|of|from|and|with)$/i, (chunk, index) => {
            return index ? chunk.toLowerCase() : NameCaseConverter.toTitleCase(chunk)
          })
        ]
      }).toString()
    }
    return input.charAt(0).toUpperCase() + input.substring(1, input.length).toLowerCase()
  }

  /**
   * Test if a word matches a subject based on case sensitivity
   *
   * @private
   * @param {string} v1 the first value
   * @param {string} v2 the second value
   * @param {boolean} ci whether to match as case-insensitive
   * @return {*}  {boolean}
   * @memberof NameCaseConverter
   */
  private matches(v1: string, v2: string, ci: boolean): boolean {
    return ci
      ? v1.toLowerCase() == v2.toLowerCase()
      : v1 == v2
  }
}

/**
 * Converts an input string to the proper name-cased value
 *
 * @export
 * @param {string} input the input value to convert
 * @param {NameCaseConverterOptions} [options] an optional object of options to apply
 * @return {*}  {string}
 */
export function toNameCase(input: string, options?: NameCaseConverterOptions): string {
  const converter = new NameCaseConverter(input, options)
  return converter.toString()
}

/**
 * Converts a string to Title Case
 *
 * @export
 * @param {string} input the input string
 * @return {*}  {string}
 */
export function toTitleCase(input: string): string {
  return NameCaseConverter.toTitleCase(input)
}

/**
 * Creates an instance of IgnoreRule.
 *
 * @export
 * @param {(string | string[] | RegExp)} matcher string, string array or regex matcher
 * @param {boolean} [caseInsensitive=false] whether a string matcher is case-insensitive
 * @return {*}  {IgnoreRule}
 */
export function createIgnoreRule(matcher: string | string[] | RegExp, caseInsensitive = false): IgnoreRule {
  return new IgnoreRule(matcher, caseInsensitive)
}

/**
 * Creates an instance of CustomConverter.
 *
 * @export
 * @param {RegExp} regex the regex that will be matched against input strings
 * @param {(value: string, chunkIndex: number) => string} callback a function that returns the desired output
 * @return {*}  {CustomConverter}
 */
export function createConverter(regex: RegExp, callback: (value: string, chunkIndex: number) => string): CustomConverter {
  return new CustomConverter(regex, callback)
}
