import { FC, Provider, ReactNode, createElement } from 'react';

interface IAppProviderProps {
  providers?: FC<any>[];
  children?: ReactNode;
}

const AppProvider: FC<IAppProviderProps> = ({ providers, children }) =>
  providers?.reduce((prev, provider) => createElement(provider, null, prev), children);

export default AppProvider;
