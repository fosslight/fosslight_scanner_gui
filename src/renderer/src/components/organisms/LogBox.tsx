import { FC } from 'react';
import Text from '../atoms/text/Text';
import useCommandManager from '@renderer/hooks/useCommandManager';
import ReactHtmlParser from 'react-html-parser';

const LogBox: FC = () => {
  const { log } = useCommandManager();
  return (
    <div className="flex h-full w-full items-end overflow-auto bg-PaleGray-1000 py-6 pl-4 pr-6">
      <Text type="p200-r" color="PaleGray-500" log>
        {log || '> No analysis is currently being conducted.'}
      </Text>
    </div>
  );
};

export default LogBox;
