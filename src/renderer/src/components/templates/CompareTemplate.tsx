import { FC } from 'react';
import SourceSelector from '../organisms/SourceSelector';
import TextInput from '../organisms/TextInput';
import SelectCheckbox from '../atoms/SelectCheckbox';

const CompareTemplate: FC = () => {
  return (
    <div className="flex flex-wrap justify-between gap-4">
      <SourceSelector label="Comparison Subject" required />
      <div className="flex flex-col gap-10">
        <TextInput label="Storage path for comparison results" required options={[]} />
        <SelectCheckbox onCheckboxClick={() => {}} title="title" />
      </div>
    </div>
  );
};

export default CompareTemplate;
