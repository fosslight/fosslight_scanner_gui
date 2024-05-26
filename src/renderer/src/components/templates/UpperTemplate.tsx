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
    <div className="flex h-full flex-col gap-8 px-10 py-12">
      <div className="py-6">
        <ModeController />
        <SourceSelector label="Analysis subject" required />
        <TextInput options={[]} />
      </div>
      {mode === 'analyze' ? <AnalyzeTemplate /> : <CompareTemplate />}
    </div>
  );
};

export default UpperTemplate;
