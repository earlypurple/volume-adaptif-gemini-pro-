/**
 * @file background/background.js
 * @description The service worker for the extension. It manages state and orchestrates other scripts.
 */

import audioService
  from '../services/audioservice.js';
import storageService
  from '../services/storageService.js';
import { mapRange }
  from '../utils/mathhelpers.js';

const ALARM_NAME = 'adaptive-volume-alarm';
const ALARM_PERIOD_MINUTES = 0.1; // Check every 6 seconds

// --- State Management ---
let isEnabled = false;
let currentSettings = {};

/**
 * Main logic to adjust volume based on ambient noise.
 */
async function adjustVolume() {
  if (!isEnabled) return;

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.id) return;

  const domain = getDomainFromUrl(tab.url);
  currentSettings = await storageService.getSettings(domain);

  if (!currentSettings.isEnabled) {
    // If disabled for this site, ensure volume is reset to 1.0
    setTabVolume(tab.id, 1.0);
    return;
  }

  const ambientDb = audioService.getRmsDb();
  if (ambientDb === -Infinity) return; // No audio detected

  // This is the core logic: map the ambient noise level to a volume multiplier.
  // The sensitivity setting from the user will affect this mapping.
  // Example: -60dB (quiet) -> 1.0x volume, -20dB (loud) -> 2.5x volume
  const minDb = -70;
  const maxDb = -20;
  const minVol = 1.0;
  const maxVol = 1.0 + (currentSettings.sensitivity || 1.5); // Sensitivity adjusts the max volume

  const targetVolume = mapRange(ambientDb, minDb, maxDb, minVol, maxVol);

  console.log(`Ambient: ${ambientDb.toFixed(2)}dB -> Target Volume: ${targetVolume.toFixed(2)}x`);
  setTabVolume(tab.id, targetVolume);
}

/**
 * Sends a message to the content script in a specific tab to set the volume.
 * @param {number} tabId The ID of the tab.
 * @param {number} volume The target volume (gain).
 */
function setTabVolume(tabId, volume) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (vol) => {
      // This function is executed in the content script's context
      // It sends a message to the content script itself.
      chrome.runtime.sendMessage({ type: 'SET_VOLUME', volume: vol });
    },
    args: [volume],
  });
}

/**
 * Starts the audio analysis and the periodic alarm.
 */
async function start() {
  const success = await audioService.start();
  if (success) {
    isEnabled = true;
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MINUTES });
    console.log('Adaptive Volume started.');
  } else {
    console.error('Failed to start audio service. Microphone permission might be denied.');
    // Here you could update the popup to show an error state.
  }
}

/**
 * Stops the audio analysis and the alarm.
 */
function stop() {
  audioService.stop();
  isEnabled = false;
  chrome.alarms.clear(ALARM_NAME);
  console.log('Adaptive Volume stopped.');
  // Reset volume on active tabs
  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => {
    if (tab && tab.id) setTabVolume(tab.id, 1.0);
  });
}

// --- Event Listeners ---

// Listen for the alarm to fire
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    adjustVolume();
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_EXTENSION') {
    if (message.isEnabled) {
      start();
    } else {
      stop();
    }
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async responses
});

// Helper to get domain from URL
function getDomainFromUrl(urlString) {
  try {
    const url = new URL(urlString);
    const parts = url.hostname.split('.').reverse();
    return (parts.length >= 2) ? `${parts[1]}.${parts[0]}` : url.hostname;
  } catch (e) {
    return 'default';
  }
}

// Start on install or startup
chrome.runtime.onStartup.addListener(() => {
  // Check storage to see if it should be enabled on startup.
  storageService.getSettings('default').then((settings) => {
    if (settings.isEnabled) {
      start();
    }
  });
});

// Inject content script into existing tabs when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js'],
      }).catch((err) => console.log('Failed to inject script in tab:', tab.url, err));
    });
  });
});
