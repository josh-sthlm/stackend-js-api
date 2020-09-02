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

### [Community Feed / Index](https://stackend.com/product/feed)

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

This project contains the lowest level of JS bindings to the JSON endpoints provided by api.stackend.com

## Installation

To add Stackend to your project, run:

`npm install --save @stackend/api`

## Initialization and basic setup

The code uses [redux](https://www.npmjs.com/package/redux) to keep application state.
Most API methods are [redux-thunk](https://github.com/reduxjs/redux-thunk#redux-thunk) methods and should be dispatched thru the store.
To get started with stackend, you need to first set up a redux store using the supplied reducers.
**Note:** If your application also uses redux, please do not combine the stores into one single instance as the action types may clash.

The initialize function can also be used to set up logging, custom configuration and to load additional data from the api server.

```javascript
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { STANDARD_REDUCERS } from '@stackend/api/api/reducers';
import { initialize } from '@stackend/api/api/actions';
import { getCurrentCommunity } from '@stackend/api';

// Possibly add your own reducers and middleware here

const store = createStore(combineReducers(STANDARD_REDUCERS), {}, compose(applyMiddleware(thunk)));

await store.dispatch(
  initialize({
    permalink: 'stackend-com' /* Replace with your community permalink */,
  })
);

// Get the community data
const community = await store.dispatch(getCurrentCommunity());
console.log('Community', community);
```

## Custom logging

Stackend [winston](https://github.com/winstonjs/winston#readme) for logging.

If you don't set up logging, a default console logger will be used.

To start stackend with a custom logging setup, supply it to the initialize function like this:

```javascript
import { initialize } from '@stackend/api/api/actions';
import winston from 'winston';

await store.dispatch(
  initialize({
    permalink: 'stackend-com' /* Replace with your community permalink */,
    winstonLogger: winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'Stackend' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    }),
  })
);
```

## Custom setup

Configuration options can also be passed to the initialize function. For details se the API documentation.

```javascript
import { initialize } from '@stackend/api/api/actions';
import winston from 'winston';

await store.dispatch(initialize({
  permalink: 'stackend-com', /* Replace with your community permalink */
  config: {
    ... /* Any settings goes here */
  }
}));
```
