![Stackend Logo](https://github.com/josh-sthlm/stackend-js-api/blob/master/stackend_logo_dark.png)

# About Stackend
https://Stackend.com is backend, frontend & hosting in a single line of code, or if you prefer - a downloadable NPM package.
It contains of hosted, pre-made modules with focus on community driven features that you can add to your new or existing project.
To use Stackend you need to create a Stackend account and a Stack (your cloudbased backend, frontend and admin). 

## Stackend Modules

### Code Bins (CMS for frontend coders)
Rather than using a traditional WYIWYG editor Stacklend allows you to mix HTML/CSS and JS.<br>
For more visit https://stackend.com/product/codebin

### Comments
Stackend comments allows you to add threaded comments to your page.<br>
For more visit https://stackend.com/product/comments

### Reviews
You can set the comment module in "review mode" and allow your visitors to review something 1-5.<br>
For more visit https://stackend.com/product/reviews

### Community Feed
Allows you to add a community feed to you projects for anyone logged in or just selected members.<br>
For more visit https://stackend.com/product/feed

### Login & Registration
A complete login/registration solution with email, Google, Facebook and oAuth2 support.<br>
For more visit https://stackend.com/product/login

### Pages
Pages allows you to wrap multiple modules into one, single page.<br>
For more visit https://stackend.com/product/pages

### Sites
Sites acts as a wrapper for pages and also keep tracks of all your permalinks and generates menus (optional) for you.<br>
For more visit https://stackend.com/product/sites

### User Profiles
User profiles for registered users. If oAuth2 is activated you can use custom profile links(to support your existing solution from Stackend modules).<br>
For more visit https://stackend.com/product/login

## Stackend Admin
Stackend is very suitable for building dynamic applications with user generated content. In order to keep your content clean Stackend includes great moderation tools.<br>
For more visit https://stackend.com/product/admin


# Stackend JS API

This project contins the lowest level of JS bindings to the JSON endpoints provided by api.stackend.com

## Minimal Setup

The code uses redux to keep state. To get started with stackend, you need to first set up a redux store using the reducers from reducers.ts:

```javascript
import { createStore, combineReducers } from 'redux';
import { ALL_REDUCERS } from '@stackend/api/reducers';
import { getInitialStoreValues } from '@stackend/api';
    
// Possibly add your own reducers and middleware here
let reducers = combineReducers(ALL_REDUCERS);    
let store = createStore(reducers, {});
    
// Now you can start using stackend:
let r = await store.dispatch(getInitialStoreValues({ permalink: 'my-test-community' }));              
```


## Logging and configuration


The Stackend library uses [config](https://www.npmjs.com/package/config) to storing project specific settings 
and [log4js](https://www.npmjs.com/package/log4js) for logging.
The default stackend configuration should be usable by any project. However, you might want to tweak the logging setup:

```json
{
  "stackend": {
    "server": "https://api.stackend.com",
    "contextPath": ""
  },
  
 "log4js": {
    "appenders": {
      "console": { "type": "console" }
    },
    "categories": {
      "default": {
        "appenders": [ "console" ],
        "level": "warn"
      }
    }
  }
 } 
```



