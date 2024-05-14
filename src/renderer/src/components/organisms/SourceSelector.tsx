import { FC } from 'react';
import TextInput from '../molecules/TextInput';
import ListBox from './ListBox';

interface ISourceSelectorProps {
  onChange: (values: any) => void;
}

const SourceSelector: FC = () => {
  return (
    <div className="flex w-[346px] flex-col gap-4">
      <TextInput />
      <ListBox />
    </div>
  );
};

export default SourceSelector;
