import { FC, useEffect } from 'react';
import Text from '../atoms/text/Text';
import Spinner from '../atoms/spinner/Spinner';
import useCommandManager from '@renderer/hooks/useCommandManager';
import useCommandConfig from '@renderer/hooks/useCommandConfig';

const SignBox: FC = () => {
  const scanningSigns = [
    // should be modified dynamically
    // 'Preparing to analyze scanner...',
    'Preparing analysis...',
    'Currently analyzing scanner : Source... (1/3)',
    'Currently analyzing scanner : Source > Binary... (2/3)',
    'Currently analyzing scanner : Source > Binary > Dependency... (3/3)'
  ];

  const { idle, status } = useCommandManager();

  useEffect(() => {
    console.log(status);
  }, [status]);

  return (
    <div className="flex h-full w-full flex-col  gap-2 border border-PaleGray-200 bg-PaleGray-50 py-6 pl-4 pr-6">
      {idle ? (
        <Text type="p200-r" color="PaleGray-500">
          {'No analysis is currently being conducted.'}
        </Text>
      ) : (
        <>
          <img
            className="h-[16px] w-[32px]"
            src="/src/assets/icons/loading-indicator.svg"
            alt="loading-indicator"
          />
          <Text type="p200-r" color="PaleGray-900">
            {'Selected Scanner : Source, Binary, Dependency'}
          </Text>
          <div className="flex items-center justify-start">
            <Spinner />
            <Text type="p200-r" color="PaleGray-900">
              {!status && scanningSigns[0]}
              {status === 'source' && scanningSigns[1]}
              {status === 'binary' && scanningSigns[2]}
              {status === 'dependency' && scanningSigns[3]}
            </Text>
          </div>
        </>
      )}
    </div>
  );
};

export default SignBox;
