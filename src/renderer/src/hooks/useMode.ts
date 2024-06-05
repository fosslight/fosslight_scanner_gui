import { useContext } from 'react';
import ModeContext, { IModeContext } from '@renderer/context/ModeContext';

const useMode = (): IModeContext => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider.');
  }
  return context;
};

export default useMode;
