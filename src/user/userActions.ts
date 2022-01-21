import { ClearUserAction, ClearUsersAction, UsersReceivedAction } from './usersReducer';
import { getUser, GetUserResult, User } from './index';
import { Thunk, XcapOptionalParameters } from '../api';

export function clearUsers(): ClearUsersAction {
  return {
    type: 'CLEAR_USERS'
  };
}

export function clearUser(id: number): ClearUserAction {
  return {
    type: 'CLEAR_USER',
    id
  };
}

export function usersReceived(users: Array<User>): UsersReceivedAction {
  return {
    type: 'USERS_RECEIVED',
    users
  };
}

/**
 * Fetch a user
 * @param params
 */
export function fetchUser(
  params: { id?: number; alias?: string } & XcapOptionalParameters
): Thunk<Promise<GetUserResult>> {
  return async (dispatch: any): Promise<GetUserResult> => {
    const r = await dispatch(getUser(params));
    if (!r.error && r.user) {
      dispatch(usersReceived([r.user]));
    }
    return r;
  };
}
