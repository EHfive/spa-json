interface SPAJSON {
  parse(text: string): any
  stringify(
    value: any,
    replacer?: (this: any, key: string, value: any) => any,
    space?: string | number
  ): string
  stringify(
    value: any,
    replacer?: (number | string)[] | null,
    space?: string | number
  ): string
}

declare var SPAJSON: SPAJSON

export = SPAJSON
