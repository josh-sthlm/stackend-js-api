import { AnchorType, getAnchorPart, parseAnchor } from '../request';

/**
 * Normalize tags (order)
 * @param tags
 */
export function normalizeTags(tags: string[] | undefined): string[] {
  return tags ? tags.sort() : [];
}

/**
 * Give a pathname (URL), find the tags if any, returns empty array if none is found
 * @param pathname
 */
export function getTagsFromPathname({ pathname }: { pathname: string }): string[] {
  const anchor = parseAnchor(pathname);
  const tagsAnchor = getAnchorPart(anchor, AnchorType.TAGS);

  return normalizeTags(tagsAnchor?.tags);
}
