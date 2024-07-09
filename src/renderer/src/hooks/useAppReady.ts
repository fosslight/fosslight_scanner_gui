import { useEffect, useState } from 'react';

interface IUseAppReady {
  appReady: boolean;
}

const useAppReady = (): IUseAppReady => {
  const [appReady, setAppReady] = useState(false);

  const handleAppReady = () => {
    setAppReady(true);
  };

  useEffect(() => {
    window.api.onAppReady(handleAppReady);

    return () => {
      window.api.offAppReady(handleAppReady);
    };
  }, []);

  return { appReady };
};

export default useAppReady;
