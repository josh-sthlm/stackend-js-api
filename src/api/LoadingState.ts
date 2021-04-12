/**
 * Loading state
 */
export enum LoadingState {
  /**
   * Loading not started and data is not available
   */
  NOT_STARTED = 'NOT_STARTED',

  /**
   * Currently loading
   */
  LOADING = 'LOADING',

  /**
   * Data is available
   */
  READY = 'READY'
}

export default LoadingState;
