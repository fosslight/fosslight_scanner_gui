const { ipcRenderer } = require('electron');
const ipc = ipcRenderer;

var btnMin = document.getElementById('min');
var btnMax = document.getElementById('max');
var btnClose = document.getElementById('close');

btnMin.addEventListener('click', () => {
  ipc.send('minimizeApp');
});
btnMax.addEventListener('click', () => {
  ipc.send('maximizeApp');
});
btnClose.addEventListener('click', () => {
  ipc.send('closeApp');
});
