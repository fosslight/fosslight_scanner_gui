import { FC, useState } from 'react';
import ModeController from '../organisms/ModeController';
import useMode from '@renderer/hooks/useMode';
import AnalyzeTemplate from './AnalyzeTemplate';
import CompareTemplate from './CompareTemplate';
import DeleteButton from '../molecules/button/DeleteButton';
import SourceSelector from '../organisms/SourceSelector';
import TextInput from '../organisms/TextInput';

const UpperTemplate: FC = () => {
  const { mode } = useMode();

  return (
    <div className="flex h-full flex-col gap-8 overflow-auto px-10 py-12">
      <div className="border-b border-b-PaleGray-200 py-6">
        <ModeController />
      </div>
      <div className="flex justify-between">
        <SourceSelector label="Analysis subject" required />
        <SourceSelector
          label="Exclusion from analysis"
          addButtonConfig={{ type: 'tertiary', title: 'Exclude' }}
        />
        <div className="flex flex-col gap-4"></div>
      </div>
      {mode === 'analyze' ? <AnalyzeTemplate /> : <CompareTemplate />}
    </div>
  );
};

export default UpperTemplate;
