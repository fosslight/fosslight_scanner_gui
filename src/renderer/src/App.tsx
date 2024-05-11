import Versions from './components/Versions';
import electronLogo from './assets/electron.svg';
import useCommandManager from './hooks/useCommandManager';
import { useState } from 'react';

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

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={handleClickAnalyzeButton}>
            Send Analyze Command
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={handleClickCompareButton}>
            Send Compare Command
          </a>
        </div>
      </div>
      {commandManager.result && <div className="text">{commandManager.result}</div>}
      {commandManager.log && <div className="text">{JSON.stringify(commandManager.log)}</div>}
      <Versions></Versions>
    </>
  );
}

export default App;
