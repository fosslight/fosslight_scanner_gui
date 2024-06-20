import { FC, useEffect, useState } from 'react';
import Text from '../atoms/text/Text';
import Spinner from '../atoms/spinner/Spinner';
import useCommandManager from '@renderer/hooks/useCommandManager';
import useMode from '@renderer/hooks/useMode';

const SignBox: FC = () => {
  const { mode } = useMode();
  const { idle, scanner, subject, command } = useCommandManager();
  const [scannerStack, setScannerStack] = useState<ScannerType[]>([]);
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);

  const scannerOrder = ['source', 'binary', 'dependency'];
  const handleSortScannerType = (a: ScannerType, b: ScannerType) =>
    scannerOrder.indexOf(a) - scannerOrder.indexOf(b);
  const handleMapScannerType = (mode: ScannerType) => mode.charAt(0)?.toUpperCase() + mode.slice(1);
  const selectedScannerList = (command?.config as AnalyzeCommandConfig)?.mode;
  const scannerSign =
    mode === 'compare'
      ? 'Comparing two subjects...'
      : scannerStack.length === 0
        ? 'Preparing analysis...'
        : `Currently analyzing scanner : ${scannerStack.map(handleMapScannerType).join(' > ')}... (${scannerStack.length}/${selectedScannerList?.length})`;

  useEffect(() => {
    if (scanner && !scannerStack.includes(scanner)) {
      setScannerStack((prev) => [...prev, scanner]);
    } else if (scanner) {
      setScannerStack([scanner]);
    } else {
      setScannerStack([]);
    }
  }, [scanner]);

  useEffect(() => {
    setCurrentSubject(subject);
  }, [subject]);

  return (
    <div className="flex h-full w-full flex-col gap-2 border border-PaleGray-200 bg-PaleGray-50 py-6 pl-4 pr-6">
      {idle ? (
        <Text type="p200-r" color="PaleGray-500">
          {`> No ${mode === 'analyze' ? 'analysis' : 'comparison'} is currently being conducted.`}
        </Text>
      ) : (
        <>
          <img
            className="h-[16px] w-[32px]"
            src="/src/assets/icons/loading-indicator.svg"
            alt="loading-indicator"
          />
          {mode === 'analyze' && (
            <>
              <Text type="p200-r" color="PaleGray-900">
                {`Selected Scanner : ${selectedScannerList
                  ?.sort(handleSortScannerType)
                  .map(handleMapScannerType)
                  .join(', ')}`}
              </Text>
              {scannerStack.length !== 0 && currentSubject && (
                <Text type="p200-r" color="PaleGray-900">
                  {`Current Subject : ${currentSubject}`}
                </Text>
              )}
            </>
          )}
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
