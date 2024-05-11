window.electron.ipcRenderer.on('recv-command', (_, message) => {
  console.log('Received command result:', message);
  window.electron.ipcRenderer.send('send-log', { log: message });
});
