/**
 * @description checks if property exist return 1 if it does if it
 * does not keep checking
 * @param object
 * @param getter
 */
export const propertyDefined = async (object, getter) => {
  return new Promise((resolve, reject) => {
    setImmediate(function check() {
      if (getter(object) !== undefined) {
        resolve(1);
      } else {
        setImmediate(check.bind(this));
      }
    });
  });
};
