import { FC } from 'react';
import AppBar from '@renderer/components/organisms/AppBar';
import Main from '@renderer/pages/index';
import '@renderer/styles/index.css';
import AppProvider from '@renderer/context/AppProvider';
import { ModeProvider } from '@renderer/context/ModeContext';
import { CommandProvider } from '@renderer/context/CommandContext';
import useAppReady from '@renderer/hooks/useAppReady';
import AppInitializer from '@renderer/components/organisms/AppInitializer';

const App: FC = () => {
  const { appReady } = useAppReady();

  return !appReady ? (
    <AppInitializer />
  ) : (
    <div className="fixed h-full w-full">
      <AppBar />
      <AppProvider providers={[ModeProvider, CommandProvider]}>
        <Main />
      </AppProvider>
    </div>
  );
};

export default App;
