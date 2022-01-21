import { User } from '../user';

export interface ModifiedByUserIdAware {
  /**
   * Id of the user that last modified the object. 0 if not modified
   */
  modifiedByUserId: number;

  /**
   * User that last modified the object.
   */
  modifiedByUserRef?: User | null;
}

export default ModifiedByUserIdAware;
