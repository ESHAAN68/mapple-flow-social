
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, RotateCcw, Sparkles } from "lucide-react";
import { useState } from 'react';
import { useChaosStore } from '@/store/chaosStore';
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

export const NavBar = () => {
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
    <nav className="relative z-50 px-6 py-4 glass-effect border-b border-primary/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 group">
          <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-magical hover:shadow-glow transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <span className="text-white font-poppins font-bold text-xl">M</span>
          </div>
          <span className="font-poppins text-3xl font-bold gradient-text animate-gradient-shift bg-[length:400%_400%]">
            Mapple Draw
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <button className="text-muted-foreground hover:text-primary font-medium transition-all duration-300 hover:scale-105 relative group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all duration-300 group-hover:w-full"></span>
          </button>
          <button className="text-muted-foreground hover:text-secondary font-medium transition-all duration-300 hover:scale-105 relative group">
            Pricing
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-secondary transition-all duration-300 group-hover:w-full"></span>
          </button>
          <button className="text-muted-foreground hover:text-accent font-medium transition-all duration-300 hover:scale-105 relative group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-accent transition-all duration-300 group-hover:w-full"></span>
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={handleChaosClick}
            size="sm"
            className={`
              ${isChaosMode
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                : 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600'
              }
              text-white font-bold transition-all duration-300
            `}
          >
            {isChaosMode ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Fix
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Chaos
                <Zap className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Button variant="ghost" className="text-muted-foreground hover:text-primary font-medium">
            Sign In
          </Button>
          <Button 
            variant="magical" 
            size="lg"
            className="font-poppins font-semibold shadow-fun hover:shadow-glow"
          >
            Get Started
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </nav>

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
