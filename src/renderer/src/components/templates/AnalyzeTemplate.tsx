import { FC } from 'react';
import SourceSelector from '../organisms/SourceSelector';
import TextInput from '../organisms/TextInput';
import MultiSelectChip from '../molecules/MultiSelectChip';
import Select from '../organisms/Select';

const AnalyzeTemplate: FC = () => {
  return (
    <div className="flex justify-between gap-6">
      <SourceSelector label="Analysis subject" required />
      <SourceSelector
        label="Exclusion from analysis"
        addButtonConfig={{ type: 'tertiary', title: 'Exclude' }}
      />
      <div className="flex h-[250px] flex-col justify-between">
        <Select
          label="Scanner type"
          required
          options={[
            { value: 'source', label: 'Source' },
            { value: 'binary', label: 'Binary' },
            { value: 'dependency', label: 'Dependency' }
          ]}
        />
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
