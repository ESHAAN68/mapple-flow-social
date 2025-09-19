import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Music, CheckCircle, XCircle } from 'lucide-react';

const SpotifyCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Spotify...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Spotify authorization failed: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received from Spotify');
        }

        if (!user) {
          throw new Error('User not authenticated');
        }

        setMessage('Exchanging authorization code...');

        // Exchange code for tokens using our edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('spotify-auth', {
          body: { 
            action: 'exchangeCode', 
            code: code,
            state: state 
          }
        });

        if (exchangeError) {
          throw new Error(`Token exchange failed: ${exchangeError.message}`);
        }

        if (!data.success) {
          throw new Error('Failed to connect Spotify account');
        }

        setStatus('success');
        setMessage(`Successfully connected to Spotify as ${data.profile?.display_name || 'User'}!`);

        toast({
          title: "Spotify Connected! 🎵",
          description: `Welcome ${data.profile?.display_name || 'User'}! You can now control music from your dashboard.`,
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } catch (error: any) {
        console.error('Spotify callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect Spotify');
        
        toast({
          title: "Spotify Connection Failed",
          description: error.message || 'Please try connecting again',
          variant: "destructive"
        });
      }
    };

    if (user) {
      handleCallback();
    } else {
      // Wait for user to be loaded
      const timeout = setTimeout(() => {
        setStatus('error');
        setMessage('User authentication required');
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [searchParams, user, navigate, toast]);

  const handleRetry = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#1DB954]/10 rounded-full flex items-center justify-center mb-4">
            {status === 'loading' && <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />}
            {status === 'success' && <CheckCircle className="w-8 h-8 text-green-500" />}
            {status === 'error' && <XCircle className="w-8 h-8 text-red-500" />}
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Music className="w-5 h-5 text-[#1DB954]" />
            Spotify Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'loading' && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-[#1DB954] h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <p className="text-xs text-muted-foreground">This may take a few seconds...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-green-500 text-sm font-medium">
                ✅ Connection successful!
              </div>
              <p className="text-xs text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Button onClick={handleRetry} className="w-full">
                Return to Dashboard
              </Button>
              <p className="text-xs text-muted-foreground">
                You can try connecting Spotify again from your dashboard
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SpotifyCallback;