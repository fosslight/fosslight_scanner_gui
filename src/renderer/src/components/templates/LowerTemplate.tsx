import { FC } from 'react';
import ButtonBar from '../organisms/ButtonBar';
import LogBox from '../organisms/LogBox';
import SignBox from '../organisms/SignBox';

const LowerTemplate: FC = () => {
  return (
    <div>
      <ButtonBar />
      <div className="flex h-80 flex-row">
        <LogBox />
        <SignBox />
      </div>
    </div>
  );
};

export default LowerTemplate;
