import { FC } from 'react';
import SourceSelector from '../organisms/SourceSelector';
import SelectCheckbox from '../atoms/SelectCheckbox';



const AnalyzeTemplate: FC = () => {
  
  return (
    <div className="flex flex-wrap justify-between gap-4">
      <SourceSelector children={(
        <>
          Add the GitHub repository address <br />
          or local path you want to analyze.
        </>
      )} label="Analysis subject" required  />
      <SourceSelector
      children={(
        <>
        Exclude the local paths <br />
        you do not want to analyze.
        </>
      )}
        label="Exclusion from analysis"
       
        addButtonConfig={{ type: 'tertiary', title: 'Exclude' }}
      />
      <div className="flex flex-col justify-between">
        <SelectCheckbox onCheckboxClick={() => {}} title="title" />
        <SelectCheckbox onCheckboxClick={() => {}} title="title" />
        <SelectCheckbox onCheckboxClick={() => {}} title="title" />
      </div>
    </div>
  );
};

export default AnalyzeTemplate;