import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from 'groq-sdk';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // --- AI API Proxy Routes ---

  // Groq Proxy
  app.post("/api/ai/groq", async (req, res) => {
    try {
      const { prompt, model, temperature, max_tokens, seed, response_format } = req.body;
      const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Groq API key not configured on server" });
      }

      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model || "llama-3.3-70b-versatile",
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 1024,
        ...(seed !== undefined ? { seed } : {}),
        ...(response_format ? { response_format } : {}),
      });
      res.json(completion);
    } catch (error: any) {
      console.error("Groq Proxy Error:", error);
      res.status(500).json({ error: "AI Proxy request failed", details: error.message });
    }
  });

  
  // --- BDApps API Integration & Mock Sandbox ---
  
  // In-memory subscription database for demo purposes when Supabase is mock/local
  const bdappsSubscriptions = new Map<string, { email: string; phone: string; status: "REGISTERED" | "UNREGISTERED" }>();
  const activeOtpRequests = new Map<string, { phone: string; otp: string; referenceNo: string }>();

  // Helper to standardise phone number (add tel:88 if missing)
  const formatSubscriberId = (phone: string) => {
    let raw = phone.replace(/[^0-9]/g, '');
    if (raw.startsWith('0')) {
      raw = '88' + raw;
    } else if (!raw.startsWith('880') && raw.length === 10) {
      raw = '880' + raw;
    }
    return `tel:${raw}`;
  };

  // 1. Check user subscription status
  app.post("/api/bdapps/status", async (req, res) => {
    try {
      const { email, phone } = req.body;
      const appId = process.env.BDAPPS_APP_ID;
      const appPassword = process.env.BDAPPS_PASSWORD;
      const bdappsUrl = process.env.BDAPPS_SERVER_URL || "https://developer.bdapps.com";

      if (!email && !phone) {
        return res.status(400).json({ error: "Email or phone is required" });
      }

      // First check in-memory / local state
      let localSub = Array.from(bdappsSubscriptions.values()).find(s => s.email === email || s.phone === phone);
      
      // If we have real BDApps credentials, query live BDApps status
      if (appId && appPassword && phone) {
        try {
          const subscriberId = formatSubscriberId(phone);
          const response = await fetch(`${bdappsUrl}/subscription/getStatus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationId: appId,
              password: appPassword,
              subscriberId: subscriberId
            })
          });

          const data: any = await response.json();
          if (data.statusCode === "S1000") {
            const isSubscribed = data.subscriptionStatus === "REGISTERED";
            
            // Sync with local memory database
            if (email) {
              bdappsSubscriptions.set(email, {
                email,
                phone,
                status: data.subscriptionStatus
              });
            }

            return res.json({
              success: true,
              subscribed: isSubscribed,
              status: data.subscriptionStatus,
              provider: "bdapps",
              details: data.statusDetail
            });
          }
        } catch (e: any) {
          console.error("Real BDApps status check failed:", e.message);
        }
      }

      // Fallback to local checked status if available
      if (localSub) {
        return res.json({
          success: true,
          subscribed: localSub.status === "REGISTERED",
          status: localSub.status,
          provider: "bdapps"
        });
      }

      return res.json({
        success: true,
        subscribed: false,
        status: "UNREGISTERED",
        provider: "bdapps"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Request OTP to Subscribe
  app.post("/api/bdapps/otp-request", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const formattedPhone = phone.replace(/[^0-9]/g, '');
      const subscriberId = formatSubscriberId(phone);
      
      const appId = process.env.BDAPPS_APP_ID;
      const appPassword = process.env.BDAPPS_PASSWORD;
      const bdappsUrl = process.env.BDAPPS_SERVER_URL || process.env.BDAPPS_BASE_URL || "https://developer.bdapps.com";

      // If we have credentials, make actual BDApps API call
      if (appId && appPassword && appId !== "APP_XXXXXX" && appPassword !== "your_bdapps_api_password") {
        try {
          const payload = {
            applicationId: appId,
            password: appPassword,
            subscriberId: subscriberId,
            applicationHash: "SkillProofHash",
            applicationMetaData: {
              client: "WEB",
              device: "Browser",
              os: "WebBrowser",
              appCode: "https://skillproof.top"
            }
          };

          const response = await fetch(`${bdappsUrl}/otp/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify(payload)
          });

          const data: any = await response.json();
          if (data.statusCode === "S1000") {
            return res.json({
              success: true,
              referenceNo: data.referenceNo,
              mode: "live",
              message: "OTP sent successfully to your mobile number."
            });
          } else {
            return res.status(400).json({
              error: data.statusDetail || `Failed to request OTP from BDApps (Code: ${data.statusCode})`,
              code: data.statusCode
            });
          }
        } catch (e: any) {
          console.error("Real BDApps OTP Request failed:", e.message);
          return res.status(502).json({
            error: `BDApps API Connection failed: ${e.message}. Please try again later.`
          });
        }
      }

      return res.status(400).json({
        error: "BDApps configuration is missing or invalid. Please configure BDAPPS_APP_ID and BDAPPS_PASSWORD."
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Verify OTP to activate Subscription
  app.post("/api/bdapps/otp-verify", async (req, res) => {
    try {
      const { referenceNo, otp, email } = req.body;
      if (!referenceNo || !otp || !email) {
        return res.status(400).json({ error: "ReferenceNo, OTP, and user email are required" });
      }

      const appId = process.env.BDAPPS_APP_ID;
      const appPassword = process.env.BDAPPS_PASSWORD;
      const bdappsUrl = process.env.BDAPPS_SERVER_URL || process.env.BDAPPS_BASE_URL || "https://developer.bdapps.com";

      // If live credentials are setup
      if (appId && appPassword && appId !== "APP_XXXXXX" && appPassword !== "your_bdapps_api_password") {
        try {
          const response = await fetch(`${bdappsUrl}/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify({
              applicationId: appId,
              password: appPassword,
              referenceNo: referenceNo,
              otp: otp
            })
          });

          const data: any = await response.json();
          if (data.statusCode === "S1000") {
            const phoneNum = data.subscriberId ? data.subscriberId.replace("tel:", "") : "unknown";
            
            // Register subscription in memory database
            bdappsSubscriptions.set(email, {
              email: email,
              phone: phoneNum,
              status: "REGISTERED"
            });

            return res.json({
              success: true,
              message: "Subscription activated successfully!",
              status: "REGISTERED",
              mode: "live"
            });
          } else {
            return res.status(400).json({
              error: data.statusDetail || `Invalid OTP code (Code: ${data.statusCode})`,
              code: data.statusCode
            });
          }
        } catch (e: any) {
          console.error("Real BDApps OTP Verification failed:", e.message);
          return res.status(502).json({
            error: `BDApps API Connection failed during verification: ${e.message}. Please try again.`
          });
        }
      }

      return res.status(400).json({
        error: "BDApps configuration is missing or invalid. OTP verification failed."
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Unsubscribe Service (Bootcamp required)
  app.post("/api/bdapps/unsubscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const appId = process.env.BDAPPS_APP_ID;
      const appPassword = process.env.BDAPPS_PASSWORD;
      const bdappsUrl = process.env.BDAPPS_SERVER_URL || "https://developer.bdapps.com";

      const sub = bdappsSubscriptions.get(email);
      const phone = sub ? sub.phone : null;

      if (appId && appPassword && phone) {
        try {
          const subscriberId = formatSubscriberId(phone);
          const response = await fetch(`${bdappsUrl}/subscription/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationId: appId,
              password: appPassword,
              subscriberId: subscriberId,
              action: 0 // 0 means unsubscribe
            })
          });

          const data: any = await response.json();
          if (data.statusCode === "S1000") {
            bdappsSubscriptions.set(email, {
              ...sub!,
              status: "UNREGISTERED"
            });

            return res.json({
              success: true,
              message: "Unsubscribed successfully from BDApps carrier billing.",
              mode: "live"
            });
          } else {
            return res.status(400).json({
              error: data.statusDetail || `Failed to unsubscribe from BDApps (Code: ${data.statusCode})`
            });
          }
        } catch (e: any) {
          console.error("Real BDApps unsubscription failed:", e.message);
          return res.status(502).json({
            error: `BDApps API Connection failed: ${e.message}`
          });
        }
      }

      return res.status(400).json({
        error: "BDApps configuration is missing or user phone not found. Cannot complete unsubscription."
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Webhook callback notifier service (notify service from BDApps)
  app.post("/api/bdapps/callback", async (req, res) => {
    try {
      const { subscriberId, status, applicationId } = req.body;
      console.log(`[BDApps Webhook Callback Received] App: ${applicationId}, Subscriber: ${subscriberId}, Status: ${status}`);

      if (subscriberId) {
        const rawPhone = subscriberId.replace("tel:", "").replace(/^88/, "");
        
        // Find existing record in memory map & update it
        for (const [email, sub] of bdappsSubscriptions.entries()) {
          const subPhoneClean = sub.phone.replace(/^88/, "");
          if (subPhoneClean === rawPhone) {
            bdappsSubscriptions.set(email, {
              ...sub,
              status: status === "REGISTERED" ? "REGISTERED" : "UNREGISTERED"
            });
            console.log(`[BDApps Webhook] Updated user ${email} subscription status to ${status}`);
          }
        }
      }

      // Always return S1000 success code to BDApps callback system
      res.json({
        statusCode: "S1000",
        statusDetail: "Success callback received."
      });
    } catch (err: any) {
      console.error("Webhook callback error:", err);
      res.status(500).json({ statusCode: "E1601", statusDetail: err.message });
    }
  });

  // 6. Send Alert SMS on Password Failure
  app.post("/api/bdapps/sms-alert", async (req, res) => {
    try {
      const { phone, email } = req.body;
      const message = `Security Alert: Suspicious login attempt with wrong password on SkillProof account for ${email}. If this wasn't you, please secure your account.`;
      
      const appId = process.env.BDAPPS_APP_ID;
      const appPassword = process.env.BDAPPS_PASSWORD;
      const bdappsUrl = process.env.BDAPPS_SERVER_URL || "https://developer.bdapps.com";

      if (appId && appPassword && phone) {
        try {
          const subscriberId = formatSubscriberId(phone);
          const response = await fetch(`${bdappsUrl}/sms/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify({
              version: "1.0",
              applicationId: appId,
              password: appPassword,
              message: message,
              destinationAddresses: [subscriberId]
            })
          });
          const data: any = await response.json();
          console.log("[BDApps SMS Alert Response]:", data);
          return res.json({ success: true, mode: "live", details: data });
        } catch (e: any) {
          console.error("Failed to send live SMS alert:", e.message);
          return res.status(502).json({ error: `Failed to send live SMS: ${e.message}` });
        }
      }

      return res.status(400).json({
        error: "BDApps configuration is missing. Live SMS Alert could not be sent."
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // QR Code Proxy to bypass CORS
  app.get("/api/qr-proxy", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      const decodedUrl = decodeURIComponent(url as string);
      const response = await fetch(decodedUrl);
      const blob = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/png";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(Buffer.from(blob));
    } catch (error: any) {
      console.error("QR Proxy Error:", error);
      res.status(500).json({ error: "Failed to proxy QR code", details: error.message });
    }
  });

  // --- Static Assets & Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (typeof PORT === "string" && isNaN(Number(PORT))) {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on Passenger socket: ${PORT}`);
    });
  } else {
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
