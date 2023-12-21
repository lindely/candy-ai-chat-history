/**
 * Configuration options. Populated in `loadConfig()`.
*/
const config = {};

/**
 * Object for storing some data.
 */
const candy = {
    // Reference to the element representing the message list.
    messagesList: null,
    // ID for the active message from which new history will be loaded.
    activeMessageId: null,
    // Reference to the custo "load history" button.
    button: null,
    // Number of history pages loaded. 
    pages: 0
};

// ID for the custom button.
const BUTTON_ID = 'candy-ai-assistant-history-button';

/**
 * Retrieve the Id of the oldest message in the message list.
 * @returns {String} ID of the message.
 */
function getActiveMessageId() {
    return candy.messagesList.querySelector('div').getAttribute('id');
}

/**
 * Collect the next page in the chat history.
 */
function collectHistory() {
    let attempt = 0;
    
    let timeout = window.setInterval(() => {
        // Determine the ID of the oldest message in the chat.
        const currentMessageId = getActiveMessageId();

        // When the ID differs from the stored value, a new page of history
        // has been loaded.
        if (currentMessageId !== candy.activeMessageId) {
            // Store the message ID for future reference and stop the
            // active interval.
            candy.activeMessageId = currentMessageId;
            window.clearInterval(timeout);

            // When the maximum number of pages is not yet reached, fetch
            // the next page of history.
            if (config.collectPages < 0 || ++candy.pages < config.collectPages) {
                scrollUp();
            }
        } else {
            // No new message found. Increment the attempts.
            attempt++;

            // When the maximum number of attempts is reached, stop the
            // active interval.
            if (attempt >= config.collectAttempts) {
                window.clearInterval(timeout);
                candy.button.disabled = false;
                candy.button.style.opacity = 1;
                scrollDown();
            }
        }
    }, config.collectInterval);
}

/**
 * Scroll up to the top of the message list, triggering the loading of
 * additional messages.
 */
function scrollUp() {
    candy.messagesList.scrollIntoView({
        behavior: 'instant',
        block: 'start',
        inline: 'start'
    });

    collectHistory();
}

/**
 * Scroll down to the bottom of the message list.
 */
function scrollDown() {
    candy.messagesList.scrollIntoView({
        behavior: 'instant',
        block: 'end',
        inline: 'start'
    });
}

/**
 * Add a button to load chat history to the top bar. CSS classes copied
 * from existing token button.
 */
function addHistoryButton() {
    if (document.getElementById(BUTTON_ID) !== null) {
        return;
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('flex');
    buttonContainer.classList.add('items-center');
    buttonContainer.classList.add('gap-x-4');
    
    const buttonInnerContainer = document.createElement('div');
    buttonInnerContainer.classList.add('w-fit');
    buttonInnerContainer.classList.add('relative');
    
    const button = document.createElement('button');
    button.classList.add('flex');
    button.classList.add('px-4');
    button.classList.add('py-1.5');
    button.classList.add('rounded-lg');
    button.classList.add('justify-center');
    button.classList.add('items-center');
    button.classList.add('gap-2')
    button.classList.add('text-white');
    button.classList.add('border');
    button.classList.add('border-white/[.15]');

    button.textContent = 'Load chat history';
    button.setAttribute('id', BUTTON_ID);

    button.addEventListener('click', () => {
        collectHistory();
        button.disabled = true;
        button.style.opacity = .5;
    });

    candy.button = button;

    buttonInnerContainer.appendChild(button);
    buttonContainer.appendChild(buttonInnerContainer);

    try {
        const userMenuContainer = document.querySelector('#user-menu-button').parentElement.parentElement;
        const tokensContainer = userMenuContainer.previousElementSibling;
        tokensContainer.parentElement.insertBefore(buttonContainer, tokensContainer);
    } catch {
    }
}

/**
 * Initialise the plugin and collect the chat history if a message list
 * is found on the page.
 */
function initCandy() {
    candy.pages = 0;
    candy.activeMessageId = null;
    candy.messagesList = document.querySelector('#messages-list');

    if (candy.messagesList !== null) {
        addHistoryButton();
    }
}

/**
 * Parse an input value to a number.
 * @param {any} input Value received from storage API.
 * @param {number} defaultValue Value to use when `input` is not a number.
 * @returns 
 */
function getNumber(input, defaultValue) {
    const parsed = parseInt(input);
    return isNaN(parsed) ? defaultValue : parsed; 
}

/**
 * Retrieve configuration from sync storage.
 */
async function loadConfig() {
    let res = await browser.storage.sync.get('collectPages');
    config.collectPages = getNumber(res.collectPages, 20);

    res = await browser.storage.sync.get('collectAttempts');
    config.collectAttempts = getNumber(res.collectAttempts, 5);

    res = await browser.storage.sync.get('collectInterval');
    config.collectInterval = getNumber(res.collectInterval, 200);
}

/**
 * Startup method for the extension.
 */
async function startUp() {
    // Load the config from the sync storage.
    await loadConfig();

    // Connect to background.js
    browser.runtime.connect({name: 'candy'});

    // Call the init method when the background scripts notices an update in the tab.
    browser.runtime.onMessage.addListener(() => initCandy());

    // Update the config object when a stored value changes.
    browser.storage.onChanged.addListener(changes => {
        if ('collectPages' in changes) {
            config.collectPages = getNumber(changes.collectPages.newValue, config.collectPages);
        }

        if ('collectAttempts' in changes) {
            config.collectAttempts = getNumber(changes.collectAttempts.newValue, config.collectAttempts);
        }

        if ('collectInterval' in changes) {
            config.collectInterval = getNumber(changes.collectInterval.newValue, config.collectInterval);
        }
    });
}

startUp();
