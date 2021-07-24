
export class CustomConverter {
  /**
   * Creates an instance of CustomConverter. Provide a regex matcher and
   * an operator function. The operator function supplies a string that was matched to the provided regex
   * and returns the final value to apply to the output
   *
   * @param {RegExp} regex the regex that will be matched against input strings
   * @param {(value: string, chunkIndex: number) => string} operator a function that returns the desired output
   * @memberof CustomConverter
   */
  constructor(
    readonly regex: RegExp,
    readonly operator: (value: string, chunkIndex: number) => string) { }
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
 * The base NameCaseConverter class
 *
 * @export
 * @class NameCaseConverter
 */
export class NameCaseConverter {

  private input: string = ''

  /**
   * Creates an instance of NameCaseConverter.
   * @param {string} input the input (unsanitized) value to convert
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
    return this.input.split(/\s+/).map((word, i) => this.parseWord(word.trim(), i)).join(' ')
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
  private parseWord(word: string, chunkIndex: number): string {
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

    // Match any custom converters provided in the options
    if (this.options?.converters?.length) {
      for (const converter of this.options.converters) {
        if (converter.regex.test(word)) {
          return converter.operator(word, chunkIndex)
        }
      }
    }

    // Test for hyphenated names, but run each part through
    // another conversion layer
    if (word.includes('-')) {
      return word.split('-').map(p => p.trim())
        .map(part => new NameCaseConverter(part, this.options).toString()).join('-')
    }

    // Test for MacWhatever or McWhatever
    if (/^ma?c[A-Za-z]+$/i.test(word)) {
      return word.replace(/^(ma?c)([A-Za-z]+)$/i, '$1 $2').split(' ').map(p => NameCaseConverter.toTitleCase(p)).join('')
    }

    // Test for L'Whatever, O'Whatever or D'whatever
    if (/^[ldo]\'/i.test(word)) {
      const suffix = NameCaseConverter.toTitleCase(word.substring(2, word.length))
      return chunkIndex
        ? word.charAt(0) + '\'' + suffix
        : word.charAt(0).toUpperCase() + '\'' + suffix
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
          new CustomConverter(/^(a|an|the|to|in|on|of|from|and|with)$/i, (word, chunk) => {
            return chunk ? word.toLowerCase() : NameCaseConverter.toTitleCase(word)
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
 * @param {string} input the input (unsanitized) value to convert
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
 * reates an instance of IgnoreRule.
 *
 * @export
 * @param {(string | string[] | RegExp)} matcher string, string array or regex matcher
 * @param {boolean} [caseInsensitive=false] hether a string matcher is case-insensitive
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
