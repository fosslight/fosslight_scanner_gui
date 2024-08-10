import { FC } from 'react';
import SourceSelector from '../organisms/SourceSelector';
import TextInput from '../organisms/TextInput';
import MultiSelectChip from '../molecules/MultiSelectChip';
import useCommandConfig from '@renderer/hooks/useCommandConfig';

const CompareTemplate: FC = () => {
  const { compareCommandConfig, updateCompareCommandConfig } = useCommandConfig();

  const handleComparisonSubjectChange = (values: PathInfo[]) => {
    updateCompareCommandConfig({ reports: [values[0]?.path, values[1]?.path] });
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
        label="Comparison Target"
        required
        options={[{ type: 'file', value: 'local', label: 'Local file', placeholder: '~/' }]}
        placeholder={
          <>
            Add two analysis result files
            <br />
            you want to compare.
          </>
        }
        values={compareCommandConfig.reports
          ?.filter((report) => report)
          .map((report) => ({ path: report, type: 'file' }))}
        onChange={handleComparisonSubjectChange}
      />
      <div className="flex flex-col justify-start gap-10">
        <TextInput
          label="Output path for comparison results"
          required
          options={[
            { type: 'dir', label: 'Local directory', value: 'local-dir', placeholder: '~/' }
          ]}
          value={compareCommandConfig.outputPath}
          onChange={handleResultStoragePathChange}
        />
        <TextInput
          label="File name and format of comparison results"
          showDropdown={false}
          options={[
            {
              type: 'text',
              label: 'File name',
              value: 'filename',
              placeholder: 'Enter the output file name.'
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
              values={new Set([compareCommandConfig.outputFormat!])}
              onChange={handleResultFileFormatChange}
            />
          }
          value={compareCommandConfig.outputFileName}
          onChange={handleResultFileNameChange}
        />
      </div>
    </div>
  );
};

export default CompareTemplate;
