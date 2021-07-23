
export declare class CustomConverter {
  /**
   * Creates an instance of CustomConverter. Provide a regex matcher and
   * an operator function. The operator function supplies a string that was matched to the provided regex
   * and returns the final value to apply to the output
   */
  constructor(regex: RegExp, operator: (value: string, chunkIndex: number) => string);
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
 * Options for the NameCaseConverter instance
 */
export declare interface NameCaseConverterOptions {
  /**
   * An array of rules that dictate what strings to ignore,
   * and simply return unaltered
   */
  ignores?: IgnoreRule[]
  /**
   * An array of custom converters to apply
   */
  converters?: CustomConverter[]
}

/**
 * The base NameCaseConverter class
 */
export declare class NameCaseConverter {
  /**
   * Creates an instance of NameCaseConverter.
   */
  constructor(input: string, options?: NameCaseConverterOptions);
  /**
   * Processes each space-separated part of the input
   * into proper name-case
   */
  toString(): string
  /**
   * Converts a string to Title Case
   */
  static toTitleCase(word: string): string
}


/**
 * Converts an input string to the proper name-cased value
 */
export declare function toNameCase(input: string, options?: NameCaseConverterOptions): string;
/**
 * Converts a string to Title Case
 */
export declare function toTitleCase(input: string): string;
/**
 * reates an instance of IgnoreRule.
 */
export declare function createIgnoreRule(matcher: string, caseInsensitive?: boolean): IgnoreRule;
/**
 * reates an instance of IgnoreRule.
 */
export declare function createIgnoreRule(matcher: string[], caseInsensitive: boolean): IgnoreRule;
/**
 * reates an instance of IgnoreRule.
 */
export declare function createIgnoreRule(matcher: RegExp): IgnoreRule;
/**
 * Creates an instance of CustomConverter.
 */
export declare function createConverter(regex: RegExp, callback: (value: string, chunkIndex: number) => string): CustomConverter;

