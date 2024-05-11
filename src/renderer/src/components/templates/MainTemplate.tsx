import { FC, useState } from 'react';
import ModeController from '../organisms/ModeController';
import AnalyzeTemplate from './AnalyzeTemplate';
import CompareTemplate from './CompareTemplate';
import UpperTemplate from './UpperTemplate';
import LowerTemplate from './LowerTemplate';
import { useMode } from '@renderer/hooks/useMode';
import { ModeType } from '@renderer/context/ModeContext';

const MainTemplate: FC = () => {
  return (
    <div className="flex h-full flex-col justify-between">
      <UpperTemplate />
      <LowerTemplate />
    </div>
  );
};

export default MainTemplate;
