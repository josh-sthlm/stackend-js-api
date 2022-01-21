import createReducer from '../api/createReducer';
import { TYPE_USER, User } from './index';
import { ReferenceHandler, registerReferenceHandler } from '../api/referenceActions';
import { usersReceived } from './userActions';

export interface UsersState {
  [id: number]: User;
}

const USERS_RECEIVED = 'USERS_RECEIVED';
const CLEAR_USERS = 'CLEAR_USERS';
const CLEAR_USER = 'CLEAR_USER';

export interface UsersReceivedAction {
  type: typeof USERS_RECEIVED;
  users: Array<User>;
}

export interface ClearUsersAction {
  type: typeof CLEAR_USERS;
}

export interface ClearUserAction {
  type: typeof CLEAR_USER;
  id: number;
}

export const users = createReducer(
  {},
  {
    USERS_RECEIVED: (state: UsersState, action: UsersReceivedAction): UsersState => {
      action.users.forEach(u => {
        state[u.id] = u;
      });

      return Object.assign({}, state);
    },

    CLEAR_USER: (state: UsersState, action: ClearUserAction): UsersState => {
      delete state[action.id];
      return Object.assign({}, state);
    },

    CLEAR_USERS: (_state: UsersState, _action: ClearUsersAction): UsersState => {
      return {};
    }
  }
);

export default users;

const USER_REFERENCE_HANDLER: ReferenceHandler<User> = {
  type: TYPE_USER,
  onReferenceReceived: (objects, dispatch) => {
    dispatch(usersReceived(objects));
  }
};

// If this reducer is used, register its reference handler
registerReferenceHandler(USER_REFERENCE_HANDLER);
