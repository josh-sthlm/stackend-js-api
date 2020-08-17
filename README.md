<p align="center" style="width:400px; width:auto">
  <a href="https://stackend.com">
    <img src="https://github.com/josh-sthlm/stackend-js-api/blob/master/stackend_logo_dark.png">
  </a>
</p>

# [About Stackend](https://stackend.com)
Stackend.com is backend, frontend & hosting in a single line of code, or if you prefer - a downloadable NPM package.
It contains of hosted, pre-made modules with focus on community driven features that you can add to your new or existing project.
To use Stackend you need to create a Stackend account and a Stack (your cloudbased backend, frontend and admin). 

## Stackend Modules

### [Code Bins (CMS for frontend coders)](https://stackend.com/product/codebin)
Code Bins are small chunks of HTML, CSS and JS used as bulding blocks for your sites<br>

### [Comments](https://stackend.com/product/comments)
Stackend comments allows you to add threaded comments to your page.<br>

### [Reviews](https://stackend.com/product/reviews)
Reviews is a variation of comments that includes a 1-5 star rating.<br>

### [Community Feed / Blog](https://stackend.com/product/feed)
Allows you to add news feeds to you projects for anyone logged in or just selected members.<br>

### [Login & Registration](https://stackend.com/product/login)
A complete login/registration solution with support for email/password, Google, Facebook and OAuth2 support.<br>
OAuth2 is intended for those who want to have a tight integration with their existing user database.

### [Pages](https://stackend.com/product/pages)
Pages allows you to wrap multiple modules into one, single page.<br>

### [Sites](https://stackend.com/product/sites)
Sites acts as a wrapper for pages and also keep tracks of all your permalinks and generates menus (optional) for you.<br>

### [User Profiles](https://stackend.com/product/login)
User profiles for registered users. If OAuth2 is activated you can use custom profile links (to support your existing solution from Stackend modules).<br>

## [Stackend Admin](https://stackend.com/product/admin)
Stackend is very suitable for building dynamic applications with user generated content. In order to keep your content clean Stackend includes great moderation tools.<br>


# Stackend JS API

This project contins the lowest level of JS bindings to the JSON endpoints provided by api.stackend.com

## Minimal Setup

The Stackend library uses [config](https://www.npmjs.com/package/config) to store project specific settings 
and [log4js](https://www.npmjs.com/package/log4js) for logging.

Your project must include the file `config/default.json` to work.

The built in stackend configuration should be usable by any project and may be left out. However, you might want to tweak the logging setup:

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
The code uses [redux](https://www.npmjs.com/package/redux) to keep application state. To get started with stackend, you need to first set up a redux store using the reducers from reducers.ts. **Note:** If your application also uses redux, please do not combine the stores into one single instance.

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

