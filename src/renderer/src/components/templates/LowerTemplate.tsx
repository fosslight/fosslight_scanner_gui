import { FC } from 'react';
import ButtonBar from '../organisms/ButtonBar';
import LogBox from '../organisms/LogBox';
import SignBox from '../organisms/SignBox';
import useModal from '@renderer/hooks/useModal';
import Modal from '../organisms/modal/Modal';
import Button from '../atoms/button/Button';
import useCommandConfig from '@renderer/hooks/useCommandConfig';
import useMode from '@renderer/hooks/useMode';

const LowerTemplate: FC = () => {
  const { mode } = useMode();
  const { readyToAnalyze, readyToCompare } = useCommandConfig();
  const { openModal, closeModal, modalRef } = useModal();

  const handleForceQuit = () => {
    openModal();
  };

  const showButtonBar = mode === 'analyze' ? readyToAnalyze : readyToCompare;

  return (
    <div>
      {showButtonBar && <ButtonBar onForceQuit={handleForceQuit} />}
      <div className="flex h-80 flex-row">
        <LogBox />
        <SignBox />
      </div>
      <Modal
        modalRef={modalRef}
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
