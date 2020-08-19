//@flow

import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { STANDARD_REDUCERS } from '../reducers';


const appReducer = combineReducers(STANDARD_REDUCERS);
export type AppState = ReturnType<typeof appReducer>;


export default function createTestStore(): any {
  return createStore(
    appReducer,
    { },
    compose(
      applyMiddleware(thunk)
    )
  );
}


