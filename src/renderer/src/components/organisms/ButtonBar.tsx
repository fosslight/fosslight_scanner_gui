import { FC } from 'react';
import Button from '../atoms/button/Button';
import useMode from '@renderer/hooks/useMode';
import useCommandManager from '@renderer/hooks/useCommandManager';

interface IButtonBarProps {
  onForceQuit: () => void;
}

const ButtonBar: FC<IButtonBarProps> = ({ onForceQuit }) => {
  const { mode } = useMode();
  const { analyze, compare } = useCommandManager();

  const handleExecuteClick = async () => {
    if (mode === 'analyze') {
      const result = await analyze();
    } else {
      const result = await compare();
    }
  };

  return (
    <div className="flex h-11 items-center justify-end gap-2 border-t border-t-PaleGray-300 px-4">
      <Button type="primary" onClick={handleExecuteClick}>
        Start {mode === 'analyze' ? 'Analysis' : 'Comparing'}
      </Button>
      <Button type="secondary" onClick={onForceQuit}>
        Force Quit
      </Button>
      <Button type="tertiary">Open storage path</Button>
    </div>
  );
};

export default ButtonBar;
