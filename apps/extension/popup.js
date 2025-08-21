document.getElementById('openConsole').addEventListener('click', async () => {
  // TODO: set your real Console URL here
  const url = 'https://helios.localhost/console';
  await chrome.tabs.create({ url });
});