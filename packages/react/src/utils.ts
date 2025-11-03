/**
 * Efficiently concatenates nullable strings together for HTML attribute values.
 * Filters out falsy values (null, undefined, false, empty string) and joins with space.
 * 
 * @param values - The values to concatenate
 * @returns Space-separated string of values
 * 
 * @example
 * attributeListValues('foo', null, 'bar', false, 'baz') // 'foo bar baz'
 * attributeListValues('a', 'b') // 'a b'
 * attributeListValues(null, false, '') // ''
 */
export function attributeListValues(
  ...values: (string | boolean | null | undefined)[]
): string {
  let result = '';
  
  for (const value of values) {
    if (value && typeof value === 'string') {
      result = result ? `${result} ${value}` : value;
    }
  }
  
  return result;
}
