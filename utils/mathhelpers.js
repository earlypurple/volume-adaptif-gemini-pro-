/**
 * @file utils/mathhelpers.js
 * @description A collection of mathematical helper functions for audio processing.
 */

/**
 * Converts a linear amplitude value (from -1.0 to 1.0) to decibels (dB).
 * @param {number} linearValue - The linear amplitude value.
 * @returns {number} The corresponding value in decibels, or -Infinity for silence.
 */
export function linearToDb(linearValue) {
  if (linearValue === 0) {
    return -Infinity;
  }
  // The standard formula for converting linear amplitude to dB.
  return 20 * Math.log10(Math.abs(linearValue));
}

/**
 * Maps a value from one range to another.
 * For example, mapping a dB level (-60 to 0) to a gain factor (0.5 to 4).
 * @param {number} value - The input value to map.
 * @param {number} inMin - The lower bound of the input range.
 * @param {number} inMax - The upper bound of the input range.
 * @param {number} outMin - The lower bound of the output range.
 * @param {number} outMax - The upper bound of the output range.
 * @returns {number} The mapped value.
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  // Clamp the value to the input range to avoid weird results
  const clampedValue = Math.max(inMin, Math.min(value, inMax));
  
  // Perform the linear mapping
  return ((clampedValue - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Applies exponential smoothing to a value.
 * This is useful for preventing jerky movements in UI or audio parameters.
 * @param {number} currentValue - The current value.
 * @param {number} targetValue - The value to move towards.
 * @param {number} smoothingFactor - A value between 0 and 1. Higher is faster.
 * @returns {number} The new, smoothed value.
 */
export function smooth(currentValue, targetValue, smoothingFactor) {
    return currentValue * (1 - smoothingFactor) + targetValue * smoothingFactor;
}