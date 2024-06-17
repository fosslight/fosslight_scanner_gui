import { FC } from 'react';
import Text from '../atoms/text/Text';
import useCommandManager from '@renderer/hooks/useCommandManager';
import { convertLogToHtml } from '@renderer/utils/parseLog';
import useScrollToBottom from '@renderer/hooks/useScrollToBottom';

const LogBox: FC = () => {
  const { log } = useCommandManager();
  const { containerRef } = useScrollToBottom([log]);

  return (
    <div className="h-full w-full overflow-auto bg-PaleGray-1000 py-6 pl-4 pr-6" ref={containerRef}>
      <Text
        type="p200-r"
        color="PaleGray-500"
        log
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={convertLogToHtml(
          log ?? '> No analysis is currently being conducted.'
        )}
      />
    </div>
  );
};

export default LogBox;
