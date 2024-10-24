const AUTH_COOKIE_NAME = 'session';
const AUTH_COOKIE_DOMAIN = 'https://www.recipes.christianland.dev';
const PERMISSIONS = {
    permissions: ["cookies", "tabs"],
    origins: [AUTH_COOKIE_DOMAIN + "/*"]
};

function checkAuthStatus(cb) {
    browser.cookies
        .get({ name: AUTH_COOKIE_NAME, url: AUTH_COOKIE_DOMAIN })
        .then(cookie => cb(!!cookie));
}

function checkPermissions(cb) {
    browser.permissions
        .contains(PERMISSIONS)
        .then(cb)
        .catch(() => cb(false));
}

function requestPermissions(cb) {
    browser.permissions
        .request(PERMISSIONS)
        .then(cb)
        .catch(() => cb(false));
}

function getActiveTabUrl() {
    return browser.tabs
        .query({ active: true, currentWindow: true })
        .then(tabs => {
            if (tabs.length > 0) {
                return tabs[0].url;
            }
            throw new Error('No active tab found');
        });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case "checkPermissions":
            checkPermissions(hasPermissions => {
                sendResponse({ hasPermissions });
            })
            break;
        case "checkAuth":
            checkPermissions(hasPermissions => {
                if (hasPermissions) {
                    checkAuthStatus(isAuthenticated => sendResponse({ isAuthenticated }));
                } else {
                    sendResponse({ isAuthenticated: false, error: "Missing permissions" })
                }
            });
            break;
        case "makePostRequest":
            getActiveTabUrl()
                .then((activeTabUrl) => {
                    return fetch(AUTH_COOKIE_DOMAIN + "/api/recipes?extract=true", {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ url: activeTabUrl })
                    });
                })
                .then(response => response.json())
                .then(data => {
                    sendResponse({ success: true, data });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            break;
        case "getLoggedUser":
            fetch(AUTH_COOKIE_DOMAIN + "/api/auth", { credentials: "include" })
                .then(response => response.json())
                .then(data => {
                    sendResponse({ success: true, data });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            break;
    }
    return true;
});
