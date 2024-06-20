import { FC, ReactNode } from 'react';
import Text from '../atoms/text/Text';
import Button from '../atoms/button/Button';
import TokenSelctor from '../organisms/TokenSelector';

const TokenSetting: FC = () => {
  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-1">
      <Text type="p200-m" color="PaleGray-900">
        Private Github Repo Token
      </Text>

      <Text type="p50-r" color="PaleGray-500">
        Can store multiple private GitHub tokens and view or modify the list of stored tokens.
      </Text>
      <TokenSelctor label="label" />
    </div>
  );
};
export default TokenSetting;
