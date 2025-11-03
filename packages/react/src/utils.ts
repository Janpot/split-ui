/**
 * Efficiently concatenates nullable strings together with a separator.
 * Filters out falsy values (null, undefined, false, empty string).
 * 
 * @param separator - The separator to use between strings (default: space)
 * @param values - The values to concatenate
 * @returns Concatenated string with separator
 * 
 * @example
 * joinStrings(' ', 'foo', null, 'bar', false, 'baz') // 'foo bar baz'
 * joinStrings(' ', 'a', 'b') // 'a b'
 * joinStrings(' ', null, false, '') // ''
 */
export function joinStrings(
  separator: string,
  ...values: (string | boolean | null | undefined)[]
): string {
  let result = '';
  
  for (const value of values) {
    if (value && typeof value === 'string') {
      result = result ? `${result}${separator}${value}` : value;
    }
  }
  
  return result;
}
