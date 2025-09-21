// Accept a variadic argument names that allows <string | false | null | undefined>
export function classNames(
  ...names: Array<string | false | null | undefined>
): string {
  return names.filter(Boolean).join(" ");
}
