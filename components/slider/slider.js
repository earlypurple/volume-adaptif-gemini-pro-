/**
 * @file components/Slider.js
 * @description A reusable slider component for the extension's UI.
 */

/**
 * Creates and appends a slider component to a parent element.
 * @param {HTMLElement} parent - The parent element to append the slider to.
 * @param {object} options - The slider options.
 * @param {string} options.id - The ID for the input element.
 * @param {string} options.label - The text label for the slider.
 * @param {number} options.min - The minimum value.
 * @param {number} options.max - The maximum value.
 * @param {number} options.step - The step value.
 * @param {number} options.defaultValue - The default value.
 * @param {function(Event): void} [options.onInput] - Optional callback for the input event.
 * @returns {HTMLInputElement} The created slider input element.
 */
export function createSlider(parent, { id, label, min, max, step, defaultValue, onInput }) {
    // Create a container for the component
    const container = document.createElement('div');
    
    // Create the label
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    labelElement.style.display = 'block';
    labelElement.style.marginBottom = '0.5rem';
    labelElement.style.fontSize = '0.875rem';
    labelElement.style.fontWeight = '500';
    
    // Create the slider input
    const sliderInput = document.createElement('input');
    sliderInput.type = 'range';
    sliderInput.id = id;
    sliderInput.min = min;
    sliderInput.max = max;
    sliderInput.step = step;
    sliderInput.value = defaultValue;
    
    // Apply styling via class or directly
    // In a real project, you'd add a class name here.
    sliderInput.style.width = '100%';

    // Attach event listener if provided
    if (onInput && typeof onInput === 'function') {
        sliderInput.addEventListener('input', onInput);
    }

    // Append elements to the container, and the container to the parent
    container.appendChild(labelElement);
    container.appendChild(sliderInput);
    parent.appendChild(container);

    return sliderInput;
}