export const TEMPLATE_START = '{{';
export const TEMPLATE_END = '}}';

/**
 * Replace occurrences of {{XXX}} with the values of XXX from the values.
 * For example templateReplace("Hello {{name}}!", { name: 'Jane' }) would return "Hello Jane!"
 * @param template
 * @param values
 * @param valueEncoder
 * @returns {string}
 */
export function templateReplace(
  template: string,
  values: { [name: string]: string },
  valueEncoder?: (v: string) => string | null
): string {
  if (!template) {
    return template;
  }

  let sb = '';

  // Special cases
  // "Hello {currentUser.name}, how are you?"
  // "Hello { code"
  let s = 0;
  do {
    const i = template.indexOf(TEMPLATE_START, s);
    if (i === -1) {
      // No more stuff, add the remainder
      sb += template.substring(s);
      break;
    }

    // Add everything before {
    sb += template.substring(s, i);

    const e: number = template.indexOf(TEMPLATE_END, i + TEMPLATE_START.length);
    if (e === -1) {
      // No more stuff, add the remainder
      sb += template.substring(i);
      break;
    }

    const n: string = template.substring(i + TEMPLATE_START.length, e);
    const v: string = values[n];
    if (v) {
      sb += valueEncoder ? valueEncoder(v) : v;
    }

    s = e + TEMPLATE_END.length;
  } while (s < template.length);

  return sb;
}

export function templateReplaceUrl(url: string | null, replacements: { [name: string]: string }): string | null {
  if (!url) {
    return url;
  }
  return encodeURI(templateReplace(url, replacements));
}
