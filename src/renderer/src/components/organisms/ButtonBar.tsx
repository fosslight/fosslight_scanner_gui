import { FC } from 'react';
import Button from '../atoms/button/Button';
import useMode from '@renderer/hooks/useMode';
import useCommandManager from '@renderer/hooks/useCommandManager';

interface IButtonBarProps {
  onForceQuitClick: () => void;
}

const ButtonBar: FC<IButtonBarProps> = ({ onForceQuitClick }) => {
  const { mode } = useMode();
  const { analyze, compare, idle } = useCommandManager();

  const handleExecuteClick = () => {
    if (mode === 'analyze') {
      analyze();
    } else {
      compare();
    }
  };

  return (
    <div className="flex h-11 items-center justify-end gap-2 border-t border-t-PaleGray-300 px-4">
      {idle ? (
        <Button type="primary" onClick={handleExecuteClick}>
          Start {mode === 'analyze' ? 'Analysis' : 'Comparing'}
        </Button>
      ) : (
        <>
          <Button type="secondary" onClick={onForceQuitClick}>
            Force Quit
          </Button>
          <Button type="tertiary">Open storage path</Button>
        </>
      )}
    </div>
  );
};

export default ButtonBar;
