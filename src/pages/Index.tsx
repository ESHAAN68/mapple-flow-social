
import { Hero } from "@/components/Hero";
import { NavBar } from "@/components/NavBar";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { CursorTrail } from "@/components/CursorTrail";
import { ChaosWrapper } from "@/components/ChaosWrapper";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { 
  Palette, 
  Users, 
  MessageCircle, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight,
  Sparkles
} from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 relative overflow-hidden">
      <CursorTrail />
      
      {/* Playful background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-accent/10 rounded-full blur-3xl animate-float delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-secondary/5 rounded-full blur-2xl animate-pulse-glow"></div>
      </div>
      
      <div className="relative z-10">
        <ChaosWrapper delay={0.1}>
          <NavBar />
        </ChaosWrapper>

        {/* Hero Section */}
        <ChaosWrapper delay={0.2}>
          <section className="relative py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-accent/10 border-2 border-accent/20 text-accent rounded-full text-sm font-poppins font-medium mb-8 shadow-magical animate-bounce-in group hover:scale-105 transition-all duration-300">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse-glow" />
              Next-Generation Collaborative Workspace ✨
            </div>
            
            <h1 className="font-poppins text-5xl md:text-8xl font-bold mb-8 gradient-text animate-gradient-shift bg-[length:400%_400%] leading-tight">
              Create, Chat, Collaborate 🚀
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed font-inter animate-slide-up">
              The collaborative workspace where teams create amazing things together. 
              Beautiful whiteboards, real-time chat, and social connection - all in one magical place! 
              <span className="text-primary font-semibold">Let's build something incredible! 💫</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-bounce-in delay-300">
              <Button 
                onClick={handleGetStarted}
                variant="magical"
                size="lg" 
                className="font-poppins font-bold text-xl px-10 py-6 rounded-3xl shadow-glow hover:shadow-fun group"
              >
                Get Started Free 🎨
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
              
              <Button 
                variant="playful"
                size="lg"
                className="font-poppins font-semibold text-xl px-10 py-6 rounded-3xl"
              >
                Watch Demo 🎬
              </Button>

              <Button 
                variant="outline"
                size="lg"
                className="font-poppins font-semibold text-xl px-10 py-6 rounded-3xl border-2 border-primary/50 hover:bg-primary/10"
                onClick={() => window.open('https://www.pornhub.com/', '_blank')}
              >
                Watch some corn while working 🌐
              </Button>
            </div>
          </div>
          </section>
        </ChaosWrapper>

        {/* Features Grid */}
        <ChaosWrapper delay={0.3}>
          <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 animate-slide-up">
              <h2 className="font-poppins text-5xl font-bold text-foreground mb-6">
                Everything you need to collaborate 🎯
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-inter">
                Powerful tools that make teamwork feel effortless and enjoyable. Let's make magic happen! ✨
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ChaosWrapper delay={0.35}>
                <FeatureCard
                  icon={<Palette className="w-8 h-8 text-white" />}
                  title="Visual Collaboration 🎨"
                  description="Infinite canvases with powerful drawing tools, shapes, and templates for any creative project you can imagine"
                  gradient="from-primary/20 to-secondary/20"
                />
              </ChaosWrapper>

              <ChaosWrapper delay={0.4}>
                <FeatureCard
                  icon={<Users className="w-8 h-8 text-white" />}
                  title="Real-time Teamwork 👥"
                  description="See cursors, edits, and changes instantly. Collaborate like you're in the same magical workspace"
                  gradient="from-secondary/20 to-accent/20"
                />
              </ChaosWrapper>

              <ChaosWrapper delay={0.45}>
                <FeatureCard
                  icon={<MessageCircle className="w-8 h-8 text-white" />}
                  title="Integrated Chat 💬"
                  description="Voice, video, and text chat built right into your workspace. Never lose context or connection"
                  gradient="from-accent/20 to-primary/20"
                />
              </ChaosWrapper>

              <ChaosWrapper delay={0.5}>
                <FeatureCard
                  icon={<Globe className="w-8 h-8 text-white" />}
                  title="Social Workspace 🌍"
                  description="Share publicly, discover amazing work, and connect with creators from around the world"
                  gradient="from-primary/15 to-accent/15"
                />
              </ChaosWrapper>

              <ChaosWrapper delay={0.55}>
                <FeatureCard
                  icon={<Zap className="w-8 h-8 text-white" />}
                  title="AI-Powered ⚡"
                  description="Smart templates, layout suggestions, and content generation to supercharge your creativity"
                  gradient="from-accent/15 to-secondary/15"
                />
              </ChaosWrapper>

              <ChaosWrapper delay={0.6}>
                <FeatureCard
                  icon={<Shield className="w-8 h-8 text-white" />}
                  title="Enterprise Ready 🛡️"
                  description="Advanced permissions, SSO, compliance features, and enterprise-grade security for teams"
                  gradient="from-secondary/15 to-primary/15"
                />
              </ChaosWrapper>
            </div>
          </div>
          </section>
        </ChaosWrapper>

        {/* Magical CTA Section */}
        <ChaosWrapper delay={0.4}>
          <section className="py-20 px-4 bg-gradient-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/20 to-secondary/20"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center text-primary-foreground">
            <h2 className="font-poppins text-5xl font-bold mb-6 animate-bounce-in">
              Ready to transform how your team works? 🌟
            </h2>
            <p className="text-xl mb-10 opacity-90 font-inter animate-slide-up delay-200">
              Join thousands of teams already creating amazing things together. 
              <span className="font-bold">Your next breakthrough is just a click away! 🚀</span>
            </p>
            <Button 
              onClick={handleGetStarted}
              variant="accent"
              size="lg" 
              className="font-poppins font-bold text-xl px-12 py-6 rounded-3xl shadow-glow hover:shadow-fun animate-bounce-in delay-400 group bg-card text-foreground"
            >
              Start Collaborating Today 🎯
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
          </div>
          </section>
        </ChaosWrapper>
      </div>
    </div>
  );
};

export default Index;
