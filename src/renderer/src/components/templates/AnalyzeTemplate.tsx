import { FC } from 'react';
import SourceSelector from '../organisms/SourceSelector';
import TextInput from '../organisms/TextInput';
import MultiSelectChip from '../molecules/MultiSelectChip';

const AnalyzeTemplate: FC = () => {
  return (
    <div className="flex flex-wrap justify-between gap-6">
      <SourceSelector label="Analysis subject" required />
      <SourceSelector
        label="Exclusion from analysis"
        addButtonConfig={{ type: 'tertiary', title: 'Exclude' }}
      />
      <div className="flex h-full flex-col justify-between gap-6">
        <TextInput
          label="Storage path for analysis results"
          required
          options={[{ type: 'file', label: 'Local path', value: 'local', placeholder: '~/' }]}
        />
        <TextInput
          label="File name and format of analysis results"
          required
          dropdown={false}
          options={[
            {
              type: 'text',
              label: 'File name',
              value: 'filename',
              placeholder: 'Enter the desired file name.'
            }
          ]}
          suffix={
            <MultiSelectChip
              options={[
                { value: 'excel', label: '.excel' },
                { value: 'yaml', label: '.yaml' }
              ]}
              onChange={(selectedValues) => console.log(selectedValues)}
            />
          }
        />
      </div>
    </div>
  );
};

export default AnalyzeTemplate;
