/**
 * @file services/storageService.js
 * @description A dedicated service for managing data in chrome.storage.local.
 */

const DEFAULT_SETTINGS = {
  isEnabled: false,
  sensitivity: 1.5,
  eqEnabled: true,
};

/**
 * Generates a storage key based on a domain.
 * @param {string} domain - The domain to generate the key for.
 * @returns {string} The formatted storage key.
 */
function getKeyForDomain(domain) {
  return `settings_${domain || 'default'}`;
}

/**
 * Retrieves settings for a given domain.
 * @param {string} domain - The domain to load settings for.
 * @returns {Promise<{isEnabled: boolean, sensitivity: number, eqEnabled: boolean}>}
 */
async function getSettings(domain) {
  const key = getKeyForDomain(domain);
  try {
    const result = await chrome.storage.local.get(key);
    // Merge with defaults to ensure the settings object is always complete
    return { ...DEFAULT_SETTINGS, ...result[key] };
  } catch (e) {
    console.error(`StorageService: Failed to get settings for key "${key}"`, e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Saves settings for a given domain.
 * @param {string} domain - The domain to save settings for.
 * @param {object} settings - The settings object to save.
 * @returns {Promise<void>}
 */
async function saveSettings(domain, settings) {
  const key = getKeyForDomain(domain);
  try {
    await chrome.storage.local.set({ [key]: settings });
  } catch (e) {
    console.error(`StorageService: Failed to save settings for key "${key}"`, e);
  }
}

// Public API for the service
const storageService = {
  getSettings,
  saveSettings,
};

export default storageService;
