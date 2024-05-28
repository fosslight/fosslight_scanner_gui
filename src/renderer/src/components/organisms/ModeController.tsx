import { FC } from 'react';
import Toggle from '../atoms/toggle/Toggle';
import useMode from '@renderer/hooks/useMode';
import Text from '../atoms/text/Text';

const ModeController: FC = () => {
  const { mode, setMode } = useMode();

  const handleToggle = (toggled: boolean) => {
    setMode(toggled ? 'compare' : 'analyze');
  };

  return (
    <div className="flex flex-row items-center justify-start gap-2">
      <Toggle type="for-mode" toggled={mode === 'compare'} onToggle={handleToggle} />
      <Text type="p600-m" color="PaleGray-1000">
        {mode === 'analyze' ? 'Scan Mode' : 'Compare Mode'}
      </Text>
    </div>
  );
};

export default ModeController;
