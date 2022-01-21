import UserApprovalStatus from './UserApprovalStatus';

export interface UserApprovalAware {
  /**
   * In addition to moderation, the visibility of this object can be controlled by the user.
   */
  userApprovalStatus: UserApprovalStatus;
}

export default UserApprovalAware;
