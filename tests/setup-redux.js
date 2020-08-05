//@flow

import {createStore, compose, applyMiddleware, combineReducers, Action} from 'redux';
import thunk from 'redux-thunk';
import { ALL_REDUCERS } from "../src/reducers.ts";


const appReducer = combineReducers(ALL_REDUCERS);

const rootReducer = (state: State, action: Action) => {
    if (action.type === 'EMPTY_STORE') {
        state = undefined;
    }

    return appReducer(state, action);
};

let preloadedState = undefined;

let store = createStore(
    rootReducer,
    preloadedState,
    compose(
        applyMiddleware(thunk, crashReporter),
        (window && window.__REDUX_DEVTOOLS_EXTENSION__)
            ? window.__REDUX_DEVTOOLS_EXTENSION__( {trace: true, traceLimit: 25 })
            : f => f
    )
);

export default store;

export const crashReporter = (store: any) => (next: any) => (action: any) => {
    declare var __xcapRunningServerSide: any;
    try {
        return next(action);
    } catch (err) {
        if (typeof __xcapRunningServerSide === 'undefined') {
            console.error('Caught an exception!', err);
            console.error('redux action', action);
            console.error('redux state', store.getState());
        } else {
            console.error('Caught an exception!', JSON.stringify(err));
        }
        throw err;
    }
};