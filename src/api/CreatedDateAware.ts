export interface CreatedDateAware {
  /**
   * Date when the object was created.
   * Can be passed directly to new Date(createdDate)
   */
  createdDate: number;
}

export default CreatedDateAware;
