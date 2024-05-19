document.addEventListener('DOMContentLoaded', () => {
    const proxyToggle = document.getElementById('proxyToggle');
    const jsBlockToggle = document.getElementById('jsBlockToggle');
    const cookieIsolationToggle = document.getElementById('cookieIsolationToggle'); // New cookie isolation toggle
    const i2pLogo = document.getElementById('i2pLogo'); // Get the logo element

    // Retrieve stored settings and update UI
    chrome.storage.local.get(['proxyEnabled', 'jsBlockEnabled', 'cookieIsolationEnabled'], result => {
        proxyToggle.checked = result.proxyEnabled || false;
        jsBlockToggle.checked = result.jsBlockEnabled || false;
        cookieIsolationToggle.checked = result.cookieIsolationEnabled || false; // Set cookie isolation toggle state
    });

    // Event listener for proxy toggle
    proxyToggle.addEventListener('change', () => {
        if (proxyToggle.checked) {
            setProxy();
        } else {
            resetProxy();
        }

        // Update storage with new proxy status
        chrome.storage.local.set({ proxyEnabled: proxyToggle.checked }).then(() => {
            console.log(`Proxy ${proxyToggle.checked ? "enabled" : "disabled"}`);
        }).catch(error => {
            console.error("Error updating proxy setting:", error);
        });
    });

    // Event listener for JavaScript block toggle
    jsBlockToggle.addEventListener('change', () => {
        // Update storage with new JavaScript block status
        chrome.storage.local.set({ jsBlockEnabled: jsBlockToggle.checked }).then(() => {
            console.log(`JavaScript blocking ${jsBlockToggle.checked ? "enabled" : "disabled"}`);
        }).catch(error => {
            console.error("Error updating JavaScript blocking:", error);
        });
    });

    // Event listener for cookie isolation toggle
    cookieIsolationToggle.addEventListener('change', () => {
        // Update storage with new cookie isolation status
        chrome.storage.local.set({ cookieIsolationEnabled: cookieIsolationToggle.checked }).then(() => {
            console.log(`Cookie isolation ${cookieIsolationToggle.checked ? "enabled" : "disabled"}`);
        }).catch(error => {
            console.error("Error updating cookie isolation:", error);
        });
    });

    // Event listener for logo click
    i2pLogo.addEventListener('click', () => {
        // Open a new tab with the I2P router page
        chrome.tabs.create({ url: 'http://127.0.0.1:7657/home' });
    });
});

// Function to set proxy
function setProxy() {
    chrome.proxy.settings.set({
        value: {
            mode: "fixed_servers",
            rules: {
                singleProxy: {
                    scheme: "http",
                    host: "127.0.0.1",
                    port: 4444
                },
                bypassList: ["<local>"]
            }
        },
        scope: "regular"
    }).then(() => {
        // Update storage with proxy enabled status
        chrome.storage.local.set({ proxyEnabled: true });
        console.log("Proxy enabled: 127.0.0.1:4444");
    }).catch(error => {
        console.error("Error enabling proxy:", error);
    });
}

// Function to reset proxy
function resetProxy() {
    chrome.proxy.settings.clear({ scope: "regular" }).then(() => {
        // Update storage with proxy disabled status
        chrome.storage.local.set({ proxyEnabled: false });
        console.log("Proxy disabled");
    }).catch(error => {
        console.error("Error disabling proxy:", error);
    });
}
