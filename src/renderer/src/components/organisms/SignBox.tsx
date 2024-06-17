import { FC, useEffect, useState } from 'react';
import Text from '../atoms/text/Text';
import Spinner from '../atoms/spinner/Spinner';
import useCommandManager from '@renderer/hooks/useCommandManager';

const SignBox: FC = () => {
  const { idle, status, command } = useCommandManager();
  const [statusStack, setStatusStack] = useState<ScannerType[]>([]);

  const scannerOrder = ['source', 'binary', 'dependency'];
  const handleSortScannerType = (a: ScannerType, b: ScannerType) =>
    scannerOrder.indexOf(a) - scannerOrder.indexOf(b);
  const handleMapScannerType = (mode: ScannerType) => mode.charAt(0)?.toUpperCase() + mode.slice(1);
  const selectedScannerList = (command?.config as AnalyzeCommandConfig)?.mode;
  const scannerSign =
    statusStack.length === 0
      ? 'Preparing analysis...'
      : `Currently analyzing scanner : ${statusStack.map(handleMapScannerType).join(' > ')}... (${statusStack.length}/${selectedScannerList?.length})`;

  useEffect(() => {
    if (status) {
      setStatusStack((prev) => [...prev, status]);
    } else {
      setStatusStack([]);
    }
  }, [status]);

  return (
    <div className="flex h-full w-full flex-col gap-2 border border-PaleGray-200 bg-PaleGray-50 py-6 pl-4 pr-6">
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
            {`Selected Scanner : ${selectedScannerList
              ?.sort(handleSortScannerType)
              .map(handleMapScannerType)
              .join(', ')}`}
          </Text>
          <div className="flex items-center justify-start">
            <Spinner />
            <Text type="p200-r" color="PaleGray-900">
              {scannerSign}
            </Text>
          </div>
        </>
      )}
    </div>
  );
};

export default SignBox;
