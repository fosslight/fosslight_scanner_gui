import { FC } from 'react';
import SourceSelector from '../organisms/SourceSelector';
import SelectCheckbox from '../atoms/select/SelectCheckbox';
import SelectChip from '../atoms/select/SelectChip';

const AnalyzeTemplate: FC = () => {
  return (
    <div className="flex flex-wrap justify-between gap-4">
      <SourceSelector label="Analysis subject" required />
      <SourceSelector
        label="Exclusion from analysis"
        addButtonConfig={{ type: 'tertiary', title: 'Exclude' }}
      />
      <div className="flex flex-col justify-between">
        <div className="flex gap-4">
          <SelectCheckbox title="Code duplication" />
          <SelectChip title="Code complexity" />
          <SelectChip title="Code smells" />
          <SelectCheckbox title="Code coverage" />
        </div>
      </div>
    </div>
  );
};

export default AnalyzeTemplate;
