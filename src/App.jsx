import { WheelProvider } from './context/WheelContext';
import { NavigationProvider } from './context/NavigationContext';
import { HistoryProvider } from './context/HistoryContext';
import AppLayout from './components/AppLayout';

export default function App() {
  return (
    <WheelProvider>
      <NavigationProvider>
        <HistoryProvider>
          <AppLayout />
        </HistoryProvider>
      </NavigationProvider>
    </WheelProvider>
  );
}
