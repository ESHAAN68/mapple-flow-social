
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  gradient: string;
}

export const FeatureCard = ({ icon, title, description, gradient }: FeatureCardProps) => {
  return (
    <div className="group relative">
      <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-3xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-200/50">
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-6 transform transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
          
          <h3 className="text-2xl font-bold mb-4 text-slate-800 group-hover:text-slate-900 transition-colors">
            {title}
          </h3>
          
          <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
