/**
 * @file utils/debounce.js
 * @description A utility function to limit the rate at which a function gets called.
 */

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was invoked.
 *
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @returns {Function} Returns the new debounced function.
 */
export function debounce(func, wait) {
  let timeout;

  // This is the function that will be returned and called
  return function executedFunction(...args) {
    // The function to be executed after the debounce time
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    // Clear the timeout every time the function is called
    clearTimeout(timeout);
    // Set the timeout again
    timeout = setTimeout(later, wait);
  };
}