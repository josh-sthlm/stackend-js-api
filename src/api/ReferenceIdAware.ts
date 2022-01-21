import XcapObject from './XcapObject';

export interface ReferenceIdAware<T extends XcapObject> {
  /**
   * Id of a another referenced object.
   * For example the blog entry id for a comment
   */
  referenceId: number;

  /**
   * A referenced object
   * For example the blog entry for a comment.
   */
  referenceRef?: T | null;
}

export default ReferenceIdAware;
