import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailOrUsername } = await req.json();

    if (!emailOrUsername) {
      return new Response(
        JSON.stringify({ error: 'Email or username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key to access auth.users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Searching for user:', emailOrUsername);

    // First try to find by username in profiles
    const { data: profileByUsername } = await supabaseAdmin
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('username', emailOrUsername.trim())
      .single();

    if (profileByUsername) {
      console.log('Found user by username:', profileByUsername);
      return new Response(
        JSON.stringify({ user: profileByUsername }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If not found by username, try to find by email in auth.users
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error listing users:', authError);
      throw authError;
    }

    const userByEmail = users?.find(u => 
      u.email?.toLowerCase() === emailOrUsername.trim().toLowerCase()
    );

    if (userByEmail) {
      // Get the profile for this user
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', userByEmail.id)
        .single();

      if (profile) {
        console.log('Found user by email:', profile);
        return new Response(
          JSON.stringify({ user: profile }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('No user found for:', emailOrUsername);
    return new Response(
      JSON.stringify({ error: 'User not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
