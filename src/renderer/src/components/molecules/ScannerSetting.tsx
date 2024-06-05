import { FC, ReactNode } from 'react';
import Text from '../atoms/text/Text';
import Button from '../atoms/button/Button';
import Toggle from '../atoms/toggle/Toggle';
import useCorrect from '../../hooks/useCorrect'; // useMode 훅을 가져옵니다

const ScannerSetting: FC = () => {
  const { correct, setCorrect } = useCorrect();

  const handleToggle = (toggled: boolean) => {
    const newMode = toggled ? 'correction' : 'no_correction';
    setCorrect(newMode);
    console.log(`Mode is now: ${newMode}`);
  };

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-8">
      <div className="flex w-full flex-col items-start justify-start gap-1">
        <Text type="p200-m" color="PaleGray-900">
          -d Option
        </Text>
        <Text type="p50-r" color="PaleGray-500">
          Additional arguments for running dependency analysis
        </Text>
        <div className="flex h-44 w-full items-start justify-start rounded-lg border border-PaleGray-300 bg-white px-2 py-4">
          <textarea
            placeholder="gdsgdg"
            className="h-full w-full flex-grow resize-none text-xs font-normal text-PaleGray-900 outline-none"
          />
        </div>
      </div>

      <div className="flex w-full flex-col items-start justify-start gap-1">
        <Text type="p200-m" color="PaleGray-900">
          --no_correction Option
        </Text>
        <Text type="p50-r" color="PaleGray-500">
          Check if you don't want to correct OSS information with sbom-info.yaml (Correction mode
          only supported xlsx format)
        </Text>
        <div className="flex w-full flex-col items-end justify-end pr-4">
          <Toggle type="default" toggled={correct === 'correction'} onToggle={handleToggle} />
        </div>
      </div>

      <div className="flex w-full flex-col items-end justify-end gap-1">
        <Button type="primary">Save</Button>
      </div>
    </div>
  );
};

export default ScannerSetting;
