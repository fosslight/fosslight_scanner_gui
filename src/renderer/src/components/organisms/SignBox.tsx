import { FC } from 'react';
import Text from '../atoms/text/Text';
import Spinner from '../atoms/spinner/Spinner';

const SignBox: FC = () => {
  const scanningSigns = [
    // should be modified dynamically
    'Currently analyzing scanner : Source... (1/3)',
    'Currently analyzing scanner : Source > Binary... (2/3)',
    'Currently analyzing scanner : Source > Binary > Dependency... (3/3)'
  ];

  const isAnalyzing = true;

  return (
    <div className="flex h-full w-full flex-col  gap-2 border border-PaleGray-200 bg-PaleGray-50 py-6 pl-4 pr-6">
      {isAnalyzing ? (
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
              {scanningSigns[0]}
            </Text>
          </div>
        </>
      ) : (
        <Text type="p200-r" color="PaleGray-500">
          {'No analysis is currently being conducted.'}
        </Text>
      )}
    </div>
  );
};

export default SignBox;
