//@flow

import {createStore, compose, applyMiddleware, combineReducers, Action} from 'redux';
import thunk from 'redux-thunk';
import { ALL_REDUCERS } from "../src/reducers";

declare var __xcapRunningServerSide: any;

const appReducer = combineReducers(ALL_REDUCERS);

const rootReducer = (state: any, action: Action) => {
    if (action.type === 'EMPTY_STORE') {
        state = undefined;
    }

    return appReducer(state, action);
};

let preloadedState = undefined;

export const crashReporter = (store: any) => (next: any) => (action: any) => {

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

