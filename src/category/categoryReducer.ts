// @flow
import update from 'immutability-helper';
import * as categoryApi from './index';
import { Category } from './index';

////Action Type
export const REQUEST_AVAILABLE_CATEGORIES = 'REQUEST_AVAILABLE_CATEGORIES';
export const RECEIVE_AVAILABLE_CATEGORIES = 'RECEIVE_AVAILABLE_CATEGORIES';
export const INVALIDATE_AVAILABLE_CATEGORIES = 'INVALIDATE_AVAILABLE_CATEGORIES';
export const CATEGORIES_TOGGLE_SELECTED = 'CATEGORIES_TOGGLE_SELECTED';
export const CATEGORIES_REMOVE_SELECTION = 'CATEGORIES_REMOVE_SELECTION';

export type CategoriesActionTypes =
  | 'REQUEST_AVAILABLE_CATEGORIES'
  | 'RECEIVE_AVAILABLE_CATEGORIES'
  | 'INVALIDATE_AVAILABLE_CATEGORIES'
  | 'CATEGORIES_TOGGLE_SELECTED'
  | 'CATEGORIES_REMOVE_SELECTION';

export type CategoriesState = {
  [context: string]: {
    isFetching: boolean;
    didInvalidate: boolean;
    available: any;
    lastUpdated: number;
    selected?: {
      [reference: string]: any;
    };
  };
};

export type CategoriesAction =
  | { type: 'REQUEST_AVAILABLE_CATEGORIES'; context: string }
  | {
      type: 'RECEIVE_AVAILABLE_CATEGORIES';
      context: string;
      available: { categories: Array<categoryApi.Category> };
      json: any;
    }
  | { type: 'INVALIDATE_AVAILABLE_CATEGORIES'; context: string }
  | {
      type: 'CATEGORIES_TOGGLE_SELECTED';
      context: string;
      reference: string;
      category: categoryApi.Category;
    }
  | { type: 'CATEGORIES_REMOVE_SELECTION'; context: string; reference: string };

//Reducer
function categories(state: CategoriesState = {}, action: CategoriesAction): CategoriesState {
  switch (action.type) {
    case REQUEST_AVAILABLE_CATEGORIES:
      return update(state, {
        [action.context]: {
          $apply: (context: any): any =>
            update(context || { selected: {} }, {
              isFetching: { $set: true },
              didInvalidate: { $set: false },
              available: { $set: state[action.context] ? state[action.context].available : '' },
            }),
        },
      });

    case RECEIVE_AVAILABLE_CATEGORIES:
      return update(state, {
        [action.context]: {
          $apply: (context: any): any =>
            update(context || { selected: {} }, {
              isFetching: { $set: false },
              didInvalidate: { $set: false },
              available: { $set: action.json },
              lastUpdated: { $set: Date.now() },
            }),
        },
      });

    case INVALIDATE_AVAILABLE_CATEGORIES:
      return update(state, {
        [action.context]: {
          $apply: (context): any =>
            update(context || { selected: {} }, {
              didInvalidate: { $set: true },
            }),
        },
      });

    case CATEGORIES_TOGGLE_SELECTED: {
      const categories =
        !!state[action.context] &&
        !!state[action.context].selected &&
        // @ts-ignore
        state[action.context].selected[action.reference];

      const idOfClickedCategory = categories
        ? categories.map((category: Category) => category.id).indexOf(action.category.id)
        : -1;

      if (idOfClickedCategory !== -1) {
        //category clicked is selected -> remove selection
        return update(state, {
          [action.context]: {
            $apply: (context: any): any =>
              update(context || { selected: {} }, {
                selected: {
                  [action.reference]: {
                    $apply: (reference: string): any =>
                      update(reference || [], { $splice: [[idOfClickedCategory, 1]] }),
                  },
                },
              }),
          },
        });
      } else {
        //category clicked is not selected -> set selection
        return update(state, {
          [action.context]: {
            $apply: (context: any): any =>
              update(context || { selected: {} }, {
                selected: {
                  [action.reference]: {
                    $apply: (reference: any): any => update(reference || [], { $push: [action.category] }),
                  },
                },
              }),
          },
        });
      }
    }

    case CATEGORIES_REMOVE_SELECTION:
      return update(state, {
        [action.context]: {
          $apply: (context: any): any =>
            update(context || { selected: {} }, {
              // @ts-ignore
              selected: {
                [action.reference]: {
                  $apply: (reference: string): any => update(reference || [], { $set: [] }),
                },
              },
            }),
        },
      });
    default:
      return state;
  }
}

export default categories;
