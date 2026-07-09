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
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!supabase) {
      return res.json({ success: true, premium: false, message: "Supabase not connected" });
    }

    // 1. Fetch user's cached profile from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile) {
      return res.status(404).json({ error: "User profile not found in Supabase" });
    }

    const cachedPremium = profile.premium || profile.social_links?.subscription?.premium || false;
    const subscriberId = profile.subscriber_id || profile.social_links?.subscription?.subscriberId;

    // 2. If subscriber ID exists, double-check real-time state with bdapps
    if (subscriberId && !subscriberId.startsWith("tel:simulated")) {
      try {
        const appId = process.env.BDAPPS_APP_ID || "APP_000375";
        const password = process.env.BDAPPS_PASSWORD || "a07118cda5215fc6d01db5b2ab848edd";

        const response = await fetch("https://developer.bdapps.com/subscription/getStatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: appId,
            password: password,
            subscriberId: subscriberId
          }),
          signal: AbortSignal.timeout(4000)
        });

        const responseText = await response.text();
        let responseData: any = null;
        try {
          responseData = JSON.parse(responseText);
        } catch (parseErr) {
          console.warn("Failed to parse bdapps status check response as JSON. Raw length:", responseText.length);
        }
        console.log(`bdapps status check for ${subscriberId}:`, responseData);

        if (responseData && responseData.statusCode === "S1000") {
          const isRegistered = responseData.subscriptionStatus === "REGISTERED";

          // If local state doesn't match bdapps real-time state, update local state
          if (isRegistered !== cachedPremium) {
            console.log(`Mismatch found for ${subscriberId}: bdapps=${isRegistered}, local=${cachedPremium}. Syncing...`);
            
            const expiryDateStr = isRegistered ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;
            const currentSocial = profile.social_links || {};
            const updatedSocial = {
              ...currentSocial,
              subscription: {
                ...(currentSocial.subscription || {}),
                premium: isRegistered,
                status: responseData.subscriptionStatus,
                expiryDate: expiryDateStr || ""
              }
            };

            await supabase
              .from('profiles')
              .update({
                premium: isRegistered,
                premium_expiry: expiryDateStr,
                subscription_status: responseData.subscriptionStatus,
                social_links: updatedSocial
              })
              .eq('id', userId);

            return res.json({
              success: true,
              premium: isRegistered,
              subscriptionStatus: responseData.subscriptionStatus,
              mobileNumber: profile.mobile_number,
              expiryDate: expiryDateStr
            });
          }
        }
      } catch (apiErr: any) {
        console.error("Error querying real-time status from bdapps:", apiErr.message);
        // Graceful fallback to cached state if bdapps is down, rate-limited, or returns HTML
      }
    }

    // Return cached state
    return res.json({
      success: true,
      premium: cachedPremium,
      subscriptionStatus: profile.subscription_status || profile.social_links?.subscription?.status || "INACTIVE",
      mobileNumber: profile.mobile_number || profile.social_links?.subscription?.mobileNumber,
      expiryDate: profile.premium_expiry || profile.social_links?.subscription?.expiryDate
    });
  } catch (err: any) {
    console.error("Subscription Status Check Error:", err);
    return res.status(500).json({ error: "Internal server error during status check", details: err.message });
  }
}
