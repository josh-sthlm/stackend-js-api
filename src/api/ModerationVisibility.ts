/**
 * Moderation visibility indicator, used to filter content depending on
 * moderation status. Managers that accept this visibility filter must maintain
 * sensible defaults (i.e {@link #VISIBLE}) for safety reasons.
 */
export enum ModerationVisibility {
  /**
   * All will return all items disregarding any moderation status, useful for
   * administration purposes.
   */
  ALL = 'ALL',

  /**
   * Visible is the normal behavior, which filters out all disapproved items
   * but includes items that are post moderated and not expired.
   */
  VISIBLE = 'VISIBLE',

  /**
   * The same behavior as {@link #VISIBLE} but for modules that support user
   * approval like  CommentManager, the objects awaiting approval are
   * also included. For modules that do not support this, treat like
   * {@link #VISIBLE}.
   */
  VISIBLE_INCLUDING_AWAITING_USER_APPROVAL = 'VISIBLE_INCLUDING_AWAITING_USER_APPROVAL',

  /**
   * The same behavior as {@link #VISIBLE} but for modules that support user
   * approval like CommentManager, the objects awaiting approval,
   * approved and disapproved are also included. For modules that do not
   * support this, treat like {@link #VISIBLE}.
   */
  VISIBLE_INCLUDING_USER_APPROVAL = 'VISIBLE_INCLUDING_USER_APPROVAL',

  /**
   * Only approved will approve content that has been actively approved or
   * items that has never been considered for moderation (no moderation). Post
   * moderated items that have not yet been approved will be left out. Useful
   * for extra sensitive listings (a front page listing for example).
   */
  APPROVED = 'APPROVED',

  /**
   * Only disapproved means that only content that has been disapproved will
   * be included.
   */
  DISAPPROVED = 'DISAPPROVED',

  /**
   * All objects that are pending pre moderation or expired post moderation - i.e. items that are not included in {@link #VISIBLE}.
   */
  MODERATION_REQUIRED = 'MODERATION_REQUIRED',

  /**
   * All objects pending moderation, all pre moderated and post moderated items regardless of expiration.
   */
  MODERATION_PENDING = 'MODERATION_PENDING'
}

export default ModerationVisibility;
