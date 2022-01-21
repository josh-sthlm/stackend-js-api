/**
 * UID of a specific type of object in a context
 */
import CommunityContext, { parseCommunityContext } from './CommunityContext';
import XcapObject from './XcapObject';

export interface Reference {
  communityContext: CommunityContext;
  type: string;
  id: number;
}

export default Reference;

/**
 * Parse a reference
 * @param reference
 * @returns {null|Reference}
 */
export function parseReference(reference: string | null): Reference | null {
  if (!reference) {
    return null;
  }

  const p = reference.split('-', 4);
  if (p.length !== 3) {
    return null;
  }

  const id = parseInt(p[2]);
  if (isNaN(id)) {
    return null;
  }

  const cc = parseCommunityContext(p[0]);
  if (!cc) {
    return null;
  }

  return {
    communityContext: cc,
    type: p[1],
    id
  };
}

/**
 * Construct a reference
 * @param xcapCommunityName
 * @param context
 * @param type
 * @param id
 */
export function constructReference(xcapCommunityName: string, context: string, type: string, id: number): Reference {
  const c = xcapCommunityName + ':' + context;
  const cc = parseCommunityContext(c);
  if (!cc) {
    throw Error('Invalid communityContext: ' + c);
  }

  return {
    communityContext: cc,
    type,
    id
  };
}

/**
 * Get a reference
 * @param xcapCommunityName
 * @param context
 * @param obj
 * @returns {Reference}
 */
export function getReference(xcapCommunityName: string, context: string, obj: XcapObject): Reference {
  return constructReference(xcapCommunityName, context, obj.__type, obj.id);
}

/**
 * Get a reference as a string
 * @param ref
 * @returns {string|null}
 */
export function getReferenceAsString(ref: Reference | null): string | null {
  if (!ref) {
    return null;
  }

  return ref.communityContext.community + ':' + ref.communityContext.context + '-' + ref.type + '-' + ref.id;
}
