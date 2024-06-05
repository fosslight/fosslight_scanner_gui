import { FC, ReactNode } from 'react';

const ScannerSetting: FC = (): ReactNode => {
  return (
    <div className="flex flex-col items-start justify-start gap-1">
      <div className="text-zinc-700 font-['Spoqa Han Sans Neo'] text-[13px] font-medium">
        -d Option
      </div>
      <div className="inline-flex items-start justify-start gap-2.5">
        <div className="text-gray-400 font-['Spoqa Han Sans Neo'] w-[403.27px] text-[11px] font-normal">
          Additional arguments for running dependency analysis
        </div>
      </div>
      <div className="border-gray-300 inline-flex h-44 w-[365px] flex-col items-start justify-start gap-0.5 rounded-lg border bg-white p-3">
        <div className="flex h-[15px] flex-col items-start justify-start gap-1.5 self-stretch">
          <div className="text-gray-400 font-['Spoqa Han Sans Neo'] self-stretch text-xs font-normal">
            Enter additional arguments{' '}
          </div>
        </div>
      </div>

      <div className="inline-flex flex-col items-start justify-start gap-1">
        <div className="text-zinc-700 font-['Spoqa Han Sans Neo'] text-[13px] font-medium">
          --no_correction Option
        </div>
        <div className="inline-flex items-start justify-start gap-2.5">
          <div className="text-gray-400 font-['Spoqa Han Sans Neo'] w-[403.27px] text-[11px] font-normal">
            Check if you don't want to correct OSS information with sbom-info.yaml (Correction mode
            only supported xlsx format)
          </div>
        </div>
      </div>
      <div className="bg-gray-300 flex h-8 w-[54px] items-center justify-start rounded-[100px] py-0.5 pl-0.5 pr-6">
        <div className="relative h-7 w-7 rounded-[100px] bg-white" />
      </div>
    </div>
  );
};
export default ScannerSetting;
