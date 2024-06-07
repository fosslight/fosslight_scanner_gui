import { FC } from 'react';
import SettingModal from './modal/SettingModal';
import InfoModal from './modal/InfoModal';
import useModal from '@renderer/hooks/useModal';
import {
  InfoModalIcon,
  SettingModalIcon,
  AppCloseIcon,
  AppMaximizeIcon,
  AppMinimizeIcon
} from '../atoms/SVGIcons';

const AppBar: FC = () => {
  const { openModal, closeModal, modalRef, modalType } = useModal();

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
        className="main-container draggable z-40"
        style={{
          position: 'fixed',
          width: '100%',
          top: 0
        }}
      >
        <div className="title-bar draggable flex items-center justify-between">
          <div className="title prevent-select draggable flex items-center justify-start gap-2 px-4 pb-0.5">
            <img src="./src/assets/titlebar/title-logo.svg" alt="fosslogo" className="title-logo" />
            <div style={{ fontFamily: 'Segoe UI, sans-serif' }} className="title-text">
              FOSSLight Scanner
            </div>
            <div className="h-[16px] w-[1px] bg-PaleGray-400" />
            <div className="version-text">v1.7.22</div>
          </div>

          <div className="control prevent-select flex items-center justify-start">
            <button id="setting" onClick={() => openModal('setting')} className="no-drag">
              <SettingModalIcon />
            </button>
            <button id="info" onClick={() => openModal('info')} className="no-drag">
              <InfoModalIcon />
            </button>
            <div className="ml-2 h-[16px] w-[1px] bg-PaleGray-400" />
            <button onClick={handleClickMinimizeButton} className="no-drag">
              <AppMinimizeIcon />
            </button>
            <button onClick={handleClickMaximizeButton} className="no-drag">
              <AppMaximizeIcon />
            </button>
            <button onClick={handleClickCloseButton} className="no-drag">
              <AppCloseIcon />
            </button>
          </div>
        </div>
      </div>
      {modalType === 'setting' && <SettingModal modalRef={modalRef} />}
      {modalType === 'info' && <InfoModal modalRef={modalRef} />}
    </>
  );
};

export default AppBar;
