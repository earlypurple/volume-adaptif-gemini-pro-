/**
 * @file hooks/useSettings.js
 * @description Custom hook to manage extension settings in chrome.storage.
 */

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
        console.warn("Could not retrieve domain.", e);
    }
    return 'default';
}

/**
 * A hook-like function to manage settings for the extension.
 * It provides methods to load and save settings specific to the current domain.
 * @returns {Promise<{
 * loadSettings: () => Promise<{isEnabled: boolean, sensitivity: number, eqEnabled: boolean}>,
 * saveSettings: (settings: {isEnabled: boolean, sensitivity: number, eqEnabled: boolean}) => Promise<void>
 * }>}
 */
export async function useSettings() {
    const domain = await getCurrentDomain();
    const storageKey = `settings_${domain}`;

    const defaultSettings = {
        isEnabled: false,
        sensitivity: 1.5,
        eqEnabled: true,
    };

    /**
     * Loads settings from chrome.storage for the current domain.
     * @returns {Promise<{isEnabled: boolean, sensitivity: number, eqEnabled: boolean}>}
     */
    const loadSettings = async () => {
        try {
            const result = await chrome.storage.local.get(storageKey);
            // Merge stored settings with defaults to ensure all keys are present
            return { ...defaultSettings, ...result[storageKey] };
        } catch (e) {
            console.error("Failed to load settings:", e);
            return defaultSettings;
        }
    };

    /**
     * Saves settings to chrome.storage for the current domain.
     * @param {{isEnabled: boolean, sensitivity: number, eqEnabled: boolean}} settings The settings object to save.
     */
    const saveSettings = async (settings) => {
        try {
            await chrome.storage.local.set({ [storageKey]: settings });
            // Notify other parts of the extension (e.g., background script) about the change.
            chrome.runtime.sendMessage({ type: 'settingsChanged', domain });
        } catch (e) {
            console.error("Failed to save settings:", e);
        }
    };

    return {
        loadSettings,
        saveSettings,
    };
}