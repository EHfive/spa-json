interface SPAJSON {
  /**
   * Converts a PipeWire Simple Plugin API (SPA) JSON string into an object.
   * @param text A valid SPA JSON string, top-level `{` `}` can be omitted.
   * Also accept a standard JSON string.
   * @param reviver A function that transforms the results. This function is called for each member of the object.
   * If a member contains nested objects, the nested objects are transformed before the parent object is.
   */
  parse(
    text: string,
    reviver?: (this: any, key: string, value: any) => any
  ): any
  /**
   * Converts a JavaScript value to a PipeWire Simple Plugin API (SPA) JSON string.
   * @param value A JavaScript value, usually an object or array, to be converted.
   * @param replacer A function that transforms the results.
   * @param space Adds indentation, and white space to the return-value SPA JSON text to make it easier to read.
   * Line break characters are always add.
   * @param noWrap Strips top-level `{` `}` from returned SPA JSON string if {@link value} is an object.
   */
  stringify(
    value: any,
    replacer?: (this: any, key: string, value: any) => any,
    space?: string | number,
    noWrap?: boolean
  ): string
  /**
   * Converts a JavaScript value to a PipeWire Simple Plugin API (SPA) JSON string.
   * @param value A JavaScript value, usually an object or array, to be converted.
   * @param replacer An array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
   * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
   * @param noWrap Strips top-level `{` `}` from returned SPA JSON string if {@link value} is an object.
   */
  stringify(
    value: any,
    replacer?: (number | string)[] | null,
    space?: string | number,
    noWrap?: boolean
  ): string
}

declare var SPAJSON: SPAJSON

export = SPAJSON
