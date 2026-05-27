import { useContext } from 'react';
import { WheelContext } from '../context/WheelContext';

export const useWheels = () => {
  const context = useContext(WheelContext);
  if (!context) {
    throw new Error('useWheels must be used within a WheelProvider');
  }
  return context;
};
