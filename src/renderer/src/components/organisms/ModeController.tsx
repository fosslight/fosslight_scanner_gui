import { FC, useState } from 'react';
import Toggle from '../atoms/toggle/Toggle';
import { useMode } from '@renderer/hooks/useMode';

const ModeController: FC = () => {
  const { mode, setMode } = useMode();

  const handleToggle = (isToggled: boolean) => {
    setMode(isToggled ? 'compare' : 'analyze');
  };

  return (
    <div className="flex flex-row items-center justify-start gap-2">
      <Toggle type="for-mode" onToggle={handleToggle} />
      <div className="text-neutral-800 font-['Spoqa Han Sans Neo'] text-2xl font-medium">
        {mode === 'analyze' ? 'Scan Mode' : 'Compare Mode'}
      </div>
    </div>
  );
};

export default ModeController;
