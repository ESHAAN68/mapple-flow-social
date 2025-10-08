import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  inviteeEmail: string;
  inviteeName: string;
  inviterName: string;
  boardTitle: string;
  boardId: string;
  boardUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      inviteeEmail, 
      inviteeName, 
      inviterName, 
      boardTitle, 
      boardId,
      boardUrl 
    }: InvitationRequest = await req.json();

    console.log('Sending board invitation email to:', inviteeEmail);

    const emailResponse = await resend.emails.send({
      from: "Mapple Draw <onboarding@resend.dev>",
      to: [inviteeEmail],
      subject: `${inviterName} invited you to collaborate on "${boardTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: 600;
              }
              .board-info {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #667eea;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #6b7280;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎨 Board Invitation</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi ${inviteeName},</p>
              
              <p style="font-size: 16px;">
                <strong>${inviterName}</strong> has invited you to collaborate on their board:
              </p>
              
              <div class="board-info">
                <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 20px;">${boardTitle}</h2>
                <p style="margin: 0; color: #6b7280;">You've been added as a collaborator with edit permissions.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${boardUrl}" class="button">
                  Open Board →
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Click the button above or copy this link to your browser:<br>
                <a href="${boardUrl}" style="color: #667eea; word-break: break-all;">${boardUrl}</a>
              </p>
              
              <div class="footer">
                <p>You're receiving this email because ${inviterName} invited you to collaborate on Mapple Draw.</p>
                <p style="margin-top: 10px;">
                  <a href="${boardUrl}" style="color: #667eea; text-decoration: none;">Mapple Draw</a> - Collaborative Whiteboard
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-board-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
