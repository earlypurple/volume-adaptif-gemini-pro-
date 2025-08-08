/**
 * @file content/content.js
 * @description Injected into pages to control audio/video element volume.
 */

console.log('Adaptive Volume content script loaded.');

// Use a Map to keep track of the audio nodes for each media element
const mediaNodes = new Map();

/**
 * Sets up the Web Audio API for a given media element.
 * @param {HTMLMediaElement} element The <audio> or <video> element.
 */
function setupMediaElement(element) {
  if (mediaNodes.has(element)) {
    return;
  }

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(element);
    const gainNode = audioContext.createGain();

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    mediaNodes.set(element, { audioContext, source, gainNode });
    console.log('Attached gain node to a media element:', element);

    // When the element is removed from the DOM, clean up the audio context
    element.addEventListener('remove', () => {
      if (mediaNodes.has(element)) {
        mediaNodes.get(element).audioContext.close();
        mediaNodes.delete(element);
      }
    }, { once: true });
  } catch (error) {
    console.error('Error setting up media element:', error);
  }
}

/**
 * Finds and sets up all existing media elements on the page.
 */
function initialize() {
  document.querySelectorAll('audio, video').forEach(setupMediaElement);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_VOLUME') {
    const { volume } = message;
    console.log(`Setting volume to ${volume}`);
    mediaNodes.forEach((nodes) => {
      // Smooth the volume change to avoid clicks
      nodes.gainNode.gain.setTargetAtTime(volume, nodes.audioContext.currentTime, 0.05);
    });
    sendResponse({ success: true });
  }
});

// Use a MutationObserver to detect when new media elements are added to the DOM
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches('audio, video')) {
          setupMediaElement(node);
        }
        node.querySelectorAll('audio, video').forEach(setupMediaElement);
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initial scan of the page
initialize();
