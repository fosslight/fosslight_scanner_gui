import { FC } from 'react';
import Text from './text/Text';

const GithubChip: FC = () => {
  return (
    <div className="flex min-h-[22px] min-w-[44px] items-center justify-center rounded-md bg-Teal-200">
      <Text type="p50-r" color="Teal-800">
        Github
      </Text>
    </div>
  );
};
export default GithubChip;
