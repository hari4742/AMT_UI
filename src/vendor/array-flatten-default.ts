// Shim providing a default export compatible with "array-flatten"
// @tonejs/midi expects a default export. Some ESM builds of array-flatten
// expose only named exports, so we provide a compatible implementation.

export default function flatten(input: any[]): any[] {
  const result: any[] = [];

  for (const item of input) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else {
      result.push(item);
    }
  }

  return result;
}
