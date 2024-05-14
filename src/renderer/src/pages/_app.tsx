import { FC } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AppBar from '@renderer/components/organisms/AppBar';
import Main from '@renderer/pages/index';
import { ModeProvider } from '@renderer/context/ModeContext';
import '@renderer/styles/index.css';

const App: FC = () => {
  return (
    <Router>
      <div className="fixed h-full w-full">
        <AppBar />
        <ModeProvider>
          <Routes>
            <Route path="/" element={<Main />} />
          </Routes>
        </ModeProvider>
      </div>
    </Router>
  );
};

export default App;
