import { FC, useState } from 'react';
import SelectChip from '../atoms/select/SelectChip';

export interface ISelectChipOption {
  label: string;
  value: string;
}

interface IMultiSelectChipProps {
  options: ISelectChipOption[];
  values?: Set<string>;
  onChange?: (values: Set<string>) => void;
}

const MultiSelectChip: FC<IMultiSelectChipProps> = ({ options, values, onChange }) => {
  const handleSelect = (value: string) => (selected: boolean) => {
    const newSelectedValues = new Set(values ?? []);
    selected ? newSelectedValues.add(value) : newSelectedValues.delete(value);
    onChange?.(newSelectedValues);
  };

  return (
    <div className="flex items-start gap-2">
      {options.map((option) => (
        <SelectChip
          key={option.value}
          title={option.label}
          selected={values?.has(option.value)}
          onSelect={handleSelect(option.value)}
        />
      ))}
    </div>
  );
};

export default MultiSelectChip;
