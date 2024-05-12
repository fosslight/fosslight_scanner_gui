import { FC } from 'react';
import ButtonBar from '../organisms/ButtonBar';
import LogBox from '../organisms/LogBox';
import SignBox from '../organisms/SignBox';
import useModal from '@renderer/hooks/useModal';
import Modal from '../atoms/modal/Modal';

const LowerTemplate: FC = () => {
  const { openModal, closeModal, modalRef } = useModal();

  const handleForceQuit = () => {
    openModal();
  };

  return (
    <>
      <div>
        <ButtonBar onForceQuit={handleForceQuit} />
        <div className="flex h-80 flex-row">
          <LogBox />
          <SignBox />
        </div>
      </div>
      <Modal modalRef={modalRef} title="title" />
    </>
  );
};

export default LowerTemplate;
