document.addEventListener('DOMContentLoaded', () => {
    const status = document.getElementById('status');
    const saveBtn = document.getElementById('save-button');
    const link = document.getElementById('link');
    const reqPermsBtn = document.getElementById('request-permissions');
    const spinner = document.getElementById("spinner");

    browser.runtime
        .sendMessage({ action: "checkPermissions" })
        .then(res => {
            if (!res.hasPermissions) {
                status.textContent = 'Missing required permissions.';
                reqPermsBtn.style.display = 'block';
            } else {
                checkAuthenticated();
            }
        })

    function getLoggedUser() {
        spinner.style.display = "block";
        browser.runtime
            .sendMessage({ action: "getLoggedUser" })
            .then(res => {
                if (res.success) {
                    status.textContent = `Welcome ${res.data.username}.`;
                    saveBtn.style.display = 'block';
                } else {
                    status.textContent = "Failed to get username";
                }
            })
            .finally(() => {
                spinner.style.display = "none";
            });
    }

    function checkAuthenticated() {
        spinner.style.display = "block";
        browser.runtime
            .sendMessage({ action: 'checkAuth' })
            .then(res => {
                if (res.isAuthenticated) {
                    getLoggedUser();
                } else {
                    status.textContent = 'You are not logged in.';
                    link.style.display = 'block';
                }
            })
            .finally(() => {
                spinner.style.display = "none";
            });
    }

    reqPermsBtn.addEventListener('click', () => {
        const permissionsToRequest = {
            permissions: ["cookies", "tabs"],
            origins: [`https://www.recipes.christianland.dev/*`]
        };
        spinner.style.display = "block";
        browser.permissions
            .request(permissionsToRequest)
            .then(granted => {
                if (granted) {
                    status.textContent = 'Permissions granted. Please refresh.';
                    reqPermsBtn.style.display = 'none';
                } else {
                    status.textContent = 'Permissions not granted.';
                }
            })
            .catch((error) => {
                console.error("Error requesting permissions:", error);
                status.textContent = 'Error requesting permissions.';
            })
            .finally(() => {
                spinner.style.display = "none";
            });
    });

    saveBtn.addEventListener('click', () => {
        saveBtn.disabled = true;
        status.textContent = "Extracting Recipe...";
        spinner.style.display = "block";
        saveBtn.style.display = "none";
        browser.runtime
            .sendMessage({ action: 'makePostRequest' })
            .then(res => {
                if (res.success && res.data?.id) {
                    status.textContent = "Saved successfully!";
                    link.style.display = "block";
                    link.href = `https://www.recipes.christianland.dev/recipes/${res.data.id}`;
                    link.textContent = "View";
                } else {
                    status.textContent = "Failed to extract Recipe";
                }
            })
            .finally(() => {
                spinner.style.display = "none";
            });
    });
});

