
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, MessageSquare, Star } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative pt-20 pb-32 px-6 overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Magical Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-secondary/20 rounded-full blur-3xl animate-float delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-accent/10 rounded-full blur-2xl animate-pulse-glow"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-bounce-in">
          {/* Playful Status Badge */}
          <div className="inline-flex items-center px-6 py-3 glass-effect border-2 border-primary/20 rounded-full mb-8 shadow-magical hover:shadow-glow transition-all duration-300 hover:scale-105 group">
            <div className="w-3 h-3 bg-gradient-accent rounded-full mr-3 animate-pulse-glow"></div>
            <span className="text-sm font-poppins font-medium text-foreground">✨ Now in development - Join the magic!</span>
          </div>
          
          {/* Animated Main Headline */}
          <h1 className="font-poppins text-6xl md:text-8xl font-bold mb-8 leading-tight">
            <span className="gradient-text animate-gradient-shift bg-[length:400%_400%] block">
              Create, Chat,
            </span>
            <br />
            <span className="bg-gradient-secondary bg-clip-text text-transparent animate-bounce-in delay-300">
              Collaborate ✨
            </span>
          </h1>
          
          <p className="font-inter text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-slide-up">
            The next-generation collaborative workspace where teams come together to brainstorm, 
            build, and bring ideas to life in real-time. <span className="text-primary font-semibold">It's going to be amazing! 🚀</span>
          </p>
          
          {/* Playful CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-bounce-in delay-500">
            <Button 
              variant="magical"
              size="lg" 
              className="font-poppins font-bold text-xl px-10 py-6 rounded-3xl shadow-glow hover:shadow-fun group"
            >
              Start Creating Free 🎨
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
            <Button 
              variant="playful"
              size="lg"
              className="font-poppins font-semibold text-xl px-10 py-6 rounded-3xl group"
            >
              Watch Demo 🎬
              <div className="ml-3 w-6 h-6 rounded-full bg-gradient-accent animate-pulse-glow"></div>
            </Button>
          </div>
        </div>
        
        {/* Fun Feature Icons */}
        <div className="flex justify-center items-center space-x-16 opacity-70 animate-slide-up delay-700">
          <div className="flex flex-col items-center space-y-2 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 group">
            <div className="w-12 h-12 bg-gradient-primary/20 rounded-2xl flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
              <Users className="w-6 h-6" />
            </div>
            <span className="font-poppins font-medium">Real-time Magic</span>
          </div>
          <div className="flex flex-col items-center space-y-2 text-muted-foreground hover:text-secondary transition-all duration-300 hover:scale-110 group">
            <div className="w-12 h-12 bg-gradient-secondary/20 rounded-2xl flex items-center justify-center group-hover:shadow-fun transition-all duration-300">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="font-poppins font-medium">Integrated Chat</span>
          </div>
          <div className="flex flex-col items-center space-y-2 text-muted-foreground hover:text-accent transition-all duration-300 hover:scale-110 group">
            <div className="w-12 h-12 bg-gradient-accent/20 rounded-2xl flex items-center justify-center group-hover:shadow-magical transition-all duration-300">
              <Star className="w-6 h-6" />
            </div>
            <span className="font-poppins font-medium">Social & Fun</span>
          </div>
        </div>
      </div>
    </section>
  );
};
