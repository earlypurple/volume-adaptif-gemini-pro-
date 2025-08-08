/**
 * @file popup/popup.js
 * @description The logic for the extension's popup UI.
 */

import useSettings from '../hooks/useSettings.js';
import createSlider from '../components/slider/slider.js';
import debounce from '../utils/debounce.js';

// --- DOM Elements ---
const masterToggle = document.getElementById('master-toggle');
const controlsPanel = document.getElementById('controls-panel');
const sensitivityContainer = document.getElementById('sensitivity-slider-container');
const eqToggle = document.getElementById('eq-toggle');
const statusMessage = document.getElementById('status-message');

let settingsManager;
let sensitivitySlider;

/**
 * Updates the UI based on the current settings.
 * @param {{isEnabled: boolean, sensitivity: number, eqEnabled: boolean}} settings
 */
function updateUI(settings) {
  masterToggle.checked = settings.isEnabled;
  eqToggle.checked = settings.eqEnabled;

  if (sensitivitySlider) {
    sensitivitySlider.value = settings.sensitivity;
  }

  if (settings.isEnabled) {
    statusMessage.textContent = 'Activé';
    controlsPanel.classList.remove('disabled');
  } else {
    statusMessage.textContent = 'Désactivé';
    controlsPanel.classList.add('disabled');
  }
}

/**
 * Handles changes to any setting.
 */
async function handleSettingsChange() {
  const newSettings = {
    isEnabled: masterToggle.checked,
    sensitivity: parseFloat(sensitivitySlider.value),
    eqEnabled: eqToggle.checked,
  };
  await settingsManager.saveSettings(newSettings);

  // Notify the background script about the master toggle change
  chrome.runtime.sendMessage({
    type: 'TOGGLE_EXTENSION',
    isEnabled: newSettings.isEnabled,
  });
}

/**
 * Initializes the popup.
 */
async function initialize() {
  settingsManager = await useSettings();
  const settings = await settingsManager.loadSettings();

  // Create the sensitivity slider
  sensitivitySlider = createSlider(sensitivityContainer, {
    id: 'sensitivity-slider',
    label: 'Sensibilité au bruit ambiant',
    min: 0.5,
    max: 3.0,
    step: 0.1,
    defaultValue: settings.sensitivity,
    onInput: debounce(handleSettingsChange, 150),
  });

  // Set initial UI state
  updateUI(settings);

  // Add event listeners
  masterToggle.addEventListener('change', handleSettingsChange);
  eqToggle.addEventListener('change', handleSettingsChange);
}

// Run initialization when the popup is loaded
document.addEventListener('DOMContentLoaded', initialize);
