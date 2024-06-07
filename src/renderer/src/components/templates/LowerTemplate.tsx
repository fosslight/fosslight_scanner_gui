import { FC } from 'react';
import ButtonBar from '../organisms/ButtonBar';
import LogBox from '../organisms/LogBox';
import SignBox from '../organisms/SignBox';
import useModal from '@renderer/hooks/useModal';
import Modal from '../organisms/modal/Modal';
import Button from '../atoms/button/Button';
import { ExclamationIcon } from '../atoms/SVGIcons';

interface ILowerTemplateProps {
  data?: any;
}

const LowerTemplate: FC<ILowerTemplateProps> = ({ data }) => {
  // const { log, commandResult } = data;

  const { openModal, closeModal, modalRef } = useModal();

  const handleForceQuit = () => {
    openModal();
  };

  return (
    <div>
      <ButtonBar onForceQuit={handleForceQuit} />
      <div className="flex h-80 flex-row">
        <LogBox />
        <SignBox />
      </div>
      <Modal
        modalRef={modalRef}
        modalicon=<ExclamationIcon />
        title="Would you sure to force quit the analysis?"
        content="The details such as the analysis list that you've added will be maintained."
        buttons={[
          <Button key="force-quit" type="secondary">
            Force Quit
          </Button>,
          <Button key="keep-analyze" type="tertiary" onClick={closeModal}>
            Keep analyze
          </Button>
        ]}
      />
    </div>
  );
};

export default LowerTemplate;
