

export declare type ConverterOperator = (chunk: string, index: number, accumulated: string[], options: CaseConverterOptions) => string

export declare class Converter {
  /**
   * Creates an instance of Converter. Provide a regex matcher and
   * an operator function. The operator function supplies a string that was matched to the provided regex
   * and returns the final value to apply to the output
   */
  constructor(regex: RegExp, operator: ConverterOperator);
}

export declare class IgnoreRule {
  /**
   * Create a new IgnoreRule using regex
   */
  static regex(matcher: RegExp): IgnoreRule;
  /**
   * Create a new IgnoreRule using a case-sensitive string match
   * @memberof IgnoreRule
   */
  static exact(matcher: string): IgnoreRule;
  /**
   * Create a new IgnoreRule using a case-sensitive string match
   */
  static exact(matchers: string[]): IgnoreRule;
  /**
   * Create a new IgnoreRule using a case-insensitive string match
  static insensitive(matcher: string): IgnoreRule;
  /**
   * Create a new IgnoreRule using a case-insensitive string match
   */
  static insensitive(matchers: string[]): IgnoreRule;
}

/**
 * Options for the CaseConverter instance
 */
export declare interface CaseConverterOptions {
  /**
   * An array of rules that dictate what strings to ignore,
   * and simply return unaltered
   */
  ignores?: IgnoreRule[]
  /**
   * An array of custom converters to apply
   */
  converters?: Converter[]
  /**
   * An array of ConverterId enum values corresponding to any
   * default converters to disable, or TRUE to disable all default
   * converters
   */
  disableDefault?: ConverterId[] | boolean
}

/**
 * Enumeration of the built-in converters
 */
export enum ConverterId {
  HYPENATED,
  MC,
  MAC,
  DLO_APOSTRAPHE,
  ROMAN_NUMERALS,
}

/**
 * The base CaseConverter class
 */
export declare class CaseConverter {
  /**
   * Creates an instance of CaseConverter.
   */
  constructor();
  constructor(options: CaseConverterOptions);
  /**
   * Processes each space-separated part of the input
   * into proper name-case
   */
  convert(input: string): string
  /**
   * Converts a string to Title Case
   */
  static toTitleCase(word: string): string
  /**
   * Set configuration options globally
   */
  static setGlobalOptions(options: CaseConverterOptions): void
}


/**
 * Converts an input string to the proper name-cased value
 */
export declare function toNameCase(input: string): string;
/**
 * Converts an input string to the proper name-cased value
 */
export declare function toNameCase(input: string, options: CaseConverterOptions): string;
/**
 * Converts a string to Title Case
 */
export declare function toTitleCase(input: string): string;
/**
 * Creates an instance of IgnoreRule.
 */
export declare function createIgnoreRule(matcher: string, caseInsensitive?: boolean): IgnoreRule;
/**
 * Creates an instance of IgnoreRule.
 */
export declare function createIgnoreRule(matcher: string[], caseInsensitive?: boolean): IgnoreRule;
/**
 * Creates an instance of IgnoreRule.
 */
export declare function createIgnoreRule(matcher: RegExp): IgnoreRule;
/**
 * Creates an instance of Converter.
 */
export declare function createConverter(regex: RegExp, callback: (value: string, chunkIndex: number) => string): Converter;

