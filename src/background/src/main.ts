if (window !== undefined) {
  window.addEventListener('DOMContentLoaded', () => {
    if (window.hiddenApi) {
      window.hiddenApi.onCommand((command) => {
        console.log('Received command:', command);
        window.hiddenApi.sendLog(command);
      });
    } else {
      console.error('hiddenApi is not available.');
    }
  });
}
