import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { 
  Crown, Check, Zap, Users, Database, Shield, 
  Sparkles, Star, Rocket, Globe, Lock, Heart
} from 'lucide-react';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  popular?: boolean;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

const premiumPlans: PremiumPlan[] = [
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 499, // ₹4.99
    currency: 'INR',
    interval: 'month',
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: [
      'Unlimited boards and workspaces',
      '10GB cloud storage',
      'Advanced collaboration tools',
      'Priority customer support',
      'Custom themes and branding',
      'Advanced analytics dashboard',
      'Export to multiple formats',
      'Team management features'
    ]
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 4999, // ₹49.99 (save ₹10)
    currency: 'INR',
    interval: 'year',
    icon: Crown,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    popular: true,
    features: [
      'Everything in Premium Monthly',
      'Save ₹10 per year',
      'Early access to new features',
      'Premium templates library',
      'Advanced security features',
      'API access for integrations',
      'White-label options',
      'Dedicated account manager'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9999, // ₹99.99
    currency: 'INR',
    interval: 'month',
    icon: Shield,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: [
      'Everything in Premium',
      'Unlimited team members',
      'Advanced admin controls',
      'SSO integration',
      'Custom deployment options',
      'SLA guarantee',
      '24/7 phone support',
      'Custom feature development'
    ]
  }
];

export const RazorpayPayment: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setPremium } = useAnalyticsStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async (plan: PremiumPlan) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upgrade your account",
        variant: "destructive"
      });
      return;
    }

    setLoading(plan.id);
    setSelectedPlan(plan.id);

    try {
      // Create order on your backend (you'll need to implement this)
      const orderResponse = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price * 100, // Razorpay expects amount in paise
          currency: plan.currency,
          plan_id: plan.id,
          user_id: user.id
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Initialize Razorpay payment
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Your Razorpay key ID
        amount: plan.price * 100,
        currency: plan.currency,
        name: 'Mapple Draw',
        description: `${plan.name} Subscription`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            // Verify payment on your backend
            const verifyResponse = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: user.id,
                plan_id: plan.id
              })
            });

            if (verifyResponse.ok) {
              // Update user's premium status in Supabase
              await supabase
                .from('profiles')
                .update({
                  premium_plan: plan.id,
                  premium_expires_at: new Date(Date.now() + (plan.interval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

              setPremium(true);
              
              toast({
                title: "Payment successful! 🎉",
                description: `Welcome to ${plan.name}! Your premium features are now active.`,
              });
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment verification failed",
              description: "Please contact support if your payment was deducted",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: user.user_metadata?.display_name || user.email,
          email: user.email,
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
            setSelectedPlan(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-500/20"
        >
          <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
          <span className="text-sm font-medium">Upgrade to Premium</span>
        </motion.div>
        
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Unlock Premium Features
        </h2>
        
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get access to advanced collaboration tools, unlimited storage, and premium support
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {premiumPlans.map((plan, index) => {
          const Icon = plan.icon;
          const isLoading = loading === plan.id;
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-yellow-500/50 shadow-yellow-500/20' 
                  : 'border-border hover:border-primary/50'
              }`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-center py-2 text-sm font-medium">
                    <Star className="inline w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.popular ? 'pt-12' : 'pt-6'}`}>
                  <div className={`w-16 h-16 mx-auto rounded-full ${plan.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${plan.color}`} />
                  </div>
                  
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      ₹{plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.interval}
                      </span>
                    </div>
                    
                    {plan.interval === 'year' && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                        Save ₹10/year
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handlePayment(plan)}
                    disabled={isLoading}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' 
                        : ''
                    }`}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Upgrade Now
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Secure payment powered by Razorpay
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Why Upgrade to Premium?</CardTitle>
            <CardDescription className="text-center">
              Unlock the full potential of collaborative workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Database,
                  title: '10GB Storage',
                  description: '100x more storage for your projects',
                  color: 'text-blue-500'
                },
                {
                  icon: Users,
                  title: 'Unlimited Teams',
                  description: 'Create and manage unlimited teams',
                  color: 'text-green-500'
                },
                {
                  icon: Shield,
                  title: 'Advanced Security',
                  description: 'Enterprise-grade security features',
                  color: 'text-purple-500'
                },
                {
                  icon: Heart,
                  title: 'Priority Support',
                  description: '24/7 premium customer support',
                  color: 'text-red-500'
                }
              ].map((feature, index) => (
                <div key={index} className="text-center space-y-3">
                  <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${feature.color.replace('text-', 'from-')} to-${feature.color.replace('text-', '').replace('500', '600')} flex items-center justify-center`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};