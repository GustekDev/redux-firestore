import { isFunction, isBoolean, isArray, pick } from 'lodash';

/**
 * Create a path array from path string
 * @param  {String} path - Path seperated with slashes
 * @return {Array} Path as Array
 * @private
 */
export function pathToArr(path) {
  return path ? path.split(/\//).filter(p => !!p) : [];
}

/**
 * Trim leading slash from path for use with state
 * @param  {String} path - Path seperated with slashes
 * @return {String} Path seperated with slashes
 * @private
 */
export function getSlashStrPath(path) {
  return pathToArr(path).join('/');
}

/**
 * Convert path with slashes to dot seperated path (for use with lodash get/set)
 * @param  {String} path - Path seperated with slashes
 * @return {String} Path seperated with dots
 * @private
 */
export function getDotStrPath(path) {
  return pathToArr(path).join('.');
}

/**
 * Combine reducers utility (abreveated version of redux's combineReducer).
 * Turns an object whose values are different reducer functions, into a single
 * reducer function.
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one.
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 * @private
 */
export const combineReducers = reducers => (state = {}, action) =>
  Object.keys(reducers).reduce((nextState, key) => {
    /* eslint-disable no-param-reassign */
    nextState[key] = reducers[key](state[key], action);
    /* eslint-enable no-param-reassign */
    return nextState;
  }, {});

/**
 * Get path from meta data. Path is used with lodash's setWith to set deep
 * data within reducers.
 * @param  {Object} meta - Action meta data object
 * @param  {String} meta.collection - Name of Collection for which the action
 * is to be handled.
 * @param  {String} meta.doc - Name of Document for which the action is to be
 * handled.
 * @param  {Array} meta.subcollections - Subcollections of data
 * @param  {String} meta.storeAs - Another key within redux store that the
 * action associates with (used for storing data under a path different
 * from its collection/document)
 * @return {String} String path to be used within reducer
 */
export function pathFromMeta(meta) {
  if (!meta) {
    throw new Error('Action meta is required to build path for reducers.');
  }
  const { collection, doc, subcollections, storeAs } = meta;
  if (storeAs) {
    return storeAs;
  }
  if (!collection) {
    throw new Error('Collection is required to construct reducer path.');
  }
  let basePath = collection;
  if (doc) {
    basePath += `.${doc}`;
  }
  if (!subcollections) {
    return basePath;
  }
  const mappedCollections = subcollections.map(pathFromMeta);
  return basePath.concat(`.${mappedCollections.join('.')}`);
}

/**
 * Encapsulate the idea of passing a new object as the first parameter
 * to Object.assign to ensure we correctly copy data instead of mutating
 * @param  {Object} oldObject - Object before update
 * @param  {Object} newValues - New values to add to the object
 * @return {Object} Object with new values
 */
export function updateObject(oldObject, newValues) {
  return Object.assign({}, oldObject, newValues);
}

/**
 * Update a single item within an array
 * @param  {Array} array - Array within which to update item
 * @param  {String} itemId - Id of item to update
 * @param  {Function} updateItemCallback - Callback dictacting how the item
 * is updated
 * @return {Array} Array with item updated
 */
export function updateItemInArray(array, itemId, updateItemCallback) {
  const updatedItems = array.map(item => {
    if (item.id !== itemId) {
      // Since we only want to update one item, preserve all others as they are now
      return item;
    }

    // Use the provided callback to create an updated item
    const updatedItem = updateItemCallback(item);
    return updatedItem;
  });

  return updatedItems;
}

export const preserveValuesFromState = (state, preserveSetting, nextState) => {
  // Return result of function if preserve is a function
  if (isFunction(preserveSetting)) {
    return preserveSetting(state, nextState);
  }
  // Return original state if preserve is true
  if (isBoolean(preserveSetting) && preserveSetting) {
    return nextState ? { ...state, ...nextState } : state;
  }

  if (isArray(preserveSetting)) {
    return pick(state, preserveSetting); // pick returns a new object
  }

  throw new Error(
    'Invalid preserve parameter. It must be an Object or an Array',
  );
};
