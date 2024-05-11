import { FC } from 'react';
import Button from '../atoms/button/Button';
import { useMode } from '@renderer/hooks/useMode';

const ButtonBar: FC = () => {
  const { mode } = useMode();
  return (
    <div className="flex h-11 items-center justify-end gap-2 border-t border-t-PaleGray-300 px-4">
      <Button type="primary">Start {mode === 'analyze' ? 'Analysis' : 'Comparing'}</Button>
      <Button type="secondary">Force Quit</Button>
      <Button type="tertiary">Open storage path</Button>
    </div>
  );
};

export default ButtonBar;
