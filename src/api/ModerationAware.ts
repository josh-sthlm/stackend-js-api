import ModerationStatusAware from './ModerationStatusAware';

export interface ModerationAware extends ModerationStatusAware {
  /**
   * Moderation Time To Live in minutes for post moderated objects.
   * @see ModerationStatus.POST
   */
  ttl: number;
}

export default ModerationAware;
