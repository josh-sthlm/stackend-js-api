import { User } from '../user';

export interface CreatorUserIdAware {
  /**
   * Id of the user that created the object
   */
  creatorUserId: number;

  /**
   * User that created the object
   */
  creatorUserRef?: User | null;
}

export default CreatorUserIdAware;
