
export type ConverterOperator = (chunk: string, index: number, accumulated: string[], options: CaseConverterOptions) => string

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
 * Options for the CaseConverter instance
 *
 * @export
 * @interface CaseConverterOptions
 */
export interface CaseConverterOptions {
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
    .map(part => new CaseConverter(options).toNameCase(part)).join('-')),
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
 * The base CaseConverter class
 *
 * @export
 * @class CaseConverter
 */
export class CaseConverter {

  private readonly enabledConverters: Converter[]
  private readonly options: CaseConverterOptions

  private static globalOptions: CaseConverterOptions = {}

  /**
   * Creates an instance of CaseConverter.
   * @param {CaseConverterOptions} [options] an optional object of options to apply
   * @memberof CaseConverter
   */
  constructor(options?: CaseConverterOptions) {

    const { converters = [], ignores = [], disableDefault } = options ?? {}
    const { converters: globalConverters = [], ignores: globalIgnores = [] } = CaseConverter.globalOptions

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
   * @param {string} input the value to convert
   * @memberof CaseConverter
   */
  toNameCase(input: string): string {
    const words = input.trim().split(/\s+/)
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
   * @memberof CaseConverter
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
    return CaseConverter.toTitleCase(word)
  }

  /**
   * Converts a string to Title Case without applying
   * name-case rules
   *
   * @static
   * @param {string} input the input string
   * @return {*}  {string}
   * @memberof CaseConverter
   */
  static toTitleCase(input: string): string {
    if (/\s+/.test(input)) {
      return new CaseConverter({
        converters: [
          new Converter(/^(a|an|the|to|in|on|of|from|and|with)$/i, (chunk, index) => {
            return index ? chunk.toLowerCase() : CaseConverter.toTitleCase(chunk)
          })
        ]
      }).toNameCase(input)
    }
    return input.charAt(0).toUpperCase() + input.substring(1, input.length).toLowerCase()
  }

  /**
   * Set options globally
   *
   * @static
   * @param {CaseConverterOptions} options
   * @memberof CaseConverter
   */
  static setGlobalOptions(options: CaseConverterOptions) {
    CaseConverter.globalOptions = options
  }

  /**
   * Test if a word matches a subject based on case sensitivity
   *
   * @private
   * @param {string} v1 the first value
   * @param {string} v2 the second value
   * @param {boolean} ci whether to match as case-insensitive
   * @return {*}  {boolean}
   * @memberof CaseConverter
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
 * @param {CaseConverterOptions} [options] an optional object of options to apply
 * @return {*}  {string}
 */
export function toNameCase(input: string, options?: CaseConverterOptions): string {
  const converter = new CaseConverter(options)
  return converter.toNameCase(input)
}

/**
 * Converts a string to Title Case
 *
 * @export
 * @param {string} input the input string
 * @return {*}  {string}
 */
export function toTitleCase(input: string): string {
  return CaseConverter.toTitleCase(input)
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
