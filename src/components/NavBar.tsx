
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const NavBar = () => {
  return (
    <nav className="relative z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Mapple Draw
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <button className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
            Features
          </button>
          <button className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
            Pricing
          </button>
          <button className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
            About
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
            Sign In
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
            Get Started
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};
