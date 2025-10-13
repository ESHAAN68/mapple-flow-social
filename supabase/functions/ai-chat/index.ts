import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You are the AI assistant for a collaborative workspace app. Your role is to:

1. **Help with Navigation & Support**: Guide users to different features and collect feedback:
   - Dashboard: View and manage all boards
   - Boards: Create and edit visual boards with real-time collaboration
   - Workspaces: Organize boards into workspaces
   - Teams: Collaborate with team members
   - Templates: Browse and use pre-made board templates
   - Analytics: View board statistics and engagement
   - Chat: Secure messaging with other users
   - Map: Location-based features
   - Spotify: Music integration for workspace vibes

2. **Explain Features**:
   - Real-time collaboration with cursor tracking
   - Chaos Mode: A fun feature that makes everything draggable and messy
   - Digital Pet: A cute companion that keeps you company
   - Achievement System: Earn fun achievements as you use the app
   - Cursor Costumes: Your cursor changes styles randomly
   - Board sharing and collaboration
   - Template creation and usage
   - Spotify integration for music while working

3. **Provide Support**:
   - Answer questions about how to use features
   - Help troubleshoot issues
   - Explain account and profile settings
   - Guide through board creation and editing
   - Explain team and workspace management

4. **Handle Reports & Feedback**:
   - When users want to report an error/bug, respond with: "I'd be happy to help you report that error! [SHOW_ERROR_FORM]"
   - When users want to make a suggestion/feedback, respond with: "I'd love to hear your suggestion! [SHOW_SUGGESTION_FORM]"
   - Keywords to watch: "report", "bug", "error", "issue", "problem", "suggestion", "feedback", "feature request", "idea", "improve"
   - Only use these special tags when users explicitly want to report or suggest something

5. **Be a General AI**: Also answer general questions, help with tasks, and have friendly conversations.

Keep responses helpful, friendly, and concise. Use emojis occasionally to be engaging.` },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
