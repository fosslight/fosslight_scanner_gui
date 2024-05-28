import { FC } from 'react';
import SourceSelector from '../organisms/SourceSelector';
import TextInput from '../organisms/TextInput';
import MultiSelectChip from '../molecules/MultiSelectChip';

const CompareTemplate: FC = () => {
  return (
    <div className="flex flex-wrap items-start justify-start gap-16">
      <SourceSelector label="Comparison Subject" required />
      <div className="flex flex-col justify-start gap-10">
        <TextInput
          label="Storage path for comparison results"
          required
          options={[{ type: 'file', label: 'Local path', value: 'local', placeholder: '~/' }]}
        />
        <TextInput
          label="File name and format of comparison results"
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
                { value: 'json', label: '.json' },
                { value: 'yaml', label: '.yaml' },
                { value: 'html', label: '.html' }
              ]}
              onChange={(selectedValues) => console.log(selectedValues)}
            />
          }
        />
      </div>
    </div>
  );
};

export default CompareTemplate;
