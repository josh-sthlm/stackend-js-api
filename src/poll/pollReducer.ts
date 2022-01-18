import { Poll } from './index';

export const UPDATE_POLL = 'UPDATE_POLL';
export const CLEAR_POLL = 'CLEAR_POLL';
export const CLEAR_POLLS = 'CLEAR_POLLS';

export type PollContextState = {
  [referenceId: number]: Poll;
};

export type PollsState = {
  [context: string]: PollContextState;
};

type PollActions =
  | {
      type: typeof UPDATE_POLL;
      context: string;
      poll: Poll;
    }
  | {
      type: typeof CLEAR_POLL;
      context: string;
      referenceId: number;
    }
  | {
      type: typeof CLEAR_POLLS;
      context: string;
    };

export function polls(state: PollsState = {}, action: PollActions): PollsState {
  let cs = state[action.context];
  switch (action.type) {
    case UPDATE_POLL:
      if (!cs) {
        cs = {};
      }
      return {
        ...state,
        [action.context]: Object.assign({}, cs, {
          [action.poll.referenceId]: action.poll
        })
      };

    case CLEAR_POLL:
      if (cs) {
        delete cs[action.referenceId];
        return {
          ...state,
          [action.context]: Object.assign({}, cs)
        };
      }
      return state;

    case CLEAR_POLLS:
      if (cs) {
        delete state[action.context];
        return { ...state };
      }
      return state;

    default:
      return state;
  }
}

export default polls;
