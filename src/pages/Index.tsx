
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, MessageSquare, Star } from "lucide-react";
import { Hero } from "@/components/Hero";
import { FeatureCard } from "@/components/FeatureCard";
import { NavBar } from "@/components/NavBar";

const Index = () => {
  const features = [
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Real-time Collaboration",
      description: "Work together seamlessly with live cursors, instant updates, and shared creativity.",
      gradient: "from-blue-500/20 to-purple-500/20"
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-purple-500" />,
      title: "Integrated Chat",
      description: "Chat while you create. Link conversations to boards and keep ideas flowing.",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: <Star className="w-8 h-8 text-pink-500" />,
      title: "Social Workspace",
      description: "See who's online, share your work, and build together in a vibrant community.",
      gradient: "from-pink-500/20 to-orange-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <NavBar />
      
      <main className="relative">
        <Hero />
        
        {/* Features Section */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Everything you need to create together
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Mapple Draw combines the power of collaborative whiteboards with the warmth of social connection.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-6">
                  Ready to build something amazing together?
                </h2>
                <p className="text-xl mb-8 text-blue-100">
                  Join the future of collaborative creativity. Your ideas deserve a beautiful home.
                </p>
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg px-8 py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
