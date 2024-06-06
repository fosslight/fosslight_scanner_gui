import { FC, useEffect, useState } from 'react';
import SelectChip from '../atoms/select/SelectChip';

export interface ISelectChipOption {
  label: string;
  value: string;
}

interface IMultiSelectChipProps {
  options: ISelectChipOption[];
  values?: Set<string>;
  radio?: boolean;
  onChange?: (values: Set<string>) => void;
}

const MultiSelectChip: FC<IMultiSelectChipProps> = ({
  options,
  values,
  radio = false,
  onChange
}) => {
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    values ?? new Set(radio ? [options[0].value] : [])
  );

  const handleSelect = (value: string) => (selected: boolean) => {
    const newSelectedValues = new Set(selectedValues);
    if (radio) {
      newSelectedValues.clear();
      newSelectedValues.add(value);
    } else if (selected) {
      newSelectedValues.add(value);
    } else {
      newSelectedValues.delete(value);
    }
    setSelectedValues(newSelectedValues);
    onChange?.(newSelectedValues);
  };

  useEffect(() => {
    setSelectedValues(values ?? new Set(radio ? [options[0].value] : []));
  }, [values]);

  return (
    <div className="flex items-start gap-2">
      {options.map((option) => (
        <SelectChip
          key={option.value}
          title={option.label}
          selected={selectedValues?.has(option.value)}
          onSelect={handleSelect(option.value)}
        />
      ))}
    </div>
  );
};

export default MultiSelectChip;
