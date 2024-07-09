import { FC } from 'react';
import Text from '../atoms/text/Text';
import { FossLogo } from '../atoms/SVGIcons';

const AppInitializer: FC = () => {
  return (
    <div className="draggable fixed h-full w-full">
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <FossLogo />
        <Text type="p400-m" color="white">
          Getting Ready...
        </Text>
      </div>
    </div>
  );
};

export default AppInitializer;
