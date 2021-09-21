import React, {createContext, FC, useContext, useEffect, useState} from 'react';
import BiometricsSDK from '../utils/BiometricsSDK';

type AuthContextData = {
  isLoading: boolean;
  isAuthenticated: boolean;
  userDidLogout?: boolean;
  signOut(): void;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: FC = ({children}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDidLogout, setUserDidLoggedOut] = useState<boolean | undefined>(
    undefined,
  );

  useEffect(() => {
    BiometricsSDK.hasWalletStored().then((hasValue: boolean) => {
      setIsLoading(false);
      setIsAuthenticated(hasValue);
    });
  }, []);
  const signOut = () => {
    setIsAuthenticated(false);
    setUserDidLoggedOut(true);
  };
  return (
    <AuthContext.Provider
      value={{isLoading, isAuthenticated, userDidLogout, signOut}}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('must be used with AuthProvider');
  }

  return context;
}
