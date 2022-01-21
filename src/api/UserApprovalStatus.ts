export enum UserApprovalStatus {
  /**
   * The object has been approved by the user
   */
  USER_APPROVED = 'USER_APPROVED',

  /**
   * The object is waiting user approval
   */
  AWAITING_USER_APPROVAL = 'AWAITING_USER_APPROVAL',

  /**
   * The object has been disapproved by the user
   */
  USER_DISAPPROVED = 'USER_DISAPPROVED'
}

export default UserApprovalStatus;
