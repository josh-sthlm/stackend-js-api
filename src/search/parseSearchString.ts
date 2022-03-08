/**
 * Split a search expression into parts, remove all characters that are not letters or digits.
 *
 * For example: "Wow! <Räksmörgås>" returns ["wow", "räksmörgås"]
 * @param text
 * @returns {null|[]}
 */
export function parseSearchString(text: string): Array<string> | null {
  if (!text) {
    return null;
  }

  text = text.toLowerCase();
  text = text.replace(NOT_LETTER_DIGIT_RE, ' ');
  const parts = text.split(/\s+/);
  const v = [];
  for (let i = 0; i < parts.length; i++) {
    const x = parts[i];
    v.push(x.trim());
  }

  return v.length === 0 ? null : v;
}

const NOT_LETTER_DIGIT_RE = /[^\p{L}\d]/gu;
