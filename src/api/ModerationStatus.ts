/**
 * Moderation statuses
 */
export enum ModerationStatus {
  /**
   * No moderation required 0
   */
  NONE = 'NONE',

  /**
   * Approved by a moderator 1
   */
  PASSED = 'PASSED',

  /**
   * Disapproved by a moderator 2
   */
  NOT_PASSED = 'NOT_PASSED',

  /**
   * Pre moderation required 4
   */
  PRE = 'PRE',

  /**
   * Post moderation required within the specified TTL 5
   */
  POST = 'POST'
}

export default ModerationStatus;

const ModerationStatusNames = {
  [ModerationStatus.NONE]: 'Visible, not moderated',
  [ModerationStatus.NOT_PASSED]: 'Disapproved',
  [ModerationStatus.PASSED]: 'Approved',
  [ModerationStatus.POST]: 'Post moderation',
  [ModerationStatus.PRE]: 'Hidden, requires moderation'
};

export type ModerationStatusCodes = 0 | 1 | 2 | 4 | 5;

/**
 * Given a moderation status id, return the corresponding ModerationStatus
 * @param n
 */
export function getModerationStatus(n: ModerationStatusCodes): ModerationStatus {
  switch (n) {
    case 0:
      return ModerationStatus.NONE;
    case 1:
      return ModerationStatus.PASSED;
    case 2:
      return ModerationStatus.NOT_PASSED;
    case 4:
      return ModerationStatus.PRE;
    case 5:
      return ModerationStatus.POST;
    default:
      throw Error(n + ' is not a moderation status');
  }
}

/**
 * Get a human readable version of the moderation status
 * @param m
 */
export function getModerationStatusName(m: ModerationStatus): string {
  const x = ModerationStatusNames[m];
  if (x) {
    return x;
  }
  return ModerationStatusNames[ModerationStatus.NONE];
}

/**
 * Maps from ModerationStatus to code
 */
export const ModerationStatusCode = {
  [ModerationStatus.NONE]: 0,
  [ModerationStatus.PASSED]: 1,
  [ModerationStatus.NOT_PASSED]: 2,
  [ModerationStatus.PRE]: 4,
  [ModerationStatus.POST]: 5
};
