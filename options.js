async function saveOptions(e) {
  e.preventDefault();
  await browser.storage.sync.set({
    collectPages: document.querySelector('#collectPages').value,
    collectAttempts: document.querySelector('#collectAttempts').value,
    collectInterval: document.querySelector('#collectInterval').value
  });
}

async function restoreOptions() {
  let res = await browser.storage.sync.get('collectPages');
  document.querySelector('#collectPages').value = res.collectPages || 20;

  res = await browser.storage.sync.get('collectAttempts');
  document.querySelector('#collectAttempts').value = res.collectAttempts || 5;

  res = await browser.storage.sync.get('collectInterval');
  document.querySelector('#collectInterval').value = res.collectInterval || 200;
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('form').addEventListener('submit', saveOptions);