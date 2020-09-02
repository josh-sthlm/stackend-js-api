//@flow

/**
 * Given a permalink, calculate the parent permalink
 * @param permalink
 */
export function getParentPermalink(permalink: string): string | null {
  if (!permalink) {
    return null;
  }

  if (permalink.endsWith('/')) {
    permalink = permalink.substr(0, permalink.length - 1);
  }

  const i = permalink.lastIndexOf('/');
  if (i === -1) {
    return null;
  }

  const p = permalink.substring(0, i);
  return p ? p : null;
}

/**
 * Split a permalink into it's parts
 * @param permalink
 * @returns {Array|Array<string>|null}
 */
export function splitPermalink(permalink: string | null): Array<string> | null {
  if (!permalink) {
    return null;
  }

  return permalink.split('/');
}

/**
 * Generate a permalink
 * @param permalink
 * @param typingMode Allow trailing dash
 */
export function generatePermalink(permalink: string, typingMode?: boolean): string | null {
  if (!permalink) {
    return null;
  }

  // FIXME: Improve this. Does not match backend with regards to national characters. Should probably use the api.
  let pl = permalink.toLowerCase();
  pl = pl.replace(/å/g, 'a');
  pl = pl.replace(/ä/g, 'a');
  pl = pl.replace(/ö/g, 'o');
  pl = pl.replace(/[ .:,;?!+_]/g, '-');
  pl = pl.replace(/[^a-z0-9\-/]/g, '');
  pl = pl.replace(/^-/, '');
  if (typeof typingMode === 'undefined' || !typingMode) {
    pl = pl.replace(/-$/, '');
  }
  return !pl ? null : pl;
}
