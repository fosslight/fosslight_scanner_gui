import { FC, useState } from 'react';
import ModeController from '../organisms/ModeController';
import useMode from '@renderer/hooks/useMode';
import AnalyzeTemplate from './AnalyzeTemplate';
import CompareTemplate from './CompareTemplate';

const UpperTemplate: FC = () => {
  const { mode } = useMode();

  return (
    <div className="flex h-full flex-col gap-8 px-10 py-12">
      <div className="py-6">
        <ModeController />
      </div>
      {mode === 'analyze' ? <AnalyzeTemplate /> : <CompareTemplate />}
    </div>
  );
};

export default UpperTemplate;