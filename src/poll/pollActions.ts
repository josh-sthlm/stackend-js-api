import { Poll, vote, VoteResult, getPoll, GetPollResult } from './index';
import { Thunk } from '../api';
import { UPDATE_POLL, PollsState, CLEAR_POLL, CLEAR_POLLS, UPDATE_POLLS } from './pollReducer';

export const DEFAULT_POLL_CONTEXT = 'newspoll';

/**
 * Cast a poll vote
 * @param referenceId
 * @param answerId
 * @param context (optional. for future use)
 */
export function castPollVote({
  referenceId,
  answerId,
  context = DEFAULT_POLL_CONTEXT
}: {
  referenceId: number;
  answerId: number;
  context: string;
}): Thunk<Promise<VoteResult>> {
  return async function (dispatch: any): Promise<VoteResult> {
    const r = await dispatch(vote({ referenceId, answerId }));
    if (!r.error) {
      dispatch(updatePoll(r.poll));
    }
    return r;
  };
}

/**
 * Fetch a poll and add it to the store
 * @param referenceId
 * @param context (optional. for future use)
 */
export function fetchPoll({
  referenceId,
  context = DEFAULT_POLL_CONTEXT
}: {
  referenceId: number;
  context: string;
}): Thunk<Promise<GetPollResult>> {
  {
    return async function (dispatch: any): Promise<GetPollResult> {
      const r = dispatch(getPoll({ referenceId }));
      if (!r.error) {
        dispatch(updatePoll(r.poll));
      }
      return r;
    };
  }
}

/**
 * Add a poll to the state
 * @param poll
 * @param context  (optional. for future use)
 */
export function updatePoll(poll: Poll | null | undefined, context: string = DEFAULT_POLL_CONTEXT): Thunk<void> {
  return function (dispatch: any): void {
    if (poll) {
      dispatch({
        type: UPDATE_POLL,
        poll,
        context
      });
    }
  };
}

/**
 * Add multiple polls to the state
 * @param polls
 * @param context
 */
export function updatePolls(
  polls: Array<Poll> | null | undefined,
  context: string = DEFAULT_POLL_CONTEXT
): Thunk<void> {
  return function (dispatch: any): void {
    if (polls && polls.length != 0) {
      dispatch({
        type: UPDATE_POLLS,
        polls,
        context
      });
    }
  };
}

/**
 * Get a poll from the store
 * @param state
 * @param referenceId
 * @param context
 */
export function getPollFromStore(
  state: PollsState,
  referenceId: number,
  context: string = DEFAULT_POLL_CONTEXT
): Poll | null {
  const cs = state[context];
  if (!cs) {
    return null;
  }
  const p = cs[referenceId];
  return p ? p : null;
}

/**
 * Clear a poll from the store
 * @param referenceId
 * @param context
 */
export function clearPoll(referenceId: number, context: string = DEFAULT_POLL_CONTEXT) {
  return function (dispatch: any): void {
    dispatch({
      type: CLEAR_POLL,
      referenceId,
      context
    });
  };
}

/**
 * Clear all polls from the store
 * @param context
 */
export function clearPolls(context: string = DEFAULT_POLL_CONTEXT) {
  return function (dispatch: any): void {
    dispatch({
      type: CLEAR_POLLS,
      context
    });
  };
}
