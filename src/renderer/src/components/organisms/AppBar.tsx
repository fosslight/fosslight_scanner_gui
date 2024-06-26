import { FC } from 'react';
import SettingModal from './modal/SettingModal';
import InfoModal from './modal/InfoModal';
import useModal from '@renderer/hooks/useModal';
import {
  AppIcon,
  InfoModalIcon,
  SettingModalIcon,
  AppCloseIcon,
  AppMaximizeIcon,
  AppMinimizeIcon
} from '../atoms/SVGIcons';

const AppBar: FC = () => {
  const { openModal: openSettingModal, modalRef: settingModalRef } = useModal();
  const { openModal: openInfoModal, modalRef: infoModalRef } = useModal();

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
            <AppIcon />
            <div style={{ fontFamily: 'Segoe UI, sans-serif' }} className="title-text">
              FOSSLight Scanner
            </div>
            <div className="h-[16px] w-[1px] bg-PaleGray-400" />
            <div className="version-text">v1.7.22</div>
          </div>

          <div className="control prevent-select flex items-center justify-start">
            <button id="setting" onClick={openSettingModal} className="no-drag">
              <SettingModalIcon />
            </button>
            <button id="info" onClick={openInfoModal} className="no-drag">
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
      <SettingModal modalRef={settingModalRef} />
      <InfoModal modalRef={infoModalRef} />
    </>
  );
};

export default AppBar;
