
import { Hero } from "@/components/Hero";
import { NavBar } from "@/components/NavBar";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Next-Generation Collaborative Workspace
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent leading-tight">
            Create, Chat, Collaborate
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The collaborative workspace where teams create amazing things together. 
            Beautiful whiteboards, real-time chat, and social connection - all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-purple-200 hover:border-purple-300 text-purple-700 px-8 py-3 text-lg font-semibold"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need to collaborate
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful tools that make teamwork feel effortless and enjoyable
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Palette className="w-8 h-8 text-purple-600" />}
              title="Visual Collaboration"
              description="Infinite canvases with powerful drawing tools, shapes, and templates for any project"
              gradient="from-purple-400/20 to-pink-400/20"
            />
            
            <FeatureCard
              icon={<Users className="w-8 h-8 text-blue-600" />}
              title="Real-time Teamwork"
              description="See cursors, edits, and changes instantly. Collaborate like you're in the same room"
              gradient="from-blue-400/20 to-cyan-400/20"
            />
            
            <FeatureCard
              icon={<MessageCircle className="w-8 h-8 text-green-600" />}
              title="Integrated Chat"
              description="Voice, video, and text chat built right into your workspace. Never lose context"
              gradient="from-green-400/20 to-emerald-400/20"
            />
            
            <FeatureCard
              icon={<Globe className="w-8 h-8 text-indigo-600" />}
              title="Social Workspace"
              description="Share publicly, discover amazing work, and connect with creators worldwide"
              gradient="from-indigo-400/20 to-purple-400/20"
            />
            
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-yellow-600" />}
              title="AI-Powered"
              description="Smart templates, layout suggestions, and content generation to boost creativity"
              gradient="from-yellow-400/20 to-orange-400/20"
            />
            
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-red-600" />}
              title="Enterprise Ready"
              description="Advanced permissions, SSO, compliance features, and enterprise-grade security"
              gradient="from-red-400/20 to-pink-400/20"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to transform how your team works?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of teams already creating amazing things together
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            variant="secondary"
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Collaborating Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
