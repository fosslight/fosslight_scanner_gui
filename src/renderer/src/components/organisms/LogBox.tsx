import { FC } from 'react';
import Text from '../atoms/text/Text';

const LogBox: FC = () => {
  return (
    <div className="h-full w-full bg-PaleGray-1000 py-6 pl-4 pr-6">
      <Text type="p200-r" color="PaleGray-500">
        {'> No analysis is currently being conducted.'}
      </Text>
    </div>
  );
};

export default LogBox;
