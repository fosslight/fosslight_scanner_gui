window.electron.ipcRenderer.on('execute-command', (event, { command, args }) => {
  console.log('Executing command:', command, args);
});
