
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
    readonly operator: (value: string, chunkIndex: number) => string);
}

export class IgnoreRule {
  /**
   * Create a new IgnoreRule using regex
   *
   * @static
   * @param {RegExp} matcher
   * @return {*}  {IgnoreRule}
   * @memberof IgnoreRule
   */
  static regex(matcher: RegExp): IgnoreRule;
  /**
   * Create a new IgnoreRule using a case-sensitive string match
   *
   * @static
   * @param {string} matcher a single string to match against
   * @return {*}  {IgnoreRule}
   * @memberof IgnoreRule
   */
  static exact(matcher: string): IgnoreRule;
  /**
   * Create a new IgnoreRule using a case-sensitive string match
   *
   * @static
   * @param {string[]} matchers an array of strings to match against
   * @return {*}  {IgnoreRule}
   * @memberof IgnoreRule
   */
  static exact(matchers: string[]): IgnoreRule;
  /**
   * Create a new IgnoreRule using a case-insensitive string match
   *
   * @static
   * @param {string} matcher a single string to match against
   * @return {*}  {IgnoreRule}
   * @memberof IgnoreRule
   */
  static insensitive(matcher: string): IgnoreRule;
  /**
   * Create a new IgnoreRule using a case-insensitive string match
   *
   * @static
   * @param {string[]} matchers an array of strings to match against
   * @return {*}  {IgnoreRule}
   * @memberof IgnoreRule
   */
  static insensitive(matchers: string[]): IgnoreRule;
}

/**
 * Options for the NameCaseConverter instance
 *
 * @export
 * @interface NameCaseConverterOptions
 */
export interface NameCaseConverterOptions {
  /**
   * An array of rules that dictate what strings to ignore,
   * and simply return unaltered
   *
   * @type {IgnoreRule[]}
   * @memberof NameCaseConverterOptions
   */
  ignores?: IgnoreRule[]
  /**
   * An array of custom converters to apply
   *
   * @type {CustomConverter[]}
   * @memberof NameCaseConverterOptions
   */
  converters?: CustomConverter[]
}

/**
 * The base NameCaseConverter class
 *
 * @export
 * @class NameCaseConverter
 */
export class NameCaseConverter {
  /**
   * Creates an instance of NameCaseConverter.
   * @param {string} input the input (unsanitized) value to convert
   * @param {NameCaseConverterOptions} [options] an optional object of options to apply
   * @memberof NameCaseConverter
   */
  constructor(
    readonly input: string,
    readonly options?: NameCaseConverterOptions);
  /**
   * Processes each space-separated part of the input
   * into proper name-case
   *
   * @return {*}  {string}
   * @memberof NameCaseConverter
   */
  toString(): string
  /**
   * Converts a string to Title Case
   *
   * @static
   * @param {string} word the input string
   * @return {*}  {string}
   * @memberof NameCaseConverter
   */
  static toTitleCase(word: string): string
}

declare module "functional" {
  /**
   * Converts an input string to the proper name-cased value
   *
   * @export
   * @param {string} input the input (unsanitized) value to convert
   * @param {NameCaseConverterOptions} [options] an optional object of options to apply
   * @return {*}  {string}
   */
  export function toNameCase(input: string, options?: NameCaseConverterOptions): string;

  /**
   * Converts a string to Title Case
   *
   * @export
   * @param {string} input the input string
   * @return {*}  {string}
   */
  export function toTitleCase(input: string): string;
}