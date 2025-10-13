import { createContext } from 'react';
import { useAuthLogic } from './useAuth.jsx';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const auth = useAuthLogic();
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export { AuthContext };