import { FC, useState } from 'react';
import SelectChip from '../atoms/select/SelectChip';

interface ISelectChipOption {
  label: string;
  value: string;
}

interface IMultiSelectChipProps {
  options: ISelectChipOption[];
  selectedValues?: Set<string>;
  onChange?: (selectedValues: Set<string>) => void;
}

const MultiSelectChip: FC<IMultiSelectChipProps> = ({
  options,
  selectedValues: inputSelectedValues,
  onChange
}) => {
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    inputSelectedValues ?? new Set()
  );

  const handleSelect = (value: string) => {
    const newSelectedValues = new Set(selectedValues);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      newSelectedValues.add(value);
    }
    setSelectedValues(newSelectedValues);
    onChange?.(newSelectedValues);
  };

  return (
    <div className="flex items-start gap-2">
      {options.map((option) => (
        <SelectChip
          key={option.value}
          title={option.label}
          selected={selectedValues?.has(option.value)}
          onSelect={handleSelect.bind(null, option.value)}
        />
      ))}
    </div>
  );
};

export default MultiSelectChip;
