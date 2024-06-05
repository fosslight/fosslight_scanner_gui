import { FC, ReactNode } from 'react';

const TokenSetting: FC = (): ReactNode => {
  return (
    <div className="flex flex-col items-start justify-start gap-1">
      <div className="inline-flex h-[34px] w-[431px] flex-col items-start justify-start gap-1">
        <div className="text-zinc-700 font-['Spoqa Han Sans Neo'] text-[13px] font-medium">
          Private Github Repo Token
        </div>
        <div className="inline-flex items-start justify-start gap-2.5">
          <div className="text-gray-400 font-['Spoqa Han Sans Neo'] text-[11px] font-normal">
            Can store multiple private GitHub tokens and view or modify the list of stored tokens.
          </div>
        </div>
      </div>
    </div>
  );
};
export default TokenSetting;
