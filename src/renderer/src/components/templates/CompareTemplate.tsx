import { FC } from 'react';
import SourceSelector from '../organisms/SourceSelector';
import TextInput from '../organisms/TextInput';
import MultiSelectChip from '../molecules/MultiSelectChip';
import useCommandConfig from '@renderer/hooks/useCommandConfig';

const CompareTemplate: FC = () => {
  const { updateCompareCommandConfig } = useCommandConfig();

  const handleComparisonSubjectChange = (values: string[]) => {
    updateCompareCommandConfig({ reports: [values[0], values[1]] });
  };

  const handleResultStoragePathChange = (value?: string) => {
    updateCompareCommandConfig({ outputPath: value });
  };

  const handleResultFileNameChange = (value?: string) => {
    updateCompareCommandConfig({ outputFileName: value });
  };

  const handleResultFileFormatChange = (values: Set<string>) => {
    updateCompareCommandConfig({ outputFormat: values.keys().next().value });
  };

  return (
    <div className="flex flex-wrap items-start justify-start gap-16">
      <SourceSelector
        label="Comparison Subject"
        required
        options={[{ value: 'local', label: 'Local path', type: 'file', placeholder: '~/' }]}
        placeholder={
          <>
            Add two analysis result files
            <br />
            you want to compare.
          </>
        }
        onChange={handleComparisonSubjectChange}
      />
      <div className="flex flex-col justify-start gap-10">
        <TextInput
          label="Storage path for comparison results"
          required
          options={[{ type: 'file', label: 'Local path', value: 'local', placeholder: '~/' }]}
          onChange={handleResultStoragePathChange}
        />
        <TextInput
          label="File name and format of comparison results"
          required
          showDropdown={false}
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
              radio
              onChange={handleResultFileFormatChange}
            />
          }
          onChange={handleResultFileNameChange}
        />
      </div>
    </div>
  );
};

export default CompareTemplate;
