/**
 * @file services/audioService.js
 * @description Manages all Web Audio API interactions for audio analysis and processing.
 */

// Private state for the service
let audioContext;
let userStream;
let analyser;
// This service would now manage the nodes injected into the content script's audio context
// but for analysis, it uses its own context.

/**
 * Starts the audio analysis by capturing the microphone stream.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
async function start() {
  if (audioContext) return true; // Already started

  try {
    userStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(userStream);
    source.connect(analyser);

    console.log('AudioService started successfully.');
    return true;
  } catch (err) {
    console.error('AudioService: Failed to start.', err);
    return false;
  }
}

/**
 * Stops the audio analysis and releases the microphone.
 */
function stop() {
  if (userStream) {
    userStream.getTracks().forEach((track) => track.stop());
    userStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
  console.log('AudioService stopped.');
}

/**
 * Calculates the current Root Mean Square (RMS) volume in decibels.
 * @returns {number} The volume in dB, or -Infinity if not available.
 */
function getRmsDb() {
  if (!analyser) return -Infinity;

  const dataArray = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(dataArray);

  const sumSquares = dataArray.reduce((acc, amplitude) => acc + amplitude * amplitude, 0);

  const rms = Math.sqrt(sumSquares / dataArray.length);
  if (rms === 0) return -Infinity;

  // 20 * log10(rms) is the standard formula for dB from a signal normalized to -1.0 to 1.0
  return 20 * Math.log10(rms);
}

// Public API for the service
const audioService = {
  start,
  stop,
  getRmsDb,
};

export default audioService;
