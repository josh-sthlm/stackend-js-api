import { Module, newModule } from '../stackend';

/**
 * Component class: stackend.live.LiveEventManager
 * @type {string}
 */
export const COMPONENT_CLASS = 'stackend.live.LiveEventManager';

/**
 * Component name: live
 * @type {string}
 */
export const COMPONENT_NAME = 'live';

/**
 * Live uses the generic 'comments' context but the stackend.live.LiveEventManager component
 * @type {string}
 */
export const COMPONENT_CONTEXT = 'comments';

/**
 * Settings for live modules
 */
export interface LiveEventModuleSettings {
  startDate?: number;
  descriptionCmsId?: number;
  showTitle: boolean;
  videoId?: string;
  videoUrl: string;
  videoHtml?: string;
  videoWidth?: number;
  videoHeight?: number;
  videoTitle?: string;
  videoDescription?: string;
  videoThumbnail?: string;
  /**
   * Ids of users with elevated privs
   */
  trustedUsers?: Array<number>;
}

/**
 * Create a new live event module
 * @param communityId
 * @param name
 * @param settings optional settings
 * @returns {*}
 */
export function newLiveEventModule({
  communityId,
  name,
  settings
}: {
  communityId: number;
  name: string;
  settings?: LiveEventModuleSettings;
}): Module {
  const m = newModule({
    communityId,
    componentClass: COMPONENT_CLASS,
    componentContext: COMPONENT_CONTEXT,
    name
  });

  m.componentName = COMPONENT_NAME;
  m.settings = Object.assign({ showTitle: true }, settings || {});

  return m;
}

/**
 * Check if a module is a live event
 * @param module
 * @returns {boolean}
 */
export function isLiveEventModule(module: Module): boolean {
  return module && module.componentClass === COMPONENT_CLASS;
}

/**
 * Get live event settings. Ensure this is a live event
 * @param module
 */
export function getLiveEventModuleSettings(module: Module): LiveEventModuleSettings {
  if (!isLiveEventModule(module)) {
    throw 'Not a live event module: ' + module.id + ' (' + module.componentName + ')';
  }
  return module.settings as LiveEventModuleSettings;
}
