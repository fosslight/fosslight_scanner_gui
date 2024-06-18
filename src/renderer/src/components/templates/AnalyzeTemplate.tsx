import { FC, useEffect } from 'react';
import SourceSelector from '../organisms/SourceSelector';
import TextInput from '../organisms/TextInput';
import MultiSelectChip from '../molecules/MultiSelectChip';
import Select from '../organisms/Select';
import useCommandConfig from '@renderer/hooks/useCommandConfig';

const AnalyzeTemplate: FC = () => {
  const { analyzeCommandConfig, updateAnalyzeCommandConfig } = useCommandConfig();

  useEffect(() => {
    console.log(analyzeCommandConfig);
  }, [analyzeCommandConfig]);

  const handleAnalysisSubjectChange = (values: PathInfo[]) => {
    updateAnalyzeCommandConfig({ subjects: values });
  };

  const handleExclusionChange = (values: PathInfo[]) => {
    updateAnalyzeCommandConfig({ exclusions: values });
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
          { type: 'text', value: 'github', label: 'GitHub repo', placeholder: 'https://github/' }, // Change this option to 'Link' later
          { type: 'dir', value: 'local-dir', label: 'Local directory', placeholder: '~/' }
        ]}
        placeholder={
          <>
            Add the GitHub repository address
            <br />
            or local path you want to analyze.
          </>
        }
        values={analyzeCommandConfig.subjects}
        onChange={handleAnalysisSubjectChange}
      />
      <SourceSelector
        label="Exclusion from analysis"
        options={[{ type: 'file', value: 'local', label: 'Local path', placeholder: '~/' }]}
        placeholder={
          <>
            Exclude the local paths
            <br />
            you do not want to analyze.
          </>
        }
        addButtonConfig={{ type: 'tertiary', title: 'Exclude' }}
        values={analyzeCommandConfig.exclusions}
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
          values={new Set(analyzeCommandConfig.mode)}
          onChange={handleScannerTypeChange}
        />
        <TextInput
          label="Storage path for analysis results"
          required
          options={[{ type: 'dir', label: 'Local directory', value: 'local', placeholder: '~/' }]}
          value={analyzeCommandConfig.outputPath}
          onChange={handleResultStoragePathChange}
        />
        <TextInput
          label="File name and format of analysis results"
          showDropdown={false}
          value={analyzeCommandConfig.outputFileName}
          options={[
            {
              type: 'text',
              label: 'File name',
              value: 'filename',
              placeholder: 'Enter the desired file name.'
            }
          ]}
          showInput={analyzeCommandConfig?.subjects!.length <= 1 ?? true}
          suffix={
            <MultiSelectChip
              options={[
                { value: 'excel', label: '.excel' },
                { value: 'yaml', label: '.yaml' }
              ]}
              radio
              values={new Set([analyzeCommandConfig.outputFormat!])}
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
