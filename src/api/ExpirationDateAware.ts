export interface ExpirationDateAware {
  /**
   * Expiration date for post moderated objects
   * @see ModerationAware
   * @see ModerationStatus.POST
   */
  expiresDate: number;
}

export default ExpirationDateAware;
