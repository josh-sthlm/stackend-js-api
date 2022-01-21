/**
 * A community context represents a instance of some functionality,
 * for example comments, blog etc. Some functions may multiple instances,
 * like for example stand alone comments or comments on blog posts.
 */
export interface CommunityContext {
  /**
   * Community permalink, for example "xcap_c123"
   */
  community: string;

  /**
   * Context of the component, for example "comments"
   */
  context: string;
}

export default CommunityContext;

/**
 * Parse a community context.
 * @param communityContext
 * @returns {null|CommunityContext}
 */
export function parseCommunityContext(communityContext: string | null): CommunityContext | null {
  if (!communityContext) {
    return null;
  }

  const p = communityContext.split(':', 3);
  if (p.length !== 2) {
    return null;
  }

  return {
    community: p[0],
    context: p[1]
  };
}

/**
 * Get the string representation of a community context
 * @param communityContext
 */
export function communityContexToString(communityContext: CommunityContext | null): string | null {
  if (communityContext) {
    return communityContext.community + ':' + communityContext.context;
  }
  return null;
}
