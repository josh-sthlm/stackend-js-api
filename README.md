
# Stackend JS API

This is the lowest level of JS bindings to the JSON endpoints provided by api.stackend.com

## Redux

The code uses redux to keep state. To use the code, you need to first set up a redux store using the reducers from reducers.ts:

```
import { createStore, combineReducers } from 'redux';
import { ALL_REDUCERS } from '@stackend/api/reducers';
import { getInitialStoreValues } from '@stackend/api';
    
// Possibly add your own reducers and middleware here
let reducers = combineReducers(ALL_REDUCERS);    
let store = createStore(reducers, {});
    
// Now you can start using stackend:
let r = await store.dispatch(getInitialStoreValues({ permalink: 'my-test-community' }));              
```
