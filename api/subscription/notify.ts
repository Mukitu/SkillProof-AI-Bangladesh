import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("📥 Received bdapps subscription webhook event:", req.body);
    const { subscriberId, status, frequency, timeStamp } = req.body;

    if (!subscriberId || !status) {
      return res.status(400).json({ error: "subscriberId and status are required" });
    }

    if (supabase) {
      // Query profiles containing this subscriber ID
      const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('id, social_links, email')
        .or(`subscriber_id.eq.${subscriberId}`);

      if (findError) {
        console.error("Error finding profile with subscriber ID:", findError);
      }

      const isRegistered = status === "REGISTERED" || status === "REGISTERED.";
      const statusClean = isRegistered ? "REGISTERED" : "UNREGISTERED";
      const expiryDateStr = isRegistered ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;

      if (profiles && profiles.length > 0) {
        for (const p of profiles) {
          // Bypass Super Admin
          if (p.email === "nishat.af27@gmail.com") continue;

          const currentSocial = p.social_links || {};
          const socialLinks = {
            ...currentSocial,
            subscription: {
              ...(currentSocial.subscription || {}),
              premium: isRegistered,
              status: statusClean,
              expiryDate: expiryDateStr || ""
            }
          };

          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              premium: isRegistered,
              premium_expiry: expiryDateStr,
              subscription_status: statusClean,
              social_links: socialLinks
            })
            .eq('id', p.id);

          if (updateError) {
            console.error(`Error updating profile ${p.id} via webhook:`, updateError);
          } else {
            console.log(`Successfully updated user ${p.id} to ${statusClean} via webhook.`);
          }
        }
      } else {
        console.log(`No local profile found matching subscriberId: ${subscriberId}`);
      }
    }

    // Return a successful response to bdapps to acknowledge delivery
    return res.json({
      statusCode: "S1000",
      statusDetail: "Acknowledge successful delivery"
    });
  } catch (err: any) {
    console.error("Subscription Notify Webhook Error:", err);
    return res.status(500).json({ error: "Internal server error during webhook processing", details: err.message });
  }
}
