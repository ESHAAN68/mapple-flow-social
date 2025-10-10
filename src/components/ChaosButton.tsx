import { useState } from 'react';
import { Zap, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useChaosStore } from '@/store/chaosStore';
import { motion } from 'framer-motion';

export const ChaosButton = () => {
  const [showWarning, setShowWarning] = useState(false);
  const { isChaosMode, activateChaos, deactivateChaos } = useChaosStore();

  const handleChaosClick = () => {
    if (!isChaosMode) {
      setShowWarning(true);
    } else {
      deactivateChaos();
    }
  };

  const confirmChaos = () => {
    activateChaos();
    setShowWarning(false);
  };

  return (
    <>
      <motion.div
        className="fixed top-4 right-4 z-[9999]"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={handleChaosClick}
          size="lg"
          className={`
            ${isChaosMode
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
              : 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600'
            }
            text-white font-bold shadow-lg transition-all duration-300 transform hover:scale-110
          `}
        >
          {isChaosMode ? (
            <>
              <RotateCcw className="mr-2 h-5 w-5" />
              Fix Everything!
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
              Chaos Mode
              <Zap className="ml-2 h-5 w-5 animate-bounce" />
            </>
          )}
        </Button>
      </motion.div>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="border-4 border-pink-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              ⚠️ Warning: Chaos Incoming! ⚠️
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg space-y-2">
              <p className="font-semibold text-foreground">
                Everything might get disbalanced!
              </p>
              <p>
                All components will fall down and become draggable.
                Things will get messy!
              </p>
              <p className="text-sm italic">
                (Don't worry, you can fix it with the button or just refresh the page)
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nevermind, I'm scared</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmChaos}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold"
            >
              YES! UNLEASH CHAOS! 🎉
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
