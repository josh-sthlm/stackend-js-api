//@flow

import { createStore, compose, applyMiddleware, combineReducers, Reducer } from 'redux';
import thunk from 'redux-thunk';
import { STANDARD_REDUCERS } from '../src/api/reducers';

const appReducer = combineReducers(STANDARD_REDUCERS);
export type AppState = ReturnType<typeof appReducer>;

export default function createTestStore(): any {
  return createStore(appReducer, {}, compose(applyMiddleware(thunk)));
}

export function createCustomTestStore(reducers: { [name: string]: Reducer<any, any> }): any {
  return createStore(combineReducers(reducers), {}, compose(applyMiddleware(thunk)));
}
