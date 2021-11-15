import { applyMiddleware, combineReducers, compose, createStore, Reducer } from 'redux';
import thunk from 'redux-thunk';
import { STANDARD_REDUCERS } from '../src/api/reducers';
import { setLogger } from '../src/api';
import { ConsoleLogger, Level } from '../src/util/Logger';

const appReducer = combineReducers(STANDARD_REDUCERS);
export type AppState = ReturnType<typeof appReducer>;

/**
 * Create a store with the standard reducers
 */
export default function createTestStore(): any {
  enableDebug();
  return createStore(appReducer, {}, compose(applyMiddleware(thunk)));
}

/**
 * Create a store with custom reducers
 * @param reducers
 */
export function createCustomTestStore(reducers: { [name: string]: Reducer<any, any> }): any {
  enableDebug();
  const r = combineReducers(reducers);
  return createStore(r, {}, compose(applyMiddleware(thunk)));
}

/**
 * Enable debug log
 */
export function enableDebug(): void {
  setLogger(new ConsoleLogger('stackend', Level.DEBUG));
}
