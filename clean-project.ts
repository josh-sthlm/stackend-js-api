// @ts-ignore
import rimraf from 'rimraf';

/**
 * Removes generated files
 */

const COMPONENTS = [
  "abuse",
  "api",
  "blog",
  "category",
  "cms",
  "comments",
  "counter",
  "event",
  "forum",
  "group",
  "like",
  "login",
  "media",
  "poll",
  "qna",
  "rating",
  "request",
  "search",
  "shop",
  "stackend",
  "throbber",
  "user",
  "vote"
];

const glob = '{' + COMPONENTS.join(',') + '}/*.{js,js.map}';

console.log(glob);
