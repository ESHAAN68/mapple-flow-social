import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { action, code, state } = await req.json();

    if (action === 'getAuthUrl') {
      // Generate Spotify authorization URL
      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
      const redirectUri = `${req.headers.get('origin')}/auth/spotify/callback`;
      
      const scopes = [
        'user-read-private',
        'user-read-email', 
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'user-read-recently-played',
        'user-top-read',
        'playlist-read-private',
        'playlist-read-collaborative',
        'streaming'
      ].join(' ');

      const authUrl = `https://accounts.spotify.com/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${user.id}`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchangeCode') {
      // Exchange authorization code for access token
      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
      const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
      const redirectUri = `${req.headers.get('origin')}/auth/spotify/callback`;

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        throw new Error(`Spotify token error: ${tokenData.error_description}`);
      }

      // Get user profile from Spotify
      const profileResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const spotifyProfile = await profileResponse.json();

      // Store tokens in spotify_credentials table
      const { error: credError } = await supabaseClient
        .from('spotify_credentials')
        .upsert({
          user_id: user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (credError) {
        throw new Error(`Credentials storage error: ${credError.message}`);
      }

      // Update profiles with non-sensitive metadata
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          spotify_user_id: spotifyProfile.id,
          spotify_connected_at: new Date().toISOString(),
          spotify_display_name: spotifyProfile.display_name,
          spotify_email: spotifyProfile.email,
          spotify_country: spotifyProfile.country,
          spotify_premium: spotifyProfile.product === 'premium',
        })
        .eq('id', user.id);

      if (profileError) {
        throw new Error(`Profile update error: ${profileError.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        profile: spotifyProfile,
        isPremium: spotifyProfile.product === 'premium'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'refreshToken') {
      // Refresh the access token
      const { data: credentials } = await supabaseClient
        .from('spotify_credentials')
        .select('refresh_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!credentials?.refresh_token) {
        throw new Error('No refresh token found');
      }

      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
      const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credentials.refresh_token,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(`Token refresh error: ${tokenData.error_description}`);
      }

      // Update the access token in spotify_credentials
      const { error: updateError } = await supabaseClient
        .from('spotify_credentials')
        .update({
          access_token: tokenData.access_token,
          // Only update refresh token if a new one is provided
          ...(tokenData.refresh_token && { refresh_token: tokenData.refresh_token }),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Token update error: ${updateError.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true,
        access_token: tokenData.access_token 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      // Delete Spotify credentials
      const { error: credError } = await supabaseClient
        .from('spotify_credentials')
        .delete()
        .eq('user_id', user.id);

      if (credError) {
        throw new Error(`Credentials delete error: ${credError.message}`);
      }

      // Clear Spotify metadata from profiles
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          spotify_user_id: null,
          spotify_connected_at: null,
          spotify_display_name: null,
          spotify_email: null,
          spotify_country: null,
          spotify_premium: null,
        })
        .eq('id', user.id);

      if (profileError) {
        throw new Error(`Profile update error: ${profileError.message}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Spotify auth error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more details'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
