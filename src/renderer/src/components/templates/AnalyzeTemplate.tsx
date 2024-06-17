import { FC } from 'react';
import SourceSelector from '../organisms/SourceSelector';
import TextInput from '../organisms/TextInput';
import MultiSelectChip from '../molecules/MultiSelectChip';
import Select from '../organisms/Select';
import useCommandConfig from '@renderer/hooks/useCommandConfig';

const AnalyzeTemplate: FC = () => {
  const { updateAnalyzeCommandConfig } = useCommandConfig();

  const handleAnalysisSubjectChange = (values: string[]) => {
    updateAnalyzeCommandConfig({ path: values });
  };

  const handleExclusionChange = (values: string[]) => {
    updateAnalyzeCommandConfig({ excludedPath: values });
  };

  const handleScannerTypeChange = (values: Set<string>) => {
    updateAnalyzeCommandConfig({ mode: Array.from(values) as AnalyzeCommandConfig['mode'] });
  };

  const handleResultStoragePathChange = (value?: string) => {
    updateAnalyzeCommandConfig({ outputPath: value });
  };

  const handleResultFileNameChange = (value?: string) => {
    updateAnalyzeCommandConfig({ outputFileName: value });
  };

  const handleResultFileFormatChange = (values: Set<string>) => {
    updateAnalyzeCommandConfig({ outputFormat: values.keys().next().value });
  };

  return (
    <div className="flex justify-between gap-6">
      <SourceSelector
        label="Analysis subject"
        required
        options={[
          { value: 'github', label: 'GitHub repo', type: 'text', placeholder: 'https://github/' }, // Change this option to 'Link' later
          { value: 'local-dir', label: 'Local directory', type: 'dir', placeholder: '~/' },
          { value: 'local-file', label: 'Local file', type: 'file', placeholder: '~/' }
        ]}
        placeholder={
          <>
            Add the GitHub repository address
            <br />
            or local path you want to analyze.
          </>
        }
        onChange={handleAnalysisSubjectChange}
      />
      <SourceSelector
        label="Exclusion from analysis"
        options={[{ value: 'local', label: 'Local path', type: 'file', placeholder: '~/' }]}
        placeholder={
          <>
            Exclude the local paths
            <br />
            you do not want to analyze.
          </>
        }
        addButtonConfig={{ type: 'tertiary', title: 'Exclude' }}
        onChange={handleExclusionChange}
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
          onChange={handleScannerTypeChange}
        />
        <TextInput
          label="Storage path for analysis results"
          required
          options={[{ type: 'file', label: 'Local path', value: 'local', placeholder: '~/' }]}
          onChange={handleResultStoragePathChange}
        />
        <TextInput
          label="File name and format of analysis results"
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
                { value: 'yaml', label: '.yaml' }
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

export default AnalyzeTemplate;
