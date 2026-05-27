import { useRef, useState, useMemo } from 'react';
import WinnerModal from './WinnerModal';
import ResetConfirmModal from './ResetConfirmModal';
import WheelView from './WheelView';
import LootboxView from './LootboxView';
import HorseRaceView from './HorseRaceView';

/**
 * Controller component for the wheel spinner interface.
 * Decouples views by routing display modes to WheelView, LootboxView, or HorseRaceView.
 */
export default function WheelSpin({ 
  wheel, 
  wheels = [],
  autoSpin = false,
  onClearAutoSpin,
  onTransitionToWheel,
  nestedResult = null,
  onClearNestedResult,
  onSpinEnd, 
  onOpenSettings, 
  onBackHome, 
  onResetWheel,
  onExportWheel
}) {
  const viewRef = useRef(null);

  // Shared UI states across views
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [isCrateOpening, setIsCrateOpening] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [revealingOptionId, setRevealingOptionId] = useState(null);
  const [depletingOptionId, setDepletingOptionId] = useState(null);

  const activeOptions = useMemo(() => {
    return wheel.activeOptions || [];
  }, [wheel.activeOptions]);

  const totalWeight = useMemo(() => {
    return activeOptions.reduce((sum, opt) => sum + opt.weight, 0);
  }, [activeOptions]);

  const isWinnerLegendary = useMemo(() => {
    if (!winner || totalWeight === 0) return false;
    const odds = winner.weight / totalWeight;
    if (odds >= 0.05) return false;
    const sortedAsc = [...activeOptions].sort((a, b) => a.weight - b.weight);
    const thresholdWeight = sortedAsc.length >= 3 ? sortedAsc[2].weight : Infinity;
    return winner.weight <= thresholdWeight;
  }, [winner, activeOptions, totalWeight]);

  const handleConfirmWinner = () => {
    setWinnerModalOpen(false);
    
    // Check if the option is a link to another wheel
    // If we are returning from a nested run (nestedResult is present), we DO NOT transition again!
    if (!nestedResult && winner && winner.linkedWheelId) {
      console.log('[WHEEL] Confirming linked wheel transition to:', winner.linkedWheelId);
      onTransitionToWheel(winner.linkedWheelId, winner);
      return;
    }

    // Clear nested result state in parent when returning
    if (nestedResult && onClearNestedResult) {
      onClearNestedResult();
    }

    // Delegate to view to run depletion animation if required, or directly call onSpinEnd
    if (viewRef.current) {
      viewRef.current.confirmWinner(winner);
    }
  };

  const handleConfirmReset = () => {
    setResetConfirmOpen(false);
    
    // Reset view specific animation properties
    if (viewRef.current) {
      viewRef.current.reset();
    }
    
    // Reset states
    setRevealingOptionId(null);
    setDepletingOptionId(null);
    setWinner(null);
    
    onResetWheel();
  };

  // Shared props object passed down to display view components
  const viewProps = {
    ref: viewRef,
    wheel,
    wheels,
    autoSpin,
    onClearAutoSpin,
    onTransitionToWheel,
    nestedResult,
    onClearNestedResult,
    onSpinEnd,
    onBackHome,
    onOpenSettings,
    onResetWheel: handleConfirmReset,
    onExportWheel,
    isSpinning,
    setIsSpinning,
    winner,
    setWinner,
    winnerModalOpen,
    setWinnerModalOpen,
    resetConfirmOpen,
    setResetConfirmOpen,
    revealingOptionId,
    setRevealingOptionId,
    depletingOptionId,
    setDepletingOptionId,
    onWinnerDetermined: () => {} // callback hook if needed
  };

  return (
    <>
      {/* Route to the appropriate display mode view */}
      {wheel.displayMode === 'race' ? (
        <HorseRaceView {...viewProps} />
      ) : wheel.displayMode === 'lootbox' || wheel.isLootbox ? (
        <LootboxView 
          {...viewProps} 
          isCrateOpening={isCrateOpening} 
          setIsCrateOpening={setIsCrateOpening} 
        />
      ) : (
        <WheelView {...viewProps} />
      )}

      {/* Landing Winner Popup Overlay */}
      <WinnerModal 
        isOpen={winnerModalOpen}
        winner={winner}
        isWinnerLegendary={isWinnerLegendary}
        nestedResult={nestedResult}
        wheels={wheels}
        onConfirm={handleConfirmWinner}
      />

      {/* Reset confirmation popup */}
      <ResetConfirmModal 
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </>
  );
}
