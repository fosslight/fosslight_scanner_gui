import { FC } from 'react';
import SettingModal from './modal/SettingModal';
import useModal from '@renderer/hooks/useModal';

const AppBar: FC = () => {
  const { openModal, closeModal, modalRef } = useModal();

  const handleClickMinimizeButton = (): void => {
    console.log('client: minimizeApp');
    window.electron.ipcRenderer.send('minimizeApp');
  };

  const handleClickMaximizeButton = (): void => {
    console.log('client: maximizeApp');
    window.electron.ipcRenderer.send('maximizeApp');
  };

  const handleClickCloseButton = (): void => {
    console.log('client: closeApp');
    window.electron.ipcRenderer.send('closeApp');
  };

  return (
    <>
      <div
        className="main-container z-30"
        style={{
          position: 'fixed',
          width: '100%',
          top: 0
        }}
      >
        <div className="title-bar">
          <div className="title prevent-select draggable">
            <img src="./src/assets/titlebar/title-logo.svg" alt="fosslogo" className="title-logo" />
            <div style={{ fontFamily: 'Segoe UI, sans-serif' }} className="title-text">
              FOSSLight Scanner
            </div>
            <img src="./src/assets/titlebar/title-bar-icon.png" />
            <div className="version-text">v1.7.22</div>
          </div>
          <div className="control prevent-select">
            <button id="setting" onClick={openModal}>
              <img src="./src/assets/titlebar/title-setting-icon.png" />
            </button>
            <button id="info">
              <img src="./src/assets/titlebar/title-info-icon.png" />
            </button>
            <img src="./src/assets/titlebar/title-bar-icon.png" />
            <button onClick={handleClickMinimizeButton}>
              <img src="./src/assets/titlebar/title-min-icon.png" alt="minimize" />
            </button>
            <button onClick={handleClickMaximizeButton}>
              <img src="./src/assets/titlebar/title-max-icon.png" alt="max" />
            </button>
            <button onClick={handleClickCloseButton}>
              <img src="./src/assets/titlebar/title-close-icon.png" alt="close" />
            </button>
          </div>
        </div>
      </div>
      <SettingModal modalRef={modalRef} />
    </>
  );
};

export default AppBar;
