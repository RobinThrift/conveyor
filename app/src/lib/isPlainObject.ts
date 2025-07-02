export const isPlainObject = (value: any) =>
    value != null && [null, Object.prototype].includes(Object.getPrototypeOf(value))
