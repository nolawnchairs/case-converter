
export type ConverterOperator = (chunk: string, index: number, accumulated: string[], options: NameCaseConverterOptions) => string

export class Converter {
  /**
   * Creates an instance of Converter. Provide a regex matcher and
   * an operator function. The operator function supplies a string that was matched to the provided regex
   * and returns the final value to apply to the output
   *
   * @param {RegExp} regex the regex that will be matched against input strings
   * @param {ConverterOperator} operator a function that returns the desired output
   * @memberof Converter
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
  converters?: Converter[]
  disableDefault?: ConverterId[] | boolean
}
/**
 * Enumeration of build-in converters
 *
 * @export
 * @enum {number}
 */
export enum ConverterId {
  HYPENATED,
  MC,
  MAC,
  DLO_APOSTRAPHE,
  ROMAN_NUMERALS,
}

/**
 * Build in converter mappings
 */
const defaultConverters: Record<ConverterId, Converter> = {
  [ConverterId.HYPENATED]: new Converter(/-/, (chunk, _, __, options) => chunk.split('-').map(p => p.trim())
    .map(part => new NameCaseConverter(part, options).toString()).join('-')),
  [ConverterId.MC]: new Converter(/^mc[A-Za-z]+$/i, chunk =>
    chunk.replace(/^(mc)([A-Za-z]+)$/i, '$1 $2').split(' ').map(p => toTitleCase(p)).join('')),
  [ConverterId.MAC]: new Converter(/^mac[A-Za-z]+$/i, chunk =>
    chunk.replace(/^(mac)([A-Za-z]+)$/i, '$1 $2').split(' ').map(p => toTitleCase(p)).join('')),
  [ConverterId.DLO_APOSTRAPHE]: new Converter(/^[ldo]\'/i, (chunk, index) => {
    const suffix = toTitleCase(chunk.substring(2, chunk.length))
    return index
      ? chunk.charAt(0) + '\'' + suffix
      : chunk.charAt(0).toUpperCase() + '\'' + suffix
  }),
  [ConverterId.ROMAN_NUMERALS]: new Converter(/^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/i,
    chunk => chunk.toUpperCase())
}

/**
 * The base NameCaseConverter class
 *
 * @export
 * @class NameCaseConverter
 */
export class NameCaseConverter {

  private readonly input: string = ''
  private readonly enabledConverters: Converter[]
  private readonly options: NameCaseConverterOptions

  private static globalOptions: NameCaseConverterOptions = {}

  /**
   * Creates an instance of NameCaseConverter.
   * @param {string} input the input value to convert
   * @param {NameCaseConverterOptions} [options] an optional object of options to apply
   * @memberof NameCaseConverter
   */
  constructor(input: string, options?: NameCaseConverterOptions) {

    const { converters = [], ignores = [], disableDefault } = options ?? {}
    const { converters: globalConverters = [], ignores: globalIgnores = [] } = NameCaseConverter.globalOptions

    this.input = input.trim()
    this.options = {
      ignores: [...ignores, ...globalIgnores],
      converters: [...converters, ...globalConverters],
      disableDefault,
    }

    this.enabledConverters = [...this.options.converters ?? [], ...Object.entries(defaultConverters)
      .filter(([id]) => {
        if (options?.disableDefault) {
          if (typeof options.disableDefault === 'boolean')
            return false
          return options.disableDefault.findIndex(i => i == Number(id)) < 0
        }
        return true
      })
      .map(([_, converter]) => converter)]
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
    for (const rule of this.options.ignores ?? []) {
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

    // Run through converters
    for (const converter of this.enabledConverters) {
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
          new Converter(/^(a|an|the|to|in|on|of|from|and|with)$/i, (chunk, index) => {
            return index ? chunk.toLowerCase() : NameCaseConverter.toTitleCase(chunk)
          })
        ]
      }).toString()
    }
    return input.charAt(0).toUpperCase() + input.substring(1, input.length).toLowerCase()
  }

  /**
   * Set options globally
   *
   * @static
   * @param {NameCaseConverterOptions} options
   * @memberof NameCaseConverter
   */
  static setGlobalOptions(options: NameCaseConverterOptions) {
    NameCaseConverter.globalOptions = options
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
 * Creates an instance of Converter.
 *
 * @export
 * @param {RegExp} regex the regex that will be matched against input strings
 * @param {(value: string, chunkIndex: number) => string} callback a function that returns the desired output
 * @return {*}  {Converter}
 */
export function createConverter(regex: RegExp, callback: (value: string, chunkIndex: number) => string): Converter {
  return new Converter(regex, callback)
}
