
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const NavBar = () => {
  return (
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
  );
};
