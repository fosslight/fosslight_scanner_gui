import { FC } from 'react';
import SettingModal from './modal/SettingModal';
import InfoModal from './modal/InfoModal';
import useModal from '@renderer/hooks/useModal';

const AppBar: FC = () => {
  const { openModal, closeModal, modalRef, modalType } = useModal();

  const handleClickMinimizeButton = (): void => {
    window.nativeApi.minimizeApp();
  };

  const handleClickMaximizeButton = (): void => {
    window.nativeApi.maximizeApp();
  };

  const handleClickCloseButton = (): void => {
    window.nativeApi.closeApp();
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
            <div className="h-[0px] w-3 origin-top-left rotate-90 border border-PaleGray-300"></div>
            <div className="version-text">v1.7.22</div>
          </div>

          <div className="control prevent-select ">
            <button id="setting" onClick={() => openModal('setting')} className="no-drag">
              <img src="./src/assets/titlebar/title-setting-icon.png" />
            </button>
            <button id="info" onClick={() => openModal('info')} className="no-drag">
              <img src="./src/assets/titlebar/title-info-icon.png" />
            </button>
            <div className="h-[0px] w-3 origin-top-left rotate-90 border border-PaleGray-300"></div>
            <button onClick={handleClickMinimizeButton} className="no-drag">
              <img src="./src/assets/titlebar/title-min-icon.png" alt="minimize" />
            </button>
            <button onClick={handleClickMaximizeButton} className="no-drag">
              <img src="./src/assets/titlebar/title-max-icon.png" alt="max" />
            </button>
            <button onClick={handleClickCloseButton} className="no-drag">
              <img src="./src/assets/titlebar/title-close-icon.png" alt="close" />
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
