//@flow

import { createStore, compose, applyMiddleware, combineReducers, Store } from 'redux';
import thunk from 'redux-thunk';
import { STANDARD_REDUCERS } from '../src/reducers';

const appReducer = combineReducers(STANDARD_REDUCERS);
export type AppState = ReturnType<typeof appReducer>;


export default function createTestStore(): Store<AppState> {
  return createStore(
    appReducer,
    { },
    compose(
      applyMiddleware(thunk)
    )
  );
}


