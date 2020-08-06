// @flow
import type { Store as ReduxStore, Action, Dispatch} from 'redux';

export type State = { [key:any]: any };

export type Store = ReduxStore<State, Action>;

export type GetState = () => State;

export type Thunk<A> = ((dispatch: Dispatch, getState: GetState) => Promise<void> | void) => A;
