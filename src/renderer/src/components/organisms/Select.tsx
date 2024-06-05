import { FC, useEffect, useState } from 'react';
import Text from '../atoms/text/Text';
import MultiSelectChip, { ISelectChipOption } from '../molecules/MultiSelectChip';
import SelectCheckbox from '../atoms/select/SelectCheckbox';

interface ISelectProps {
  label?: string;
  required?: boolean;
  options: ISelectChipOption[];
  values?: Set<string>;
  onChange?: (values: Set<string>) => void;
}

const Select: FC<ISelectProps> = ({
  label,
  required = false,
  options,
  values: inputValues,
  onChange
}) => {
  const [selectedValues, setSelectedValues] = useState<Set<string>>(inputValues ?? new Set());
  const allSelected = options.every((option) => selectedValues.has(option.value));

  const handleAllSelect = (selected: boolean) => {
    const newSelectedValues = new Set(selected ? options.map((option) => option.value) : []);
    setSelectedValues(newSelectedValues);
    onChange?.(newSelectedValues);
  };

  const handleChange = (values: Set<string>) => {
    const newSelectedValues = new Set(values);
    setSelectedValues(newSelectedValues);
    onChange?.(newSelectedValues);
  };

  return (
    <div className="flex flex-col gap-[6px]">
      {label && (
        <div className="flex gap-[2px] bg-transparent">
          <Text type="p200-m" color="PaleGray-900">
            {label}
          </Text>
          {required && (
            <Text type="p200-m" color="LGRed-600">
              *
            </Text>
          )}
        </div>
      )}
      <div className="flex gap-3">
        <SelectCheckbox title="All" selected={allSelected} onSelect={handleAllSelect} />
        <MultiSelectChip options={options} values={selectedValues} onChange={handleChange} />
      </div>
    </div>
  );
};

export default Select;
