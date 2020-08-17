![Stackend Logo]()

# About Stackend
https://Stackend.com is backend, frontend & hosting in a single line of code, or if you prefer - a downloadable NPM package.
It contains of hosted, pre-made modules that you can add to your new or existing project.

## Modules

### Code Bins
Mix HTML/CSS and JS and create just about anything. Instead of limiting WYSIWYG editors with templates on top, you can create whatever you want, wherever you want. For non-coders, you as a developer can add classes to your HTML, allowing administrators to edit content directly from frontend. 
For more visit https://stackend.com/product/codebin

### Comments
Stackend comments are a very flexible module that allows you to add threaded comments to your page, customize them after your preferences and get help from the state of the art AI engine.
For more visit https://stackend.com/product/comments



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
