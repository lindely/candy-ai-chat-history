browser.runtime.onConnect.addListener(p => {
    if (p.name !== 'candy') {
        return;
    }

    const tabId = p.sender.tab.id;

    browser.tabs.onUpdated.addListener(
        () => browser.tabs.sendMessage(tabId, {updated: true}),
    );
});