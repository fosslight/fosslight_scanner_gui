import { FC } from 'react';
import ModeController from '../organisms/ModeController';
import useMode from '@renderer/hooks/useMode';
import AnalyzeTemplate from './AnalyzeTemplate';
import CompareTemplate from './CompareTemplate';
import useCommandManager from '@renderer/hooks/useCommandManager';
import Dimmer from '../atoms/dimmer/Dimmer';

const UpperTemplate: FC = () => {
  const { mode } = useMode();
  const { idle } = useCommandManager();

  return (
    <div className="relative h-full w-full">
      <div className="mx-10 flex h-full flex-col gap-8">
        <div className="mt-12 border-b border-b-PaleGray-200 py-6">
          <ModeController />
        </div>
        <div className="overflow-auto pb-12">
          {mode === 'analyze' ? <AnalyzeTemplate /> : <CompareTemplate />}
        </div>
      </div>
      {!idle && <Dimmer />}
    </div>
  );
};

export default UpperTemplate;
