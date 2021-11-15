import { Action } from 'redux';

type Reducer<S, A> = (S: any, A: any) => S;

export default function createReducer<S, A>(
  initialState: S,
  handlers: { [key: string]: Reducer<S, A> }
): Reducer<S, A> {
  return function reducer(state: S = initialState, action: Action): S {
    return Object.prototype.hasOwnProperty.call(handlers, action.type) ? handlers[action.type](state, action) : state;
  };
}
