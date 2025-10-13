import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  name: string;
  email: string;
  message: string;
  reportType: "error" | "suggestion";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message, reportType }: ReportRequest = await req.json();

    // Validate inputs
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (name.length > 100 || email.length > 255 || message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Input exceeds maximum length" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@example.com";
    const subject = reportType === "error" 
      ? `🐛 Bug Report from ${name}` 
      : `💡 Feature Suggestion from ${name}`;

    const emailResponse = await resend.emails.send({
      from: "Workspace App <onboarding@resend.dev>",
      to: [adminEmail],
      replyTo: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
              .value { margin-bottom: 15px; }
              .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; word-wrap: break-word; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${reportType === "error" ? "🐛 New Bug Report" : "💡 New Feature Suggestion"}</h1>
              </div>
              <div class="content">
                <div class="info-box">
                  <div class="label">From:</div>
                  <div class="value">${name}</div>
                  
                  <div class="label">Email:</div>
                  <div class="value">${email}</div>
                  
                  <div class="label">Type:</div>
                  <div class="value">${reportType === "error" ? "Bug Report" : "Feature Suggestion"}</div>
                </div>

                <div class="label">Message:</div>
                <div class="message-box">${message}</div>

                <div class="footer">
                  <p>You can reply directly to this email to contact ${name}</p>
                  <p>Sent from Workspace App • ${new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Admin report email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-admin-report function:", error);
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
