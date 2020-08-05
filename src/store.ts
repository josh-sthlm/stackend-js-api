// @flow
import type { Store as ReduxStore, Dispatch as ReduxDispatch, Action } from 'redux';

export type State = Map<any, any>;

export type Store = ReduxStore<State, Action>;

export type GetState = () => State;

export type Thunk<A> = ((Dispatch, GetState) => Promise<void> | void) => A;
