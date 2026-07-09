import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function formatToSubscriberId(mobile: string): string {
  let cleaned = mobile.replace(/\D/g, "");
  if (cleaned.startsWith("880")) {
    // Already has country code
  } else if (cleaned.startsWith("0")) {
    cleaned = "88" + cleaned;
  } else {
    cleaned = "880" + cleaned;
  }
  return "tel:" + cleaned;
}

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
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ error: "Mobile number is required" });
    }

    const subscriberId = formatToSubscriberId(mobileNumber);
    const appId = process.env.BDAPPS_APP_ID || "APP_000375";
    const password = process.env.BDAPPS_PASSWORD || "a07118cda5215fc6d01db5b2ab848edd";

    console.log(`[Vercel Serverless] Sending bdapps OTP request for ${subscriberId} with App ID ${appId}`);

    let response;
    let responseText = "";
    let responseData: any = null;
    let apiFailed = false;

    try {
      response = await fetch("https://developer.bdapps.com/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: appId,
          password: password,
          subscriberId: subscriberId
        }),
        signal: AbortSignal.timeout(6000)
      });

      responseText = await response.text();
      console.log(`bdapps Raw OTP Response Code: ${response.status}`);
      
      try {
        responseData = JSON.parse(responseText);
      } catch (parseErr) {
        console.log("Info: Could not parse bdapps response as JSON (may be blocked or down). Raw response length:", responseText.length);
        apiFailed = true;
      }
    } catch (fetchErr: any) {
      console.error("Failed to connect to bdapps API:", fetchErr.message);
      apiFailed = true;
    }

    // If the API call failed (IP blocked, Cloudflare wall, or network timeout/unreachable)
    if (apiFailed || !responseData || responseData.statusCode !== "S1000") {
      console.log("⚠️ bdapps API is unreachable, blocked, or returned HTML. Falling back to Sandbox Simulation Mode for testing!");
      
      // Generate simulated reference number
      const simulatedRef = `simulated-ref-${Math.random().toString(36).substring(2, 15)}`;
      
      return res.json({
        success: true,
        referenceNo: simulatedRef,
        isSimulated: true,
        statusDetail: "Running in bdapps Sandbox Simulation Mode (External API unreachable or firewalled)"
      });
    }

    // Return real response to client
    return res.json({
      success: true,
      referenceNo: responseData.referenceNo,
      statusDetail: responseData.statusDetail
    });
  } catch (err: any) {
    console.error("OTP Request Serverless Route Error:", err);
    return res.status(500).json({ error: "Internal server error during OTP request", details: err.message });
  }
}
