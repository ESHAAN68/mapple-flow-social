
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  gradient: string;
}

export const FeatureCard = ({ icon, title, description, gradient }: FeatureCardProps) => {
  return (
    <div className="group relative animate-bounce-in">
      <div className="card-playful rounded-3xl p-8 border-2 border-primary/10 hover:border-secondary/30 transition-all duration-500 hover:rotate-1">
        {/* Magical background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5 rounded-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-6 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 animate-float">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-magical group-hover:shadow-glow">
              {icon}
            </div>
          </div>
          
          <h3 className="font-poppins text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          
          <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
            {description}
          </p>
          
          {/* Playful hover indicator */}
          <div className="mt-6 flex items-center text-primary opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <span className="text-sm font-medium">Learn more</span>
            <div className="ml-2 w-4 h-4 rounded-full bg-gradient-secondary animate-pulse-glow"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
