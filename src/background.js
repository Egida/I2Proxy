// Initialize variables to control JavaScript blocking, proxy status, and cookie isolation
let isBlockingJS = false;
let isProxyEnabled = false;
let isCookieIsolationEnabled = false;

// Function to update JavaScript blocking status and log the change
function updateJSBlockStatus(jsBlockEnabled) {
    isBlockingJS = jsBlockEnabled;
    console.log(`JavaScript blocking ${jsBlockEnabled ? "enabled" : "disabled"}`);
}

// Function to update cookie isolation status and log the change
function updateCookieIsolationStatus(cookieIsolationEnabled) {
    isCookieIsolationEnabled = cookieIsolationEnabled;
    console.log(`Cookie isolation ${cookieIsolationEnabled ? "enabled" : "disabled"}`);
}

// Function to block JavaScript requests based on settings
function blockJavaScript(details) {
    if (isBlockingJS && details.type === "script") {
        console.log(`Blocking JavaScript: ${details.url}`);
        return { cancel: true };
    } else {
        console.log(`Allowing: ${details.url}`);
        return { cancel: false };
    }
}

// Add listener to block JavaScript requests before they are sent
chrome.webRequest.onBeforeRequest.addListener(
    blockJavaScript,
    { urls: ["<all_urls>"] },
    ["blocking"]
);

// Custom user-agent to be used in requests
const CUSTOM_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0";

// Modify request headers before sending
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        let modifiedHeaders = details.requestHeaders;
        if (isBlockingJS) {
            // Filter out certain headers when JavaScript blocking is enabled
            modifiedHeaders = modifiedHeaders.filter(header =>
                header.name.toLowerCase() !== "dnt" &&
                header.name.toLowerCase() !== "sec-gpc" &&
                header.name.toLowerCase() !== "priority"
            );
            // Replace Accept-Encoding header with gzip, deflate, br
            const acceptEncodingHeaderIndex = modifiedHeaders.findIndex(header =>
                header.name.toLowerCase() === "accept-encoding"
            );
            if (acceptEncodingHeaderIndex !== -1) {
                modifiedHeaders[acceptEncodingHeaderIndex].value = "gzip, deflate, br";
            } else {
                modifiedHeaders.push({ name: "Accept-Encoding", value: "gzip, deflate, br" });
            }
        }
        // Modify user-agent
        const userAgentHeaderIndex = modifiedHeaders.findIndex(header =>
            header.name.toLowerCase() === "user-agent"
        );
        if (userAgentHeaderIndex !== -1) {
            modifiedHeaders[userAgentHeaderIndex].value = CUSTOM_USER_AGENT;
        } else {
            modifiedHeaders.push({ name: "User-Agent", value: CUSTOM_USER_AGENT });
        }
        // Modify Accept header
        const acceptHeaderIndex = modifiedHeaders.findIndex(header =>
            header.name.toLowerCase() === "accept"
        );
        if (acceptHeaderIndex !== -1) {
            modifiedHeaders[acceptHeaderIndex].value = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
        } else {
            modifiedHeaders.push({ name: "Accept", value: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" });
        }
        // Clear cookies if isolation is enabled
        if (isCookieIsolationEnabled) {
            chrome.cookies.getAll({}, function(cookies) {
                for (let i = 0; i < cookies.length; i++) {
                    chrome.cookies.remove({
                        url: details.url + cookies[i].path,
                        name: cookies[i].name
                    });
                }
            });
        }
        return { requestHeaders: modifiedHeaders };
    },
    { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders"]
);

// Function to determine proxy settings based on URL and global proxy status
chrome.proxy.onRequest.addListener(
    (details) => {
        const url = new URL(details.url);
        if (url.hostname.endsWith(".i2p")) {
            return {
                type: "http",
                host: "127.0.0.1",
                port: 4444
            };
        } else if (url.hostname === "127.0.0.1") {
            console.log(`Allowing request to localhost: ${details.url}`);
            return { type: "direct" };
        } else if (isProxyEnabled) {
            return {
                type: "http",
                host: "127.0.0.1",
                port: 4444
            };
        }
        return { type: "direct" };
    },
    { urls: ["<all_urls>"] }
);

// Function to update proxy status and log the change
function updateProxyStatus(proxyEnabled) {
    isProxyEnabled = proxyEnabled;
    console.log(`Proxy ${proxyEnabled ? "enabled" : "disabled"}`);
}

// Listener for extension installation, updates proxy, JavaScript blocking, and cookie isolation settings
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed…");
    chrome.storage.local.get(["proxyEnabled", "jsBlockEnabled", "cookieIsolationEnabled"], (result) => {
        updateProxyStatus(result.proxyEnabled);
        updateJSBlockStatus(result.jsBlockEnabled);
        updateCookieIsolationStatus(result.cookieIsolationEnabled);
    });
});

// Listener for changes in storage, updates proxy, JavaScript blocking, and cookie isolation settings accordingly
chrome.storage.onChanged.addListener((changes, areaName) => {
    console.log("Storage changed…");
    if (changes.hasOwnProperty("proxyEnabled")) {
        updateProxyStatus(changes.proxyEnabled.newValue);
    }
    if (changes.hasOwnProperty("jsBlockEnabled")) {
        updateJSBlockStatus(changes.jsBlockEnabled.newValue);
    }
    if (changes.hasOwnProperty("cookieIsolationEnabled")) {
        updateCookieIsolationStatus(changes.cookieIsolationEnabled.newValue);
    }
});

// Function to initialize settings on extension startup
function initializeSettings() {
    chrome.storage.local.get(["proxyEnabled", "jsBlockEnabled", "cookieIsolationEnabled"], (result) => {
        updateProxyStatus(result.proxyEnabled);
        updateJSBlockStatus(result.jsBlockEnabled);
        updateCookieIsolationStatus(result.cookieIsolationEnabled);
    });
}

// Ensure settings are initialized when the extension starts
initializeSettings();
