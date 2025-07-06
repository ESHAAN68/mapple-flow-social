
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, MessageSquare, Star } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative pt-20 pb-32 px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          {/* Status Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-full mb-8 shadow-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-slate-600 font-medium">Now in development</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 bg-clip-text text-transparent">
              Create, Chat,
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Collaborate
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            The next-generation collaborative workspace where teams come together to brainstorm, 
            build, and bring ideas to life in real-time.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-lg px-8 py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              Start Creating Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-semibold text-lg px-8 py-6 rounded-2xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm"
            >
              See Demo
            </Button>
          </div>
        </div>
        
        {/* Feature Icons */}
        <div className="flex justify-center items-center space-x-12 opacity-60">
          <div className="flex items-center space-x-2 text-slate-500">
            <Users className="w-6 h-6" />
            <span className="font-medium">Real-time</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <MessageSquare className="w-6 h-6" />
            <span className="font-medium">Integrated Chat</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <Star className="w-6 h-6" />
            <span className="font-medium">Social</span>
          </div>
        </div>
      </div>
    </section>
  );
};
