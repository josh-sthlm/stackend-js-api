//@flow

import { createStore, compose, applyMiddleware, combineReducers, Reducer } from 'redux';
import thunk from 'redux-thunk';
import { STANDARD_REDUCERS } from '../src/api/reducers';
import { setLogger } from '../src/api';
import winston from 'winston';

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
  return createStore(combineReducers(reducers), {}, compose(applyMiddleware(thunk)));
}

/**
 * Enable debug log
 */
export function enableDebug(): void {
  setLogger(
    winston.createLogger({
      level: 'debug',
      format: winston.format.json(),
      defaultMeta: { service: 'Stackend' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    })
  );
}
