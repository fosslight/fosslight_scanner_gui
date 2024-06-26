import { FC } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AppBar from '@renderer/components/organisms/AppBar';
import Main from '@renderer/pages/index';
import '@renderer/styles/index.css';
import AppProvider from '@renderer/context/AppProvider';
import { ModeProvider } from '@renderer/context/ModeContext';
import { CommandProvider } from '@renderer/context/CommandContext';

const App: FC = () => {
  return (
    <div className="fixed h-full w-full">
      <AppBar />
      <AppProvider providers={[ModeProvider, CommandProvider]}>
        <Main />
      </AppProvider>
    </div>
  );
};

export default App;
