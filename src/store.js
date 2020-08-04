// @flow
import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux';

export type State = $ObjMap<any, any>;
export type Action = any;
export type ActionType = any;

export type Store = ReduxStore<State, Action>;

export type GetState = () => State;

export type Dispatch = ReduxDispatch<Action> & Thunk<Action>;

export type Thunk<A> = ((Dispatch, GetState) => Promise<void> | void) => A;
