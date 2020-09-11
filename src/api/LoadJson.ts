//@flow

//import log4js from 'log4js';
import { logger, Parameters, XcapJsonResult } from './index';

require('es6-promise').polyfill();
require('isomorphic-fetch');

/**
 * Content type for json data
 * @type {string}
 */
export const CONTENT_TYPE_JSON = 'application/json';

/**
 * Content type for form data
 * @type {string}
 */
export const CONTENT_TYPE_X_WWW_FORM_URLENCODED = 'application/x-www-form-urlencoded';

/**
 * Url encode a parameter object.
 * @param parameters
 * @returns {String}
 */
export function urlEncodeParameters(parameters: Parameters | null | undefined): string {
  if (typeof parameters === 'string') {
    return parameters;
  }
  if (typeof parameters === 'undefined' || parameters === null) {
    return '';
  }

  let f = true;
  let s = '';
  for (const k of Object.keys(parameters)) {
    const v = parameters[k];
    if (v !== null) {
      if (Array.isArray(v)) {
        for (const p of v) {
          if (f) {
            f = false;
          } else {
            s += '&';
          }
          s += encodeURIComponent(k);
          if (typeof p !== 'undefined' && p != null) {
            s += '=' + encodeURIComponent(p);
          }
        }
      } else {
        if (f) {
          f = false;
        } else {
          s += '&';
        }
        s += encodeURIComponent(k);
        if (typeof v !== 'undefined') {
          s += '=' + encodeURIComponent(v);
        }
      }
    }
  }

  return s;
}

/**
 * Append to the query string
 * @param url
 * @param queryString
 * @return {String}
 */
export function appendQueryString(url: string, queryString: string): string {
  let u = url;

  if (queryString && queryString !== '') {
    if (u.indexOf('?') !== -1) {
      u = u + '&' + queryString;
    } else {
      u = u + '?' + queryString;
    }
  }

  return u;
}

export interface LoadJsonResult {
  status: number;
  error?: string;
  response: Response | null;
  json?: XcapJsonResult;
}

/**
 * Load an url as json. Supports GET and POST (using application/x-www-form-urlencoded or a json body)
 *
 * @param url {String}
 * @param method {String} Optional method string.
 * @param parameters {Object} Parameters
 * @param body Optional body content. May be an object or string.
 * @param bodyContentType Mime type of the body content (optional)
 * @param xpressToken
 * @param cookie Optional cookie string
 * @constructor
 */
export async function LoadJson({
  url,
  method = 'GET',
  parameters = null,
  body = null,
  bodyContentType = CONTENT_TYPE_X_WWW_FORM_URLENCODED,
  xpressToken,
  cookie
}: {
  url: string;
  method?: string;
  parameters?: any;
  body?: any;
  bodyContentType?: string;
  xpressToken?: string;
  cookie?: string | null;
}): Promise<LoadJsonResult> {
  //console.log("Fetching json: ",url);
  //console.trace("Fetching json: ",url);

  let headers;
  if (typeof Headers === 'function') {
    headers = new Headers();
    headers.set('x-custom-headless', 'true');
    headers.set('Accept', CONTENT_TYPE_JSON);

    // In most cases handled by the browser but supplied in SSR initial data fetch
    if (typeof cookie === 'string') {
      headers.set('cookie', cookie);
    }
  }

  const opts: RequestInit = {
    method,
    headers,
    mode: 'cors',
    cache: 'default',
    credentials: 'include',
    body: undefined
  };

  // Encode json if needed
  if (body && bodyContentType === CONTENT_TYPE_JSON && typeof body === 'object') {
    body = JSON.stringify(body);
  }
  let queryString = '';

  if (method === 'POST') {
    if (bodyContentType !== null) {
      if (body && typeof body.toString === 'function' && body.toString().indexOf('FormData') !== -1) {
        // This is a file upload. Don't set the content type,
        // since that would remove the boundary parameter for the binary data.
      } else if (headers) {
        headers.set('Content-Type', bodyContentType);
      }
    }

    // FIXME: Should use xpress ajax token that includes checksumming of parameters
    if (xpressToken && !!headers) {
      headers.append('x-custom-xpress-token', xpressToken);
    }

    // When body is already set, add the parameters to the url instead

    if (body) {
      queryString = urlEncodeParameters(parameters);
    } else if (bodyContentType === CONTENT_TYPE_JSON) {
      body = JSON.stringify(parameters);
    } else {
      //body = createFormData(parameters);
      body = urlEncodeParameters(parameters);
    }
    opts.body = body;
  } else {
    queryString = urlEncodeParameters(parameters);
  }
  url = appendQueryString(url, queryString);
  let response = null;
  let request;
  try {
    if (typeof Headers === 'function' && typeof Request === 'function') {
      request = new Request(url, opts);
      response = await fetch(request);
    } else {
      response = await fetch(url, opts);
    }

    // FIXME: Should throw to encourage proper error handling and not cause any weird errors in the data layer.
    if (!response.ok) {
      if (response.status === 401 || response.status === 404 || response.status === 500) {
        logger.error('The Fetch request of ' + url + ' failed: ' + response.status + response.statusText);
        return {
          error: response.status + ': ' + response.statusText,
          status: response.status,
          response
        };
      } else {
        const status = response.status ? 'Error Status:' + response.status : '';
        logger.error(
          status +
            ' The Fetch request of ' +
            url +
            ' failed: ' +
            JSON.stringify(typeof request !== 'undefined' ? request : null) +
            JSON.stringify(response)
        );
        return {
          error: response.status + ': ' + response.statusText,
          status: response.status,
          response
        };
      }
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf(CONTENT_TYPE_JSON) > -1) {
      const json = (await response.json()) as XcapJsonResult;

      const r: LoadJsonResult = {
        status: 200,
        json: json,
        response
      };

      // The check for __resultCode exist because of media upload that does not produce the same json
      if (
        json.__resultCode &&
        (json.__resultCode === 'error' || json.__resultCode === 'accessDenied' || json.__resultCode === 'notfound')
      ) {
        r.error = json.__resultCode;
        // Add error messages, if not done by server
        if (!json.error) {
          json.error = {
            actionErrors: ['error'],
            fieldErrors: {}
          };
        }
      }

      return r;
    } else {
      logger.error(
        'Error Status:500 The Fetch request of ' +
          url +
          ' failed, Wrong content-type.' +
          JSON.stringify(typeof request !== 'undefined' ? request : null) +
          JSON.stringify(response)
      );
      return {
        error: 'Response is not a json object',
        status: 200,
        response
      };
    }
  } catch (e) {
    logger.error(e, request ? JSON.stringify(request) : '');
    if (e.message === 'Failed to fetch') {
      return {
        error: "Can't access stackend api. Please make sure you've allowed this domain in your stack settings.",
        status: 500,
        response
      };
    }
    return {
      error: e,
      status: 500,
      response
    };
  }
}

export default LoadJson;

/**
 * Given a set of parameters, construct a FormData object that can be used as the body of a request
 * @param parameters
 * @return {FormData}
 */
export function createFormData(parameters: any): FormData {
  const formData = new FormData();
  if (typeof parameters !== 'undefined') {
    for (const i in parameters) {
      if (Object.prototype.hasOwnProperty.call(parameters, i)) {
        formData.append(i, String(parameters[i]));
      }
    }
  }

  return formData;
}
