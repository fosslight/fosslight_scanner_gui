import Text from '../../atoms/text/Text';
import ScannerSetting from '../../molecules/ScannerSetting';
import TokenSetting from '../../molecules/TokenSetting';
import SideBar from '../../molecules/SideBar';
import { FC, RefObject, useState } from 'react';

interface ISettingModalProps {
  modalRef: RefObject<HTMLDialogElement>;
}

const SettingModal: FC<ISettingModalProps> = ({ modalRef }) => {
  const [activeSetting, setActiveSetting] = useState<'scanner' | 'token'>('scanner');

  const handleCloseModal = () => {
    modalRef.current?.close();
  };

  const Header: FC = () => (
    <div className="flex h-9 items-center justify-between border-b border-b-PaleGray-300 bg-PaleGray-50 px-4">
      <div className="flex items-center gap-[6px]">
        <img className="h-4 w-4" src="/src/assets/icons/cog.svg" alt="settings" />
        <Text type="p200-r" color="PaleGray-600">
          Settings
        </Text>
      </div>
      <button onClick={handleCloseModal}>
        <img className="h-5 w-5" src="/src/assets/icons/x-small.svg" alt="close" />
      </button>
    </div>
  );

  return (
    <dialog ref={modalRef}>
      <div className="fixed top-1/2 z-30 flex h-[540px] w-[75%] max-w-[960px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow">
        <Header />
        <div className="flex h-full">
          <SideBar activeTab={activeSetting} onChangeTab={setActiveSetting} />
          <div className="flex-grow p-3">
            {activeSetting === 'scanner' && <ScannerSetting />}
            {activeSetting === 'token' && <TokenSetting />}
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-20 bg-[#454E5D] bg-opacity-40" onClick={handleCloseModal} />
    </dialog>
  );
};

export default SettingModal;
