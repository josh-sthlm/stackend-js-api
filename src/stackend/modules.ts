//@flow

export enum ModuleType {
  /** Styling */
  GLOBAL_STYLE = 'stackend-global-style',

  /** Feed (variation of blog) */
  FEED = 'stackend-feed',

  FAQ = 'stackend-faq',

  /** Login link and user menu */
  LOGIN = 'stackend-login',

  /** Profile popup */
  PROFILE = 'stackend-profile',

  /** Comments */
  COMMENTS = 'stackend-comment',

  /** A single code bin */
  CMS = 'stackend-cms',

  /** Blog (variation of feed) */
  BLOG = 'stackend-blog',

  /** Different throbbers */
  THROBBER = 'stackend-throbber',

  /** Purely presentational */
  SLIDESHOW = 'stackend-slideshow',

  /** Combines content into a page */
  PAGE = 'stackend-page',

  /** A container that allows the user to navigate pages, much like an iframe  */
  SUBSITE = 'stackend-site'
}

export interface ModuleInfo {
  /** Human readable name */
  name: string;

  /** Type */
  type: ModuleType;

  /** Only a single instance of this module may exist */
  singleton: boolean;

  /** Should this module be added automatically? */
  addAutomatically: boolean;

  /** Parameters required by this module */
  parameters: Array<string>;

  /** The id is just the community id, not a module id */
  simpleId: boolean;

  /** Does this module require data to be fetched? */
  fetchData: boolean;

  /** May this module contain sub modules? */
  complex: boolean;

  /** Component name */
  xcapModuleType: string | null;

  /** Component context */
  defaultContext: string | null;
}

export const MODULE_INFO: { [moduleType: string]: ModuleInfo } = {
  [ModuleType.FEED]: {
    name: 'Feed',
    type: ModuleType.FEED,
    singleton: false,
    addAutomatically: false,
    parameters: ['id'],
    simpleId: false,
    fetchData: true,
    complex: false,
    xcapModuleType: 'group',
    defaultContext: 'groups'
  },
  [ModuleType.FAQ]: {
    name: 'FAQ',
    type: ModuleType.FAQ,
    singleton: false,
    addAutomatically: false,
    parameters: ['id'],
    simpleId: false,
    fetchData: true,
    complex: false,
    xcapModuleType: 'forum',
    defaultContext: 'question'
  },
  [ModuleType.LOGIN]: {
    name: 'Login',
    type: ModuleType.LOGIN,
    singleton: false,
    addAutomatically: true,
    parameters: ['id'],
    simpleId: true,
    fetchData: false,
    complex: false,
    xcapModuleType: null,
    defaultContext: 'members'
  },
  [ModuleType.PROFILE]: {
    name: 'Profile',
    type: ModuleType.PROFILE,
    singleton: true,
    addAutomatically: true,
    parameters: ['id'],
    simpleId: true,
    fetchData: false,
    complex: false,
    xcapModuleType: null,
    defaultContext: 'members'
  },
  [ModuleType.COMMENTS]: {
    name: 'Comments',
    type: ModuleType.COMMENTS,
    singleton: false,
    addAutomatically: false,
    parameters: ['id', 'reference-id', 'group-id'],
    simpleId: false,
    fetchData: true,
    complex: false,
    xcapModuleType: 'comment',
    defaultContext: 'comments'
  },
  [ModuleType.CMS]: {
    name: 'Code Bin',
    type: ModuleType.CMS,
    singleton: false,
    addAutomatically: false,
    parameters: ['id'],
    simpleId: false,
    fetchData: true,
    complex: false,
    xcapModuleType: 'cms',
    defaultContext: 'cms'
  },
  [ModuleType.PAGE]: {
    name: 'Page',
    type: ModuleType.PAGE,
    singleton: false,
    addAutomatically: false,
    parameters: ['id'],
    simpleId: false,
    fetchData: true,
    complex: false,
    xcapModuleType: 'page',
    defaultContext: 'cms'
  },
  [ModuleType.SUBSITE]: {
    name: 'Site',
    type: ModuleType.SUBSITE,
    singleton: false,
    addAutomatically: false,
    parameters: ['id', 'menu'],
    simpleId: false,
    fetchData: true,
    complex: false,
    xcapModuleType: 'tree',
    defaultContext: 'cms'
  },
  [ModuleType.BLOG]: {
    name: 'Blog',
    type: ModuleType.BLOG,
    singleton: false,
    addAutomatically: false,
    parameters: ['id'],
    simpleId: false,
    fetchData: true,
    complex: false,
    xcapModuleType: 'blog',
    defaultContext: 'news'
  },
  [ModuleType.SLIDESHOW]: {
    name: 'Slideshow',
    type: ModuleType.SLIDESHOW,
    singleton: false,
    addAutomatically: false,
    parameters: ['delay', 'height', 'arrows', 'indicators', 'auto-play', 'animation-time'],
    simpleId: true,
    fetchData: false,
    complex: true,
    xcapModuleType: null,
    defaultContext: null
  },
  [ModuleType.THROBBER]: {
    name: 'Throbber',
    type: ModuleType.THROBBER,
    singleton: true,
    addAutomatically: true,
    parameters: ['id'],
    simpleId: true,
    fetchData: false,
    complex: false,
    xcapModuleType: null,
    defaultContext: null
  }
};

/**
 * The module types that should be added automatically
 */
export const AUTOMATIC_MODULE_TYPES: Array<ModuleType> = [
  ModuleType.GLOBAL_STYLE,
  ModuleType.LOGIN,
  ModuleType.PROFILE,
  ModuleType.THROBBER
];

/**
 * Get module info
 * @param moduleType
 * @returns ModuleInfo
 */
export function getModuleInfo(moduleType: ModuleType): ModuleInfo | null {
  const i = MODULE_INFO[moduleType];
  if (typeof i === 'undefined') {
    return null;
  }

  return i;
}

/**
 * Translate a ModuleType to a value accepted by index.ts
 * @param moduleType
 * @returns {string}
 */
export function getXcapModuleType(moduleType: ModuleType): string {
  const i = MODULE_INFO[moduleType];
  if (typeof i === 'undefined' || i.xcapModuleType === null) {
    throw Error('Module type ' + moduleType + ' has no corresponding xcap type');
  }
  return i.xcapModuleType;
}

/**
 * Get the default component context of a module type
 * @param moduleType
 */
export function getDefaultComponentContext(moduleType: ModuleType): string {
  const i = MODULE_INFO[moduleType];
  if (typeof i === 'undefined' || i.defaultContext === null) {
    throw Error('Module type ' + moduleType + ' has no default component context');
  }
  return i.defaultContext;
}

/**
 * Get a human readable label for the module type
 * @param moduleType
 * @returns {string}
 */
export function getModuleLabel(moduleType: ModuleType): string {
  return MODULE_INFO[moduleType].name;
}
