import { FC, useEffect } from 'react';
import ButtonBar from '../organisms/ButtonBar';
import LogBox from '../organisms/LogBox';
import SignBox from '../organisms/SignBox';
import useModal from '@renderer/hooks/useModal';
import Modal from '../organisms/modal/Modal';
import Button from '../atoms/button/Button';
import { ExclamationIcon } from '../atoms/SVGIcons';
import useCommandConfig from '@renderer/hooks/useCommandConfig';
import useMode from '@renderer/hooks/useMode';
import useCommandManager from '@renderer/hooks/useCommandManager';

const LowerTemplate: FC = () => {
  const { mode } = useMode();
  const { analyzeCommandConfig, compareCommandConfig, readyToAnalyze, readyToCompare } =
    useCommandConfig();
  const { result, log } = useCommandManager();
  const forceQuitModal = useModal();
  const successfulModal = useModal();
  const failedModal = useModal();

  const handleForceQuitClick = () => {
    forceQuitModal.openModal();
  };

  const handleForceQuit = () => {
    window.api.forceQuit();
    forceQuitModal.closeModal();
  };

  const handleOpenStoragePathClick = () => {
    window.nativeApi.openFileExplorer(
      (mode === 'analyze' ? analyzeCommandConfig.outputPath : compareCommandConfig.outputPath) ??
        './'
    );
  };

  useEffect(() => {
    if (result) {
      forceQuitModal.closeModal();
      if (result.success) {
        successfulModal.openModal();
      } else {
        if (!result.message?.startsWith('scan is stopped')) {
          // TODO: Modify the interface of CommandResponse
          failedModal.openModal();
        }
      }
    }
  }, [result]);

  const showButtonBar = mode === 'analyze' ? readyToAnalyze : readyToCompare;

  return (
    <div>
      {showButtonBar && <ButtonBar onForceQuitClick={handleForceQuitClick} />}
      <div className="flex h-80 flex-row">
        <LogBox />
        <SignBox />
      </div>
      <Modal
        modalRef={forceQuitModal.modalRef}
        title={`Are you sure you want to force quit the ${mode === 'analyze' ? 'analysis' : 'comparison'}?`}
        icon={<ExclamationIcon />}
        content={`The details, including the ${mode === 'analyze' ? 'analysis' : 'comparison'} list you have added, will be maintained.`}
        buttons={[
          <Button key="force-quit" type="secondary" onClick={handleForceQuit}>
            Force Quit
          </Button>,
          <Button key="keep-analyze" type="tertiary" onClick={forceQuitModal.closeModal}>
            Keep Analyze
          </Button>
        ]}
      />
      <Modal
        modalRef={successfulModal.modalRef}
        title={`${mode === 'analyze' ? 'Analysis' : 'Comparison'} Successfully completed!`}
        icon={<ExclamationIcon />}
        content={`If you want to view the ${mode === 'analyze' ? 'analysis' : 'comparison'} results, please open the storage path to check.`}
        buttons={[
          <Button key="close" type="tertiary" onClick={successfulModal.closeModal}>
            Go Back to Start
          </Button>,
          <Button key="open-storage" type="primary" onClick={handleOpenStoragePathClick}>
            Open Storage Path
          </Button>
        ]}
      />
      <Modal
        modalRef={failedModal.modalRef}
        title={`${mode === 'analyze' ? 'Analysis' : 'Comparison'} failed due to an error.`}
        icon={<ExclamationIcon />}
        content="Please try again or contact the support center for assistance."
        buttons={[
          <Button key="support-center" type="tertiary">
            Contact Support Center
          </Button>,
          <Button key="close" type="primary" onClick={failedModal.closeModal}>
            Try Again
          </Button>
        ]}
      />
    </div>
  );
};

export default LowerTemplate;
