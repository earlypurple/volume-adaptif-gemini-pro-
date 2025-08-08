/**
 * @file hooks/useSettings.js
 * @description Custom hook to manage extension settings using the storageService.
 */

import storageService from '../services/storageService.js';

/**
 * Retrieves the domain of the currently active tab.
 * @returns {Promise<string>} The formatted domain name (e.g., "google.com") or "default".
 */
async function getCurrentDomain() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.startsWith('http')) {
      const url = new URL(tab.url);
      const parts = url.hostname.split('.').reverse();
      // Return "domain.tld"
      return (parts.length >= 2) ? `${parts[1]}.${parts[0]}` : url.hostname;
    }
  } catch (e) {
    console.warn('Could not retrieve domain.', e);
  }
  return 'default';
}

/**
 * A hook-like function that abstracts getting the current domain and using the storage service.
 * @returns {Promise<{
 *   loadSettings: () => Promise<object>,
 *   saveSettings: (settings: object) => Promise<void>
 * }>}
 */
export default async function useSettings() {
  const domain = await getCurrentDomain();

  /**
     * Loads settings for the current domain.
     * @returns {Promise<{isEnabled: boolean, sensitivity: number, eqEnabled: boolean}>}
     */
  const loadSettings = () => storageService.getSettings(domain);

  /**
     * Saves settings for the current domain.
     * @param {object} settings The settings object to save.
     */
  const saveSettings = (settings) => {
    // Notify other parts of the extension (e.g., background script) about the change.
    chrome.runtime.sendMessage({ type: 'settingsChanged', domain });
    return storageService.saveSettings(domain, settings);
  };

  return {
    loadSettings,
    saveSettings,
  };
}
