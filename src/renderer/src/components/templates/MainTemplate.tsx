import { FC } from 'react';
import UpperTemplate from './UpperTemplate';
import LowerTemplate from './LowerTemplate';

const MainTemplate: FC = () => {
  return (
    <div className="flex h-full flex-col justify-between">
      <UpperTemplate />
      <LowerTemplate />
    </div>
  );
};

export default MainTemplate;
