// hooks/useAuth.ts
import { useContext } from 'react';
import { UserContext } from '../app/context/UserContext';

export const useAuth = () => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useAuth must be used within a UserProvider');
  }
  
  return context;
};