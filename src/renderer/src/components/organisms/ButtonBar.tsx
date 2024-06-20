import { FC } from 'react';
import Button from '../atoms/button/Button';
import useMode from '@renderer/hooks/useMode';
import useCommandManager from '@renderer/hooks/useCommandManager';
import useCommandConfig from '@renderer/hooks/useCommandConfig';

interface IButtonBarProps {
  onForceQuitClick: () => void;
}

const ButtonBar: FC<IButtonBarProps> = ({ onForceQuitClick }) => {
  const { mode } = useMode();
  const { idle, log, analyze, compare, clearLog } = useCommandManager();
  const { analyzeCommandConfig, compareCommandConfig } = useCommandConfig();

  const handleExecuteClick = () => {
    if (mode === 'analyze') {
      analyze();
    } else {
      compare();
    }
  };

  const handleOpenStoragePathClick = () => {
    window.nativeApi.openFileExplorer(
      (mode === 'analyze' ? analyzeCommandConfig.outputPath : compareCommandConfig.outputPath) ??
        './'
    );
  };

  const handleClearLogClick = () => {
    clearLog();
  };

  return (
    <div className="flex h-11 items-center justify-end gap-2 border-t border-t-PaleGray-300 px-4">
      {idle ? (
        <>
          <Button type="primary" onClick={handleExecuteClick}>
            Start {mode === 'analyze' ? 'Analysis' : 'Comparing'}
          </Button>
          {log && (
            <Button type="tertiary" onClick={handleClearLogClick}>
              Clear Log
            </Button>
          )}
        </>
      ) : (
        <>
          <Button type="secondary" onClick={onForceQuitClick}>
            Force Quit
          </Button>
          <Button type="tertiary" onClick={handleOpenStoragePathClick}>
            Open storage path
          </Button>
        </>
      )}
    </div>
  );
};

export default ButtonBar;
