import Versions from '../components/Versions';
import electronLogo from './assets/electron.svg';
import useCommandManager from '../hooks/useCommandManager';
import { useState } from 'react';
import '../../index.css';
import Page from '@renderer/components/temp';

function App(): JSX.Element {
  const commandManager = useCommandManager();
  const [message, setMessage] = useState<string | null>(null);

  const handleClickCompareButton = async (): Promise<void> => {
    const res = await commandManager.compare({
      reports: ['path/to/report1', 'path/to/report2']
    });

    if (res.success) {
      setMessage(res.message!);
    } else {
      setMessage(res.message!);
    }
  };

  const handleClickAnalyzeButton = async (): Promise<void> => {
    const res = await commandManager.analyze({
      mode: ['source', 'binary', 'dependency'],
      path: ['.'],
      outputFormat: 'xlsx',
      outputPath: '.',
      outputFileName: 'output',
      extraOptions: ''
    });

    if (res.success) {
      setMessage(res.message!);
    } else {
      setMessage(res.message!);
    }
  };

  const handleClickMinimizeButton = (): void => {
    console.log('client: minimizeApp');
    window.electron.ipcRenderer.send('minimizeApp');
  };

  const handleClickMaximizeButton = (): void => {
    console.log('client: maximizeApp');
    window.electron.ipcRenderer.send('maximizeApp');
  };

  const handleClickCloseButton = (): void => {
    console.log('client: closeApp');
    window.electron.ipcRenderer.send('closeApp');
  };

  return (
    <>
      <div
        className="main-container"
        style={{
          position: 'fixed',
          width: '100%',
          top: 0
        }}
      >
        <div className="title-bar">
          <div className="title prevent-select draggable">
            <img src="./src/assets/titlebar/title-logo.svg" alt="fosslogo" className="title-logo" />
            <div style={{ fontFamily: 'Segoe UI, sans-serif' }} className="title-text">
              FOSSLight Scanner
            </div>
            <img src="./src/assets/titlebar/title-bar-icon.png" />
            <div className="version-text">v1.7.22</div>
          </div>
          <div className="control prevent-select">
            <button id="setting">
              <img src="./src/assets/titlebar/title-setting-icon.png" />
            </button>
            <button id="info">
              <img src="./src/assets/titlebar/title-info-icon.png" />
            </button>
            <img src="./src/assets/titlebar/title-bar-icon.png" />
            <button onClick={handleClickMinimizeButton}>
              <img src="./src/assets/titlebar/title-min-icon.png" alt="minimize" />
            </button>
            <button onClick={handleClickMaximizeButton}>
              <img src="./src/assets/titlebar/title-max-icon.png" alt="max" />
            </button>
            <button onClick={handleClickCloseButton}>
              <img src="./src/assets/titlebar/title-close-icon.png" alt="close" />
            </button>
          </div>
        </div>
      </div>
      <div className="actions">
        {/*<div className="action">
          <a target="_blank" rel="noreferrer" onClick={handleClickAnalyzeButton}>
            Send Analyze Command
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={handleClickCompareButton}>
            Send Compare Command
          </a>
      </div>*/}
        <Page />
      </div>
      <div className="text">{commandManager.result}</div>
      <div className="text">{commandManager.log}</div>
    </>
  );
}

export default App;
