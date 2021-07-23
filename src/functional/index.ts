
import { NameCaseConverter, NameCaseConverterOptions, IgnoreRule, CustomConverter } from '..'

export { IgnoreRule, CustomConverter }

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
