export interface PermalinkAware {
  /**
   * The objects permalink, an unique id used to construct urls.
   * The permalink consists of lower case letters, numbers and the character "-".
   * The permalink is typically automatically derived from the name/title of an object when the object is created.
   * It is never null for a saved object.
   */
  permalink: string;
}

export default PermalinkAware;
