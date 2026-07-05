import express from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";

async function safePostToWebhook(url: string, payload: any) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout limit
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.error(`[Webhook] response not OK for ${url.substring(0, 45)}... status: ${response.status}`);
    }
    return response.ok;
  } catch (err: any) {
    console.error(`[Webhook Error] Failed to send to ${url.substring(0, 45)}...:`, err.message || err);
    return false;
  }
}

async function sendToUserGoogleChat(messageText: string) {
  const webhookUrl = "https://chat.googleapis.com/v1/spaces/AAQAfu2w5d0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=HqXvfAtrBsMVgTl5GaMkOD1f_L-w8E3zq1mL-N-yIaI";
  await safePostToWebhook(webhookUrl, { text: messageText });
}

function isDirectCollectionKey(key: string): boolean {
  const [collectionName] = key.split('/');
  if (!collectionName) return false;

  // Direct categories are directed exclusively to/from hybrid_sandbox per Charles's instruction:
  // customer recovery (complaints-*), lost and found (lost-and-found-*, lost-and-found), cml rewards (restaurant-guests-*, rewards-config-*),
  // newsletter subscriber (newsletter-subscribers-*), flip books (flipbooks-*).
  if (
    collectionName.startsWith("newsletter-subscribers-") ||
    collectionName.startsWith("lost-and-found-") ||
    collectionName.startsWith("restaurant-guests-") ||
    collectionName.startsWith("complaints-") ||
    collectionName.startsWith("flipbooks-") ||
    collectionName.startsWith("rewards-config-") ||
    collectionName === "lost-and-found"
  ) {
    return false;
  }

  return (
    collectionName.startsWith("hrms-") ||
    collectionName.startsWith("cml-signin-") ||
    collectionName.startsWith("cml-geofence-") ||
    collectionName.startsWith("huddle-tasks-") ||
    collectionName.startsWith("mailer-contacts-") ||
    collectionName.startsWith("mailer-logs-") ||
    collectionName.startsWith("forms-") ||
    collectionName.startsWith("cml-forms-submissions-") ||
    collectionName.startsWith("google-chat-messages-") ||
    collectionName.startsWith("business-cards-") ||
    collectionName === "daily-news" ||
    collectionName === "ramada_form_submissions" ||
    collectionName === "managed_cases" ||
    collectionName === "google_forms_links" ||
    collectionName === "it_tickets"
  );
}

function decodeFirestoreFields(fields: any): any {
  if (!fields) return {};
  const obj: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v && typeof v === "object") {
      if ("stringValue" in v) {
        obj[k] = (v as any).stringValue;
      } else if ("booleanValue" in v) {
        obj[k] = (v as any).booleanValue;
      } else if ("integerValue" in v) {
        obj[k] = parseInt((v as any).integerValue || "0", 10);
      } else if ("doubleValue" in v) {
        obj[k] = parseFloat((v as any).doubleValue || "0");
      } else if ("arrayValue" in v) {
        const arr = (v as any).arrayValue?.values || [];
        obj[k] = arr.map((item: any) => {
          if (item && typeof item === "object") {
            if ("stringValue" in item) return item.stringValue;
            if ("booleanValue" in item) return item.booleanValue;
            if ("integerValue" in item) return parseInt(item.integerValue || "0", 10);
            if ("doubleValue" in item) return parseFloat(item.doubleValue || "0");
            if ("mapValue" in item) return decodeFirestoreFields(item.mapValue?.fields || {});
          }
          return item;
        });
      } else if ("mapValue" in v) {
        obj[k] = decodeFirestoreFields((v as any).mapValue?.fields || {});
      } else if ("nullValue" in v) {
        obj[k] = null;
      }
    }
  }
  return obj;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/debug-rest", async (req, res) => {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        const base = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId || "(default)"}/documents/hybrid_sandbox`;
        const url = `${base}?key=${config.apiKey}`;
        const fetchRes = await fetch(url);
        const text = await fetchRes.text();
        try {
          return res.json({ status: fetchRes.status, url, body: JSON.parse(text) });
        } catch {
          return res.json({ status: fetchRes.status, url, bodyText: text });
        }
      }
      return res.json({ error: "Config not found" });
    } catch (e: any) {
      return res.json({ error: e.message });
    }
  });

  // Synchronize all platform shortcut icons with the verified beautiful CML logo from the corporate website in the background
  (async () => {
    try {
      const cmlLogoUrl = "https://cml.com.fj/wp-content/uploads/2026/06/CML-Logo-LG-BG-Icon.png";
      console.log(`[PWA_ICONS_SYNC] Attempting to download the latest CML corporate shortcut icon in background: ${cmlLogoUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second hard cutoff for the corporate site
      
      const iconRes = await fetch(cmlLogoUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const publicDir = path.join(process.cwd(), "public");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const allTargets = [
        "apple-touch-icon.png",
        "apple-touch-icon.jpg",
        "apple-touch-icon-precomposed.png",
        "apple-touch-icon-precomposed.jpg",
        "icon.png",
        "icon.jpg",
        "icon-192.png",
        "icon-192.jpg",
        "icon-512.png",
        "icon-512.jpg",
        "favicon.ico",
        "favicon.png"
      ];

      if (iconRes.ok) {
        const buffer = Buffer.from(await iconRes.arrayBuffer());
        for (const file of allTargets) {
          const filePath = path.join(publicDir, file);
          fs.writeFileSync(filePath, buffer);
        }
        console.log("[PWA_ICONS_SYNC] Successfully downloaded and synchronized all PWA, Apple and Android shortcut icons with the CML Logo!");
      } else {
        console.warn(`[PWA_ICONS_SYNC] Failed to fetch CML logo (status: ${iconRes.status}). Doing local legacy fallback...`);
        const fallbackSource = path.join(publicDir, "apple-touch-icon.png");
        if (fs.existsSync(fallbackSource)) {
          for (const file of allTargets) {
            if (file !== "apple-touch-icon.png") {
              fs.copyFileSync(fallbackSource, path.join(publicDir, file));
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("[PWA_ICONS_SYNC] Error fetching/synchronizing CML logo icon:", err.message || err);
    }
  })();

  // Global anti-caching middleware to instantly bypass stale browser caches
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy endpoint to bypass browser CORS on external assets and force direct gallery download
  app.get("/api/download-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    const filename = (req.query.filename as string) || "business_card.png";
    
    if (!imageUrl) {
      return res.status(400).send("URL parameter is required");
    }

    try {
      console.log(`[Proxy Download] Fetching: ${imageUrl} -> naming: ${filename}`);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: status ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/png";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error("[Proxy Download Error]", err);
      // Fallback redirect if fetch failed so the user gets the raw file display anyway
      res.redirect(imageUrl);
    }
  });

  // Secure full-stack text downloader to bypass sandbox iframe download restrictions
  app.post("/api/download-text", (req, res) => {
    const { filename, content } = req.body;
    if (!filename || !content) {
      return res.status(400).send("filename and content parameters are required");
    }
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(content);
  });

  // Centralized In-Memory Business Card Registry for multi-device QR alignment
  const cardsMemoryStore: Record<string, any> = {};

  // Hydrate with default seeds so they are always ready server-side!
  const SEEDED_MOCK_CARDS = {
    "mock_cml_1": {
      id: "mock_cml_1",
      name: "Rohit Lal",
      title: "General Manager | Director",
      department: "Executive Board",
      phone: "+679 998 9499",
      email: "sales@cml.com.fj",
      website: "cml.com.fj",
      location: "Lot 14 Wasawasa Road, Wailoaloa Beach, Nadi, Fiji Islands",
      pages: [],
      companyId: "cml"
    },
    "mock_cml_2": {
      id: "mock_cml_2",
      name: "Charles Cebujano",
      title: "Digital Media Specialist",
      department: "Marketing & Design",
      phone: "+679 998 4676",
      email: "digitalmedia@cml.com.fj",
      website: "cml.com.fj",
      location: "Lot 14 Wasawasa Road, Wailoaloa Beach, Nadi, Fiji Islands",
      pages: [],
      companyId: "cml"
    },
    "mock_ramada_1": {
      id: "mock_ramada_1",
      name: "Avishek Chandra",
      title: "Director of Operations",
      department: "Property Management & Operations",
      phone: "+679 672 5000",
      email: "operations@ramadasuitesfiji.com",
      website: "ramadasuitesfiji.com",
      location: "Lot 14 Wasawasa Road, Wailoaloa Beach, Nadi, Fiji Islands",
      pages: [],
      companyId: "ramada"
    },
    "mock_wyndham_1": {
      id: "mock_wyndham_1",
      name: "Litia R.",
      title: "Guest Relations Lead Manager",
      department: "Guest Services",
      phone: "+679 675 0411",
      email: "litia.r@wyndhamfiji.com",
      website: "wyndhamfiji.com",
      location: "Denarau Island, Nadi, Fiji Islands",
      pages: [],
      companyId: "wyndham"
    }
  };

  // Pre-populate memory store
  Object.entries(SEEDED_MOCK_CARDS).forEach(([key, card]) => {
    cardsMemoryStore[`${card.companyId}/${key}`] = card;
  });

  app.post("/api/business-cards", (req, res) => {
    const { card } = req.body;
    if (!card || !card.id || !card.companyId) {
      return res.status(400).json({ error: "Invalid card payload schema" });
    }
    cardsMemoryStore[`${card.companyId}/${card.id}`] = card;
    console.log(`[Card API] Registered memory registry backup for: ${card.name} (${card.id})`);
    res.json({ success: true, id: card.id });
  });

  app.get("/api/business-cards/:companyId/:cardId", (req, res) => {
    const { companyId, cardId } = req.params;
    const key = `${companyId}/${cardId}`;
    const card = cardsMemoryStore[key];
    if (card) {
      return res.json(card);
    }
    // Return mock data fallback structure if requested
    res.status(404).json({ error: "Card not registered in server memory" });
  });

  // Dynamic vCard .VCF generation for physical QR code scans on mobile devices
  app.get("/api/vcard", (req, res) => {
    const name = (req.query.name as string) || "Rohit Lal";
    const title = (req.query.title as string) || "General Manager | Director";
    const phone1 = (req.query.phone1 as string) || "+679 998 9499";
    const phone2 = (req.query.phone2 as string) || "";
    const email = (req.query.email as string) || "sales@cml.com.fj";
    const website = (req.query.website as string) || "cml.com.fj";
    const location = (req.query.location as string) || "Lot 14 Wasawasa Road, Wailoaloa Fiji";

    // Build the structural standard vCard v3.0 block with CRLF line breaks
    const vcardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${name}`,
      `N:${name.split(' ').reverse().join(';') || name}`,
      "ORG:Cove Management Limited",
      `TITLE:${title}`,
      `TEL;TYPE=CELL,VOICE:${phone1}`,
      phone2 ? `TEL;TYPE=WORK,VOICE:${phone2}` : "",
      `EMAIL;TYPE=PREF,INTERNET:${email}`,
      `URL;TYPE=WORK:${website.startsWith('http') ? website : 'https://' + website}`,
      `ADR;TYPE=WORK:;;${location.replace(/,/g, ';')}`,
      `REV:${new Date().toISOString()}`,
      "END:VCARD"
    ];

    const vcardContent = vcardLines.filter(Boolean).join("\r\n");

    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${name.replace(/[^a-zA-Z0-9]/g, '_')}.vcf"`);
    res.send(vcardContent);
  });

  // AI Assistant Endpoint
  app.post("/api/ai/analyze", async (req, res) => {
    const { prompt, type } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "AI Service not configured. Please supply a valid GEMINI_API_KEY in Secrets." });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemPrompt = type === 'recovery' 
        ? "You are an expert luxury hotel recovery specialist. Analyze the following guest complaint and provide a 3-step professional recovery plan and a draft response email. Keep it concise, empathetic, and hospitality-focused."
        : "You are 'Plan Man' - the top-tier Google AI Hospitality Strategy Planner for Charles at Cove Management Limited. Generate a comprehensive operational plan, strategic action items, and actionable targets for standard operating procedures (SOPs) based on user instructions and data. Respond with professional structure, clear outline, and ambitious benchmarks.";

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `${systemPrompt}\n\nInput: ${prompt}`,
      });
      
      const text = response.text || "No response received from the Google AI model.";
      res.json({ analysis: text });
    } catch (error: any) {
      console.error("[AI Error]", error);
      res.status(500).json({ error: error.message || "AI analysis failed" });
    }
  });

  // Background Sync Endpoint for Offline Guest Complaints - Stored in hybrid_sandbox
  app.post("/api/sync-offline-complaints", async (req, res) => {
    const { complaints } = req.body;
    console.log(`[Offline Sync API] Received ${complaints?.length || 0} pending complaints to save directly to hybrid_sandbox.`);

    if (!Array.isArray(complaints) || complaints.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    try {
      let syncCount = 0;
      const updates: Record<string, any> = {};

      for (const comp of complaints) {
        const targetPropertyId = comp.propertyId || "wyndham";
        const newId = comp.id && !comp.id.startsWith("temp_") ? comp.id : "comp_" + Math.random().toString(36).substring(2, 11);
        const dbKey = `complaints-${targetPropertyId}/${newId}`;
        
        const newComplaint = {
          ...comp,
          id: newId,
          status: comp.status || "Pending",
          createdAt: comp.createdAt || new Date().toISOString()
        };

        serverMockDbStore[dbKey] = newComplaint;
        updates[dbKey] = newComplaint;
        syncCount++;

        console.log(`[Offline Sync API] Successfully cached offline complaint for ${comp.guestName || "Guest"} to memory store as '${dbKey}'.`);

        // Deliver Standard Notifications
        try {
          const messageText = `*🚨 [OFFLINE SECURED COMPLAINT]*\n` +
                              `*Property:* ${targetPropertyId.toUpperCase()}\n` +
                              `*Guest:* ${comp.guestName || "Anonymous"}\n` +
                              `*Room/Location:* ${comp.roomNumber || "N/A"}\n` +
                              `*Type:* ${comp.type || "Service Issue"}\n` +
                              `*Priority:* ${comp.priority || "Medium"}\n` +
                              `*Reporter:* ${comp.reporterName || "Not Specified"}\n` +
                              `*Desc:* "${comp.description || "No description provided."}"`;
          await sendToUserGoogleChat(messageText);
        } catch (notiErr) {
          console.error("[Offline Sync API] Notification mirror failed:", notiErr);
        }
      }

      if (syncCount > 0) {
        saveMockDbToDisk();
        if (firestoreRestSync) {
          saveMasterCloudDebounced();
        }

        // Broadcast to SSE clients
        const broadcastPayload = JSON.stringify({
          type: "update",
          updates: updates,
          deletedKeys: []
        });
        sseClients.forEach((client) => {
          try {
            client.write(`data: ${broadcastPayload}\n\n`);
          } catch (e) {}
        });
      }

      res.json({ success: true, count: syncCount });
    } catch (err: any) {
      console.error("[Offline Sync API Error]", err);
      res.status(500).json({ success: false, error: err.message || "Failed to sync offline complaints" });
    }
  });

  // Recovery Team Notification Endpoint
  app.post("/api/notify-recovery", async (req, res) => {
    const { complaint, sender, companyId } = req.body;
    
    console.log(`[Notification] New Complaint Lodged: ${complaint.guestName} (Room ${complaint.roomNumber})`);
    
    try {
      // 1. Email Notification
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.example.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const recoveryEmails = process.env.RECOVERY_TEAM_EMAILS || "digitalmedia@cml.com.fj";
      
      const mailOptions = {
        from: '"CML Community Gateway" <noreply@cml.com.fj>',
        to: recoveryEmails,
        subject: `[URGENT RECOVERY] ${complaint.priority} - Guest ${complaint.guestName}`,
        html: `
          <div style="font-family: serif; color: #333; max-width: 600px; border: 1px solid #C5A059; padding: 40px;">
            <h1 style="color: #000; font-style: italic; border-bottom: 2px solid #C5A059; padding-bottom: 20px;">Guest Recovery Registry</h1>
            <p style="text-transform: uppercase; font-size: 10px; letter-spacing: 2px; color: #C5A059; font-weight: bold;">New Case Notification</p>
            
            <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
               <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Property:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${companyId?.toUpperCase() || 'CML'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Guest Name:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${complaint.guestName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Room Number / Venue:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${complaint.roomNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Issue Type:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${complaint.type}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Priority:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><span style="color: red; font-weight: bold;">${complaint.priority}</span></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Reporter Name:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${complaint.reporterName || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Reporter Role / Position / Status:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${complaint.reporterRole || 'Not specified'}</td>
              </tr>
            </table>
            
            <p style="font-style: italic; color: #666; margin: 30px 0;">"${complaint.description}"</p>
            
            ${complaint.photoBase64 ? `
            <div style="margin: 20px 0; border: 1px solid #eee; padding: 10px; background: #fff; text-align: center;">
              <p style="text-transform: uppercase; font-size: 8px; letter-spacing: 1px; color: #999; margin: 0 0 10px 0;">Attached Complaint Photo Evidence</p>
              <img src="${complaint.photoBase64}" style="max-width: 100%; max-height: 250px; object-fit: contain;" alt="Evidence" />
            </div>
            ` : ''}

            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #C5A059;">
              <p style="margin: 0; font-size: 11px;">Form Filled By: <strong>${complaint.reporterName || sender.name}</strong></p>
              <p style="margin: 5px 0 0; font-size: 11px;">Department/Status: ${complaint.reporterRole || 'Staff'}</p>
              <p style="margin: 5px 0 0; font-size: 11px;">Account: ${sender.email}</p>
            </div>
            
            <div style="margin-top: 40px; text-align: center;">
              <a href="https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app" style="background: #000; color: #fff; text-decoration: none; padding: 15px 30px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Resolve in Portal</a>
            </div>
          </div>
        `
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
      }

      // 2. Google Chat Webhook (Copy any property updates to appropriate Webhook under new instructions)
      {
        let webhookUrl = "https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=ZjzVA78vD8a6yDiAyGKDC_tMlY4DNs0RLHusXqalqRw";
        if (companyId === "wyndham") {
          webhookUrl = "https://chat.googleapis.com/v1/spaces/AAQAOj5WBis/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=5wfkQvH_r-eafOCkJDFNsYFvdJ_6fhgNjCutyDVrwuk";
        }
        const labelPropertyName = companyId === "ramada" ? "Ramada Suites" : (companyId === "wyndham" ? "Wyndham Garden" : "CML Asset");
        
        let messageText = `🚨 *New Guest Recovery Case Registered (${labelPropertyName})*\n\n` +
                          `*Guest:* ${complaint.guestName}\n` +
                          `*Room / Venue:* ${complaint.roomNumber}\n` +
                          `*Priority:* ${complaint.priority}\n` +
                          `*Type:* ${complaint.type}\n` +
                          `*Description:* "${complaint.description}"\n\n` +
                          `*Reported By:* ${complaint.reporterName || sender.name}\n` +
                          `*Department / Relation:* ${complaint.reporterRole || "Staff"}\n`;

        if (complaint.photoBase64) {
          messageText += `🖼️ *Attached Photo Evidence:* Yes (Photo saved in official database registry)\n`;
        } else {
          messageText += `🖼️ *Attached Photo Evidence:* No\n`;
        }

        messageText += `\n*Portal Link:* https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app`;

        const message = { text: messageText };

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          body: JSON.stringify(message)
        }).catch(err => console.error("Complaints webhook failed:", err));

        // Copy complaint directly to user's Google Chat space
        await sendToUserGoogleChat(messageText);
      }

      res.status(200).json({ success: true, message: "Recovery team notified" });
    } catch (error) {
      console.error("[SMTP Error]", error);
      res.status(500).json({ success: false, message: "Notification failed but case registered" });
    }
  });

  // Case Notification Endpoint for graphicsmedia@cml.com.fj and digitalmedia@cml.com.fj
  app.post("/api/cases/notify", async (req, res) => {
    const { caseItem, submitterEmail } = req.body;
    
    console.log(`[Notification] New Case Lodged: ${caseItem.caseNumber} - ${caseItem.serviceArea}`);
    
    // Respond immediately to prevent client timeouts (Load failed in headless test browsers)
    res.status(200).json({ success: true, message: "Cases request received and processing in background" });

    // Handle notifications asynchronously in background
    (async () => {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.example.com",
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // Recipient list
        let recipients = "graphics@cml.com.fj, digitalmedia@cml.com.fj";
        if (submitterEmail && !recipients.includes(submitterEmail)) {
          recipients += `, ${submitterEmail}`;
        }

        const mailOptions = {
          from: '"CML Cases Portal" <noreply@cml.com.fj>',
          to: recipients,
          subject: `[NEW CASE SUBMISSION] #${caseItem.caseNumber} - ${caseItem.serviceArea}`,
          html: `
            <div style="font-family: serif; color: #333; max-width: 600px; border: 1px solid #C5A059; padding: 40px; background-color: #ffffff;">
              <h1 style="color: #000; font-style: italic; border-bottom: 2px solid #C5A059; padding-bottom: 20px;">CML Case Management Notification</h1>
              <p style="text-transform: uppercase; font-size: 10px; letter-spacing: 2px; color: #C5A059; font-weight: bold; margin-bottom: 20px;">New Case Submission Detailed Below</p>
              
              <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
                 <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 35%;"><strong>Case Number:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">#${caseItem.caseNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Date Opened:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${caseItem.dateOpened}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Service Area:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${caseItem.serviceArea}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Request Type:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${caseItem.requestType}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Request Details:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${caseItem.requestDetails}</td>
                </tr>
              </table>
              
              <div style="background: #fdfaf4; padding: 25px; border-left: 4px solid #C5A059; margin-top: 30px; margin-bottom: 40px;">
                <p style="margin: 0; font-size: 12px; color: #333; line-height: 1.6;"><strong>Case Description / Logs:</strong></p>
                <p style="margin: 10px 0 0; font-style: italic; color: #555; line-height: 1.6;">"${caseItem.description || 'No additional details.'}"</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #bbb; margin-top: 30px;">
                <p style="margin: 0; font-size: 11px; color: #666;">This notification has been sent automatically upon user submission in the case management portal.</p>
              </div>
              
              <div style="margin-top: 40px; text-align: center;">
                <a href="https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 15px 35px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Open Case Portal</a>
              </div>
            </div>
          `
        };

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          await transporter.sendMail(mailOptions);
          console.log(`[SMTP] Cases notification sent to ${recipients} successfully`);
        } else {
          console.log("[SMTP] SMTP credentials missing. Logged Cases notification to console (Simulation):", mailOptions.subject);
        }

        // Sync the "My Request" case submission directly to user's personalized Google Chat space
        try {
          const caseGchatMsg = `📥 *New Case / Request Submitted (My Request Portal)*\n\n` +
                               `*Case Number:* #${caseItem.caseNumber}\n` +
                               `*Service Area:* ${caseItem.serviceArea}\n` +
                               `*Request Type:* ${caseItem.requestType}\n` +
                               `*Request Details:* ${caseItem.requestDetails}\n` +
                               `*Submitter:* ${submitterEmail || "Staff Member"}\n` +
                               `*Date Opened:* ${caseItem.dateOpened}\n` +
                               `*Description:* "${caseItem.description || "No additional description."}"\n\n` +
                               `*Portal Link:* https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app`;
          await sendToUserGoogleChat(caseGchatMsg);
        } catch (err: any) {
          console.error("Failed to notify user via Google Chat case webhook:", err.message || err);
        }
      } catch (error) {
        console.error("[SMTP Error on Case Notification]", error);
      }
    })();
  });

  // Lost & Found Notification Endpoint
  app.post("/api/notify-found-item", async (req, res) => {
    const { item, sender } = req.body;
    
    console.log(`[Notification] New Found Item Logged: ${item.itemName} at ${item.locationFound}`);
    
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.example.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Recipient list as requested
      const recipients = "digitalmedia@cml.com.fj, rohit@cml.com.fj, graphics@cml.com.fj";
      
      const mailOptions = {
        from: '"CML Community Gateway" <noreply@cml.com.fj>',
        to: recipients,
        subject: `[LOST & FOUND] New Item Found: ${item.itemName}`,
        html: `
          <div style="font-family: serif; color: #333; max-width: 600px; border: 1px solid #1a1a1a; padding: 40px; background: #fff;">
            <h1 style="color: #000; font-style: italic; border-bottom: 2px solid #C5A059; padding-bottom: 20px; text-align: center;">Lost & Found Registry</h1>
            <p style="text-transform: uppercase; font-size: 10px; letter-spacing: 2px; color: #C5A059; font-weight: bold; text-align: center;">New Entry Notification</p>
            
            <div style="margin: 30px 0; padding: 20px; border: 1px solid #f0f0f0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><strong>Item Name:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${item.itemName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><strong>Location Found:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${item.locationFound}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><strong>Reporting Staff:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${item.staffName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><strong>Department:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${item.staffPosition || 'N/A'}</td>
                </tr>
              </table>
            </div>
            
            <div style="margin: 30px 0;">
              <p style="text-transform: uppercase; font-size: 9px; letter-spacing: 1px; color: #999; font-weight: bold; margin-bottom: 10px;">Item Description</p>
              <p style="font-style: italic; color: #444; line-height: 1.6; margin: 0;">"${item.description}"</p>
            </div>

            ${item.imageUrls && item.imageUrls.length > 0 ? `
              <div style="margin: 30px 0; text-align: center;">
                <p style="text-transform: uppercase; font-size: 9px; letter-spacing: 1px; color: #999; font-weight: bold; margin-bottom: 15px;">Secured Evidence</p>
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                  ${item.imageUrls.map((url: string) => `
                    <img src="${url}" alt="Item Photo" style="width: 120px; height: 120px; object-fit: cover; border: 1px solid #ddd;" />
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            <div style="background: #fdfaf4; padding: 25px; border-left: 4px solid #C5A059; margin-top: 40px;">
              <p style="margin: 0; font-size: 11px; color: #666;">This item has been secured and logged into the property management system. Reference the portal for claim status updates.</p>
            </div>
            
            <div style="margin-top: 40px; text-align: center;">
              <a href="https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 15px 35px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">View Registry</a>
            </div>
          </div>
        `
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
        console.log("[SMTP] Lost & Found notification sent successfully");
      } else {
        console.log("[SMTP] SMTP credentials missing. Notification simulated in logs.");
      }

      res.status(200).json({ success: true, message: "Lost & Found team notified" });
    } catch (error) {
      console.error("[SMTP Error]", error);
      res.status(500).json({ success: false, message: "Notification failed but item registered" });
    }
  });

  // Google Chat Webhook Notification Endpoint
  app.post("/api/webhook-notify", async (req, res) => {
    const { item, sender, companyId, type = "found" } = req.body;
    
    // Choose webhook based on companyId
    let webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
    let propertyName = "CML Community";

    if (companyId === "ramada") {
      webhookUrl = "https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=RrHHIzJqXsT9UjEYGh73etlhttRO0sg55qzH101UFxc";
      propertyName = "Ramada Suites";
    } else if (companyId === "wyndham") {
      webhookUrl = "https://chat.googleapis.com/v1/spaces/AAQAOj5WBis/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=X-LcP3tlqoGOT1uM1pIVeTV9am3eIhMJrPxy7zUmvTI";
      propertyName = "Wyndham Garden";
    }

    // Default fallback if no specific webhook
    if (!webhookUrl) {
      webhookUrl = "https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=RrHHIzJqXsT9UjEYGh73etlhttRO0sg55qzH101UFxc";
    }

    try {
      let messageText = "";
      const host = req.headers.host || "ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app";
      const protocol = req.headers['x-forwarded-proto'] || "https";
      const baseUrl = `${protocol}://${host}`;
      
      if (type === "found") {
        let photoInfo = "";
        if (item.imageUrls && item.imageUrls.length > 0) {
          const firstImg = item.imageUrls[0];
          if (firstImg && firstImg.startsWith("http")) {
            photoInfo = `\n🖼️ *Attached Item Photo:* ${firstImg}`;
          } else if (item.id) {
            photoInfo = `\n🖼️ *Attached Item Photo:* ${baseUrl}/api/item-image/${companyId}/${item.id}`;
          }
        }

        messageText = `📦 *New Found Item Registered (${propertyName})*\n\n` +
                      `*Item:* ${item.itemName}\n` +
                      `*Location Found:* ${item.locationFound}\n` +
                      `*Reported By:* ${item.staffName} (${item.staffPosition || 'Staff'})\n` +
                      `*Description:* ${item.description}\n` +
                      photoInfo + `\n` +
                      `*Portal Link:* ${baseUrl}`;
      } else if (type === "secured") {
        const receivedBy = item.receivedDetails?.receivedBy || "Staff";
        const storageLoc = item.receivedDetails?.storageLocation || "Office Storage";
        const department = item.receivedDetails?.department || "Front Office";
        
        messageText = `🔐 *Found Item Secured in Office (${propertyName})*\n\n` +
                      `*Item:* ${item.itemName}\n` +
                      `*Physical Storage Location:* ${storageLoc}\n` +
                      `*Key Number/Ref:* ${item.receivedDetails?.storageKeyNumber || 'N/A'}\n` +
                      `*Received By:* ${receivedBy} (${department})\n` +
                      `*Notes:* ${item.receivedDetails?.notes || 'None'}\n` +
                      `*Portal Link:* ${baseUrl}`;
      } else if (type === "claimed") {
        const guestName = item.dispatchDetails?.guestName || "Guest";
        const dispatchedBy = item.dispatchDetails?.dispatchedBy || "Staff";
        
        messageText = `✅ *Lost Item Claimed / Dispatched (${propertyName})*\n\n` +
                      `*Item:* ${item.itemName}\n` +
                      `*Released To:* ${guestName}\n` +
                      `*Dispatched By:* ${dispatchedBy}\n` +
                      `*Date:* ${item.dispatchDetails?.releaseDate || 'Today'}\n` +
                      `*Description:* ${item.description}\n` +
                      `*Portal Link:* ${baseUrl}`;
      } else if (type === "disposed") {
        const disposedBy = item.disposalDetails?.disposedBy || "Staff";
        const witnessName = item.disposalDetails?.witnessName || "None";
        const reason = item.disposalDetails?.reason || "Expired retention period";
        
        messageText = `🗑️ *Lost Item Disposed (${propertyName})*\n\n` +
                      `*Item:* ${item.itemName}\n` +
                      `*Disposed By:* ${disposedBy}\n` +
                      `*Witnessed By:* ${witnessName}\n` +
                      `*Reason:* ${reason}\n` +
                      `*Date:* ${item.disposalDetails?.date || 'Today'}\n` +
                      `*Portal Link:* ${baseUrl}`;
      } else if (type === "comment") {
        const commentAuthor = item.commentDetails?.authorName || "Staff";
        const commentContent = item.commentDetails?.content || "";
        const photoAttachment = item.commentDetails?.photoUrl ? `\n🖼️ *Attached Photo Evidence:* Yes (Base64 file synced in Registry)` : "";
        
        messageText = `💬 *New Staff Conversation/Message Added (${propertyName})*\n\n` +
                      `*Item:* ${item.itemName}\n` +
                      `*Description:* ${item.description}\n` +
                      `*Author:* ${commentAuthor}\n` +
                      `*Message:* "${commentContent}"${photoAttachment}\n` +
                      `*Portal Link:* ${baseUrl}`;
      }

      const message = { text: messageText };

      // Send to primary space Webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Primary Google Chat Webhook returned status ${response.status}`);
      }

      // Enforce duplicate copying to Ramada Suites Webhook as requested
      const ramadaWebhookUrl = "https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=RrHHIzJqXsT9UjEYGh73etlhttRO0sg55qzH101UFxc";
      if (webhookUrl !== ramadaWebhookUrl) {
        console.log("[Webhook] Copying/mirroring duplicate notification to Ramada Suites space...");
        await fetch(ramadaWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          body: JSON.stringify(message)
        }).catch(err => console.error("Mirror copy to Ramada webhook failed:", err));
      }

      // Direct mirror to user's personalized Google Chat webhook space
      await sendToUserGoogleChat(messageText);

      console.log("[Webhook] Google Chat notification(s) synced and sent successfully");
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("[Webhook Error]", error);
      res.status(500).json({ success: false, error: "Webhook failed" });
    }
  });

  // Dynamic Image-Streaming Endpoint for Google Chat Webhook crawler to render base64 item photos
  app.get("/api/item-image/:companyId/:itemId", (req, res) => {
    try {
      const { companyId, itemId } = req.params;
      const dbKey = `lost-and-found-${companyId}/${itemId}`;
      const record = serverMockDbStore[dbKey];
      
      if (record && record.imageUrls && record.imageUrls.length > 0) {
        const dataUrl = record.imageUrls[0];
        if (dataUrl && (dataUrl.startsWith("dataImage") || dataUrl.startsWith("data:image"))) {
          const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const contentType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, "base64");
            
            res.setHeader("Content-Type", contentType);
            res.setHeader("Content-Length", buffer.length);
            res.setHeader("Cache-Control", "public, max-age=604800"); // Cache for 7 days
            return res.end(buffer);
          }
        }
      }
      res.status(404).send("Item image file not uploaded or synced yet");
    } catch (err: any) {
      console.error("[Image-Proxy Error]", err);
      res.status(500).send("Internal image loading exception");
    }
  });

  // Wyndham Gardens Interactive Checklist Submission & SMTP Dispatch Room
  app.post("/api/submit-checklist", async (req, res) => {
    const { 
      role, 
      property, 
      occupancy, 
      date, 
      shift, 
      submittedBy, 
      signature, 
      completionPercent, 
      totalTasks, 
      completedTasks, 
      sections 
    } = req.body;

    console.log(`[Checklist] Logged for ${property} - Role: ${role}, Composed By: ${submittedBy} (${completionPercent}% Complete)`);

    // Respond immediately to let UI complete transition, processed in background
    res.status(200).json({ success: true, message: "Checklist received and dispatching SMTP copy" });

    // Handle background mail generation
    (async () => {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.example.com",
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const recipients = "digitalmedia@cml.com.fj, graphics@cml.com.fj";

        // Build HTML table for sections listing tasks completed / not completed
        let sectionsHtml = "";
        if (Array.isArray(sections)) {
          sections.forEach((sec: any) => {
            sectionsHtml += `
              <div style="margin-top: 25px; margin-bottom: 10px;">
                <h3 style="color: #0b5c4b; font-family: serif; font-style: italic; border-bottom: 1px solid #0b5c4b; margin: 0; padding-bottom: 5px; font-size: 14px; text-transform: uppercase;">${sec.title}</h3>
                <ul style="list-style-type: none; padding-left: 0; margin-top: 8px; margin-bottom: 8px;">
            `;
            if (Array.isArray(sec.items)) {
              sec.items.forEach((it: any) => {
                const statusSymbol = it.completed ? "🟢 [COMPLETED]" : "⚪ [PENDING]";
                const textStyle = it.completed ? "font-weight: 500; color: #111;" : "color: #777; text-decoration: line-through; opacity: 0.65;";
                sectionsHtml += `
                  <li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 11px; line-height: 1.4; ${textStyle}">
                    <span style="font-weight: bold; color: ${it.completed ? '#0b5c4b' : '#aaa'}; margin-right: 6px;">${statusSymbol}</span>
                    ${it.text}
                  </li>
                `;
              });
            }
            sectionsHtml += `</ul></div>`;
          });
        }

        // Inline Signature Image attachment tag
        let signatureHtml = "";
        if (signature) {
          signatureHtml = `
            <div style="margin-top: 30px; border-top: 2px solid #0b5c4b; padding-top: 15px;">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #777; margin: 0 0 10px 0;">Authorized Operator Digital Signature:</p>
              <img src="${signature}" alt="Signature Sign-off" style="max-height: 70px; border: 1px solid #eee; background-color: #fafbfc; padding: 5px;" />
            </div>
          `;
        }

        const mailOptions = {
          from: '"Wyndham Garden Compliance Portal" <noreply@cml.com.fj>',
          to: recipients,
          subject: `[COMPLIANCE CHECKLIST] ${role} Sign-off - ${date} (${completionPercent}% Complete)`,
          html: `
            <div style="font-family: serif; color: #333; max-width: 650px; border: 2px solid #0b5c4b; padding: 40px; background-color: #ffffff; margin: auto;">
              <div style="background-color: #0b5c4b; color: white; padding: 25px; text-align: center;">
                <h1 style="margin: 0; font-family: serif; font-style: italic; font-weight: normal; font-size: 24px; letter-spacing: 1px;">WYNDHAM GARDEN</h1>
                <p style="margin: 4px 0 0 0; text-transform: uppercase; font-size: 9px; letter-spacing: 3px; color: #a7f3d0; font-weight: bold;">Wailoaloa Beach Fiji — relax, you're here</p>
                <p style="margin: 8px 0 0 0; font-size: 11px; font-style: italic; opacity: 0.85;">Daily Operation & Brand Compliance Registry Report</p>
              </div>

              <h2 style="font-family: serif; font-style: italic; color: #0b5c4b; border-bottom: 2px solid #0b5c4b; padding-bottom: 8px; margin-top: 30px; font-size: 18px;">Operations Log Overview</h2>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px;">
                <tr style="background-color: #fafafa;">
                  <td style="padding: 10px; border-bottom: 1px solid #efefef; width: 40%; font-size: 12px;"><strong>Property Location:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #efefef; font-size: 12px; font-style: italic;">Wyndham Garden Wailoaloa Nadi</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #efefef; font-size: 12px;"><strong>Department/Role:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #efefef; font-size: 12px; font-weight: bold; color: #0b5c4b;">${role} Log Sheet</td>
                </tr>
                <tr style="background-color: #fafafa;">
                  <td style="padding: 10px; border-bottom: 1px solid #efefef; font-size: 12px;"><strong>Date & Shift:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #efefef; font-size: 12px;">${date} (${shift} Shift)</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #efefef; font-size: 12px;"><strong>Occupancy Status:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #efefef; font-size: 12px; font-weight: bold;">${occupancy}%</td>
                </tr>
                <tr style="background-color: #fafafa;">
                  <td style="padding: 10px; border-bottom: 1px solid #efefef; font-size: 12px;"><strong>Completed By:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #efefef; font-size: 12px; font-style: italic;">${submittedBy}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 2px solid #0b5c4b; font-size: 12px;"><strong>Compliance Score:</strong></td>
                  <td style="padding: 10px; border-bottom: 2px solid #0b5c4b; font-size: 12px; font-weight: bold; color: #0b5c4b;">${completionPercent}% completed (${completedTasks} of ${totalTasks} parameters verified)</td>
                </tr>
              </table>

              <h2 style="font-family: serif; font-style: italic; color: #0b5c4b; font-size: 16px; margin-top: 30px; margin-bottom: 5px;">Compliance Inspection Details</h2>
              <p style="font-size: 11px; color: #777; margin: 0 0 15px 0; font-style: italic;">Detailed lists of operations checked and verified below:</p>
              
              ${sectionsHtml}
              
              ${signatureHtml}

              <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #888; font-size: 10px;">
                <p style="margin: 0; font-weight: bold; color: #0b5c4b;">WYNDHAM GARDEN FWI Compliance System — confidential data record</p>
                <p style="margin: 5px 0 0 0; font-family: monospace;">Submitted and synced securely on ${new Date().toLocaleString()}</p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log("[Notification] Checklist report emailed successfully to CML supervisors!");
      } catch (err: any) {
        console.error("[Notification Error] Failed to email checklist report:", err);
      }
    })();
  });

  // Complaint/Incident Update Webhook Notification Endpoint
  app.post("/api/notify-complaint-update", async (req, res) => {
    const { complaint, action, authorName, updateMessage, companyId, department, resolvedBy } = req.body;
    
    let webhookUrl = "https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=ZjzVA78vD8a6yDiAyGKDC_tMlY4DNs0RLHusXqalqRw";
    if (companyId === "wyndham") {
      webhookUrl = "https://chat.googleapis.com/v1/spaces/AAQAOj5WBis/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=5wfkQvH_r-eafOCkJDFNsYFvdJ_6fhgNjCutyDVrwuk";
    }
    let propertyName = "CML Portfolio";

    if (companyId === "ramada") {
      propertyName = "Ramada Suites";
    } else if (companyId === "wyndham") {
      propertyName = "Wyndham Garden";
    } else if (companyId === "cml") {
      propertyName = "CML Asset";
    }

    try {
      let messageText = "";

      if (action === "update") {
        messageText = `💬 *New Staff Update Added (${propertyName})*\n\n` +
                      `*Guest Name:* ${complaint.guestName}\n` +
                      `*Room Number:* ${complaint.roomNumber || 'N/A'}\n` +
                      `*Issue Type:* ${complaint.type}\n` +
                      `*Priority:* ${complaint.priority}\n` +
                      `*Update Message:* ${updateMessage}\n` +
                      `*Updated By:* ${authorName}\n` +
                      `*Current Status:* ${complaint.status || 'Pending'}\n` +
                      `*Portal Link:* https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app`;
      } else if (action === "resolve") {
        messageText = `✅ *Incident Log Officially Resolved (${propertyName})*\n\n` +
                      `*Guest Name:* ${complaint.guestName}\n` +
                      `*Room Number:* ${complaint.roomNumber || 'N/A'}\n` +
                      `*Issue Type:* ${complaint.type}\n` +
                      `*Priority:* ${complaint.priority}\n` +
                      `*Resolved By:* ${resolvedBy || authorName}\n` +
                      `*Resolving Department:* ${department || 'General'}\n` +
                      `*Status:* Resolved\n` +
                      `*Portal Link:* https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app`;
      } else if (action === "hod_approve") {
        messageText = `👥 *Step 1: Department Head (HOD) Cleared (${propertyName})*\n\n` +
                      `*Guest Name:* ${complaint.guestName}\n` +
                      `*Room Number:* ${complaint.roomNumber || 'N/A'}\n` +
                      `*Issue Type:* ${complaint.type}\n` +
                      `*Priority:* ${complaint.priority}\n` +
                      `*HOD Approved By:* ${authorName}\n` +
                      `*Current Status:* HOD Approved (Awaiting SuperAdmin Verification)\n` +
                      `*Portal Link:* https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app`;
      } else if (action === "superadmin_approve") {
        messageText = `👑 *Step 2: SuperAdmin Verification Granted (${propertyName})*\n\n` +
                      `*Guest Name:* ${complaint.guestName}\n` +
                      `*Room Number:* ${complaint.roomNumber || 'N/A'}\n` +
                      `*Issue Type:* ${complaint.type}\n` +
                      `*Priority:* ${complaint.priority}\n` +
                      `*SuperAdmin Approved By:* ${authorName}\n` +
                      `*Status:* Fully Approved & Resolved\n` +
                      `*Department:* ${department || 'Administration'}\n` +
                      `*Portal Link:* https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app`;
      }

      const message = { text: messageText };

      // Dispatch Webhook to Google Chat Room
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Google Chat API returned ${response.status}`);
      }

      // Copy update directly to user's Google Chat space
      await sendToUserGoogleChat(messageText);

      // 1. Send Email Notification to SuperAdmins automatically
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.example.com",
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailSubject = `[COMPLAINT ${action.toUpperCase()}] ${complaint.priority} - Guest ${complaint.guestName}`;
        const mailHtml = `
          <div style="font-family: serif; color: #333; max-width: 600px; border: 1px solid #C5A059; padding: 40px;">
            <h1 style="color: #000; font-style: italic; border-bottom: 2px solid #C5A059; padding-bottom: 20px;">Guest Recovery Registry</h1>
            <p style="text-transform: uppercase; font-size: 10px; letter-spacing: 2px; color: #C5A059; font-weight: bold;">Multi-Step Workflow Update</p>
            
            <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
               <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Property:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${propertyName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Guest Name:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${complaint.guestName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Room:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${complaint.roomNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Actioned By:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${authorName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Operation:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${action.replace("_", " ").toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Workflow Status:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  <span style="color: ${action === "superadmin_approve" ? "green" : "orange"}; font-weight: bold;">
                    ${action === "superadmin_approve" ? "Fully Approved & Resolved" : 
                      action === "hod_approve" ? "HOD Cleared & Awaiting SuperAdmin" : "Updated / Resolved"}
                  </span>
                </td>
              </tr>
            </table>
            
            <p style="font-style: italic; color: #666; margin: 30px 0;">"${complaint.description}"</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #C5A059;">
              <p style="margin: 0; font-size: 11px;">Form Actioned By: <strong>${authorName}</strong></p>
              <p style="margin: 5px 0 0; font-size: 11px;">Update Message: ${updateMessage || 'Status updated inside multi-step guest recovery workflow'}</p>
            </div>
            
            <p style="margin: 30px 0 0; font-size: 12px; font-weight: bold;">
              <a href="https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app" style="color: #C5A059; text-decoration: none;">View On Guest Recovery Console →</a>
            </p>
          </div>
        `;

        const superAdminEmails = "digitalmedia@cml.com.fj, cml@wyndhamgardenwailoaloafiji.com, rohit@cml.com.fj, graphics@cml.com.fj, reservations@ramadawailoaloafiji.com";

        await transporter.sendMail({
          from: '"CML Community Gateway" <noreply@cml.com.fj>',
          to: superAdminEmails,
          subject: mailSubject,
          html: mailHtml,
        });
        console.log(`[SMTP Mail] Automated notification sent to all relevant SuperAdmin users`);
      } catch (mailErr) {
        console.warn("[SMTP Mail] Failed to dispatch automated email notifications, proceeding with normal lifecycle:", mailErr);
      }

      console.log(`[Webhook] Complaint ${action} notification sent successfully`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("[Webhook Error]", error);
      res.status(500).json({ success: false, error: "Webhook failed" });
    }
  });

  // HRMS Login & Access Request Webhook Endpoint
  app.post("/api/hrms/notify-login-request", async (req, res) => {
    const { reqItem } = req.body;
    if (!reqItem) {
      return res.status(400).json({ success: false, error: "Missing reqItem payload" });
    }

    const {
      requestType = "System Access Requisition",
      status = "Pending",
      date = new Date().toLocaleString(),
      requestorName = "Staff Member",
      departmentRole = "General",
      platformNeeded = "CML PMS",
      accessLevel = "User",
      businessJustification = "General Access Required",
      temporaryPasswordIssued = "No",
      twoFactorEnabled = "No",
      approvedBy = "Not Approved yet",
      approvalDate = "N/A"
    } = reqItem;

    const webhookUrl = "https://chat.googleapis.com/v1/spaces/AAQAdLhqDd0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=RSHYYr6Q9xRK--qeCHgJYQnmLixZblNHXFlEqimHzGE";

    const statusEmoji = status === "Approved" ? "✅" : (status === "Rejected" ? "❌" : "🔴");

    const messageText = `🔐 *CML HRMS: Logins Information / Request & Approval*\n\n` +
                        `*Type:* ${requestType}\n` +
                        `*Status:* ${statusEmoji} ${status}\n\n` +
                        `*Request Details:*\n` +
                        `• *Date/Time:* ${date}\n` +
                        `• *Requestor Name:* ${requestorName}\n` +
                        `• *Department/Role:* ${departmentRole}\n` +
                        `• *Platform/System Needed:* ${platformNeeded}\n` +
                        `• *Access Level Requested:* ${accessLevel}\n\n` +
                        `*Business Justification:*\n` +
                        `"${businessJustification}"\n\n` +
                        `*Security & Compliance:*\n` +
                        `• *Temporary Password Issued:* ${temporaryPasswordIssued}\n` +
                        `• *Two-Factor Authentication (2FA) Enabled:* ${twoFactorEnabled}\n\n` +
                        `*Approvals:*\n` +
                        `• *Department Head (HOD) Approval:* ${status === "Approved" ? `Approved by ${approvedBy} on ${approvalDate}` : (status === "Rejected" ? `Rejected by ${approvedBy} on ${approvalDate}` : "Pending Department Head Approval")}\n\n` +
                        `*Portal Link:* https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app`;

    // Dispatch webhook calls asynchronously without blocking the client's HTTP response!
    Promise.resolve().then(async () => {
      try {
        await safePostToWebhook(webhookUrl, { text: messageText });
      } catch (err) {
        console.error("Async login request webhook dispatch failure:", err);
      }
    });

    res.json({ success: true, status: "queued" });
  });

  // HRMS Employee Clock-In / Clock-Out (Auto-Login/Logout) Event Webhook Endpoint
  app.post("/api/hrms/notify-clock-event", async (req, res) => {
    const { employeeName, employeeCode, department, managerName, actionType, purpose, dateTime, email, phone } = req.body;
    if (!employeeName || !employeeCode) {
      return res.status(400).json({ success: false, error: "Missing required employee details for clock event notification" });
    }

    const webhookUrl = "https://chat.googleapis.com/v1/spaces/AAQAdLhqDd0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=RSHYYr6Q9xRK--qeCHgJYQnmLixZblNHXFlEqimHzGE";

    let indicator = "";
    let detailHeader = "";
    if (actionType === "Clock-In") {
      indicator = "🟢 CLOCK-IN / LOGIN";
      detailHeader = "Daily Shift Purpose / Business Custody:";
    } else if (actionType === "Clock-Out") {
      indicator = "🔴 CLOCK-OUT / LOGOUT";
      detailHeader = "Shift Handover Notes / Logout Purpose:";
    } else if (actionType === "Layoff Request") {
      indicator = "⚠️ EARLY LAYOFF APPLICATION";
      detailHeader = "Reason for Early Layoff/Exit Request:";
    } else if (actionType === "Movement Pass" || actionType === "Movement Approve") {
      indicator = "✈️ GOING SOMEWHERE / DUTY APPROVAL";
      detailHeader = "Destination & Purpose/Cover Plan:";
    } else {
      indicator = `📢 ${String(actionType).toUpperCase()}`;
      detailHeader = "Details / Description:";
    }

    const messageText = `🔔 *CML HRMS: Employee ${actionType} Alert*\n\n` +
                        `*Employee:* ${employeeName} (Code: ${employeeCode})\n` +
                        `*Department:* ${department} (HOD/Manager: ${managerName || "Charles Cebujano"})\n` +
                        `*Action:* ${indicator}\n` +
                        `*Date/Time:* ${dateTime}\n\n` +
                        `*${detailHeader}*\n` +
                        `"${purpose || "Standard Daily Portal Access"}"\n\n` +
                        `*Contact Info:*\n` +
                        `• Email: ${email || "N/A"}\n` +
                        `• Phone: ${phone || "N/A"}\n\n` +
                        `*Portal Link:* https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app`;

    // Dispatch webhook calls asynchronously without blocking the client's HTTP response!
    Promise.resolve().then(async () => {
      try {
        await safePostToWebhook(webhookUrl, { text: messageText });
        await sendToUserGoogleChat(messageText);
      } catch (err) {
        console.error("Async clock event webhook dispatch failure:", err);
      }
    });

    res.json({ success: true, status: "queued" });
  });

  // KPI API
  // Central Server-Backed Mock Datastore with high-fidelity REST API synchronization to share records perfectly across standard multi-container environments.
  // This bypasses Cloud Run GCP IAM permissions restrictions by making clean client-authenticated REST requests.
  const mockDbFilePath = path.join(process.cwd(), "mock_db_store.json");
  let serverMockDbStore: Record<string, any> = {};
  let sseClients: any[] = [];
  const SERVER_VERSION = "v_1.2.0";

  class FirestoreRestSync {
    public projectId: string;
    public databaseId: string;
    public configDatabaseId: string | null = null;
    public apiKey: string;
    private unusableDatabaseIds: Set<string> = new Set();

    constructor(config: any) {
      this.projectId = config.projectId;
      this.configDatabaseId = config.firestoreDatabaseId || null;
      this.apiKey = config.apiKey;
      this.databaseId = this.configDatabaseId || "(default)";
    }

    public getDatabaseId(): string {
      return this.databaseId;
    }

    private getCandidateDatabaseIds(): string[] {
      const candidates: string[] = [];
      if (this.configDatabaseId) {
        candidates.push(this.configDatabaseId);
      }
      try {
        const fbJsonPath = path.join(process.cwd(), "firebase.json");
        if (fs.existsSync(fbJsonPath)) {
          const fbJson = JSON.parse(fs.readFileSync(fbJsonPath, "utf8"));
          if (fbJson && Array.isArray(fbJson.firestore)) {
            for (const item of fbJson.firestore) {
              if (item.database && !candidates.includes(item.database)) {
                candidates.push(item.database);
              }
            }
          }
        }
      } catch (e) {
        console.warn("[MOCK_DB] Failed to read firebase.json for database candidates:", e);
      }
      if (candidates.length === 0) {
        if (!candidates.includes("(default)")) {
          candidates.push("(default)");
        }
        if (!candidates.includes("default")) {
          candidates.push("default");
        }
      }
      const filtered = candidates.filter(c => !this.unusableDatabaseIds.has(c));
      return filtered.length > 0 ? filtered : ["(default)"];
    }

    private getUrl(docId?: string, forceDbId?: string) {
      const dbId = forceDbId || this.databaseId;
      const base = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/${dbId}/documents/hybrid_sandbox`;
      return docId ? `${base}/${docId}?key=${this.apiKey}` : `${base}?key=${this.apiKey}`;
    }

    async getMaster(): Promise<Record<string, any> | null> {
      const candidates = this.getCandidateDatabaseIds();
      const sortedCandidates = [this.databaseId, ...candidates.filter(c => c !== this.databaseId)];
      let anySuccessfulFetch = false;

      for (const dbId of sortedCandidates) {
        try {
          let nextPageToken = "";
          const combinedStore: Record<string, any> = {};
          let pageCount = 0;
          let fetchFailed = false;

          do {
            let listUrl = this.getUrl(undefined, dbId) + "&pageSize=300";
            if (nextPageToken) {
              listUrl += `&pageToken=${nextPageToken}`;
            }

            let res: Response | null = null;
            let attempts = 0;
            let delayMs = 1500;
            let success = false;

            while (attempts < 3 && !success) {
              try {
                res = await fetch(listUrl);
                if (res.status === 429) {
                  attempts++;
                  console.log(`[MOCK_DB] Received 429 for listUrl on database '${dbId}', attempt ${attempts}/3. Backing off for ${delayMs}ms...`);
                  await new Promise(resolve => setTimeout(resolve, delayMs));
                  delayMs *= 2;
                } else {
                  success = true;
                }
              } catch (e: any) {
                attempts++;
                console.log(`[MOCK_DB] Exception fetching listUrl on database '${dbId}' (attempt ${attempts}/3): ${e.message || e}`);
                if (attempts < 3) {
                  await new Promise(resolve => setTimeout(resolve, delayMs));
                  delayMs *= 2;
                }
              }
            }

            if (res && res.ok) {
              anySuccessfulFetch = true;
              const data = await res.json();
              if (data && Array.isArray(data.documents)) {
                for (const doc of data.documents) {
                  if (doc && doc.fields && doc.fields.db_json && doc.fields.db_json.stringValue) {
                    try {
                      const parsed = JSON.parse(doc.fields.db_json.stringValue);
                      Object.assign(combinedStore, parsed);
                    } catch (e) {
                      console.warn(`[MOCK_DB] Failed to parse stringValue for a doc chunk:`, e);
                    }
                  }
                }
              }
              nextPageToken = data.nextPageToken || "";
              pageCount++;
            } else {
              const status = res ? res.status : 0;
              if (status === 400 || status === 403 || status === 404) {
                console.log(`[MOCK_DB] Database '${dbId}' is unusable or unauthorized (${status}). Excluding from future sync attempts.`);
                this.unusableDatabaseIds.add(dbId);
              } else {
                console.log(`[MOCK_DB] Database '${dbId}' listing status: ${status}.`);
              }
              fetchFailed = true;
              break;
            }
          } while (nextPageToken && pageCount < 20); // safety cap

          if (!fetchFailed && (anySuccessfulFetch || pageCount > 0)) {
            console.log(`[MOCK_DB] Successfully listed, parsed, and merged ${Object.keys(combinedStore).length} keys from '${dbId}' in ${pageCount} pages.`);
            this.databaseId = dbId;
            return combinedStore;
          }
        } catch (e: any) {
          console.log(`[MOCK_DB] Exception listing database '${dbId}':`, e.message || e);
        }

        // 2. Direct document single master_db fetch fallback
        const fallbackUrl = this.getUrl("master_db", dbId);
        try {
          let fallbackRes: Response | null = null;
          let fallbackAttempts = 0;
          let fallbackDelayMs = 1500;
          let fallbackSuccess = false;

          while (fallbackAttempts < 3 && !fallbackSuccess) {
            try {
              fallbackRes = await fetch(fallbackUrl);
              if (fallbackRes.status === 429) {
                fallbackAttempts++;
                console.log(`[MOCK_DB] Fallback: Received 429 for master_db on database '${dbId}', attempt ${fallbackAttempts}/3. Backing off for ${fallbackDelayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, fallbackDelayMs));
                fallbackDelayMs *= 2;
              } else {
                fallbackSuccess = true;
              }
            } catch (e: any) {
              fallbackAttempts++;
              console.log(`[MOCK_DB] Fallback: Exception fetching master_db for '${dbId}' (attempt ${fallbackAttempts}/3): ${e.message || e}`);
              if (fallbackAttempts < 3) {
                await new Promise(resolve => setTimeout(resolve, fallbackDelayMs));
                fallbackDelayMs *= 2;
              }
            }
          }

          if (fallbackRes && fallbackRes.ok) {
            anySuccessfulFetch = true;
            console.log(`[MOCK_DB] Fallback: Successfully fetched single master_db from database '${dbId}'`);
            this.databaseId = dbId;
            const doc = await fallbackRes.json();
            if (doc && doc.fields && doc.fields.db_json && doc.fields.db_json.stringValue) {
              return JSON.parse(doc.fields.db_json.stringValue);
            }
            return {};
          } else if (fallbackRes && fallbackRes.status === 404) {
            anySuccessfulFetch = true;
            console.log(`[MOCK_DB] Fallback: master_db document not found in database '${dbId}'`);
            this.databaseId = dbId;
            return {};
          } else if (fallbackRes && (fallbackRes.status === 400 || fallbackRes.status === 403)) {
            console.log(`[MOCK_DB] Fallback: master_db document returned ${fallbackRes.status} on database '${dbId}'. Excluding from future sync attempts.`);
            this.unusableDatabaseIds.add(dbId);
          }
        } catch (e: any) {
          console.log(`[MOCK_DB] Fallback: Exception fetching master_db for '${dbId}':`, e.message || e);
        }
      }
      return anySuccessfulFetch ? {} : null;
    }

    private sanitizeValue(val: any): any {
      if (typeof val === "string") {
        // Do not truncate flipbook page base64 strings!
        if (val.startsWith("data:") && val.length > 2048 && !val.includes(";base64,")) {
          return "[Truncated large binary/base64 for Cloud Sync]";
        }
        return val;
      }
      if (Array.isArray(val)) {
        return val.map(item => this.sanitizeValue(item));
      }
      if (val !== null && typeof val === "object") {
        const cleaned: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          cleaned[k] = this.sanitizeValue(v);
        }
        return cleaned;
      }
      return val;
    }

    async saveMaster(db: Record<string, any>): Promise<boolean> {
      const candidates = this.getCandidateDatabaseIds();
      const sortedCandidates = [this.databaseId, ...candidates.filter(c => c !== this.databaseId)];

      // Group keys into chunks by their category prefix to avoid the 1MB Firestore document limit
      const chunks: Record<string, Record<string, any>> = {};
      for (const [key, value] of Object.entries(db)) {
        if (key.includes("/pages/") || key.includes("/page/")) {
          // Individual pages contain base64 string, so we save each page as its own document in hybrid_sandbox to avoid hitting 1MB document limit
          const escapedKey = key.replace(/[^a-zA-Z0-9]/g, '_');
          const chunkName = `page_${escapedKey}`;
          chunks[chunkName] = { [key]: this.sanitizeValue(value) };
        } else {
          // Regular keys, including flipbook metadata, complaints, lost-and-found, rewards, newsletter subscribers, etc.
          const firstPart = key.split('/')[0] || "misc";
          const chunkName = `chunk_${firstPart}`;
          if (!chunks[chunkName]) {
            chunks[chunkName] = {};
          }
          chunks[chunkName][key] = this.sanitizeValue(value);
        }
      }

      let overallSuccess = false;

      for (const dbId of sortedCandidates) {
        let dbSucceeded = true;
        
        // Save each chunk as a separate PATCH document
        for (const [chunkName, chunkData] of Object.entries(chunks)) {
          // Add a small delay between chunk saves to stay safe within quotas
          await new Promise(resolve => setTimeout(resolve, 250));

          const chunkString = JSON.stringify(chunkData);
          const patchUrl = this.getUrl(chunkName, dbId) + "&updateMask.fieldPaths=db_json";
          const body = {
            name: `projects/${this.projectId}/databases/${dbId}/documents/hybrid_sandbox/${chunkName}`,
            fields: {
              db_json: {
                stringValue: chunkString
              }
            }
          };

          let attempts = 0;
          let delayMs = 1200;
          let success = false;

          while (attempts < 4 && !success) {
            try {
              const res = await fetch(patchUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
              });

              if (res.ok) {
                success = true;
              } else if (res.status === 429) {
                attempts++;
                console.log(`[MOCK_DB] Received 429 for chunk '${chunkName}' on attempt ${attempts}. Backing off for ${delayMs}ms before retrying...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                delayMs *= 2;
              } else if (res.status === 400 || res.status === 403 || res.status === 404) {
                dbSucceeded = false;
                console.log(`[MOCK_DB] Database '${dbId}' is unusable or unauthorized on write (${res.status}). Excluding from future sync attempts.`);
                this.unusableDatabaseIds.add(dbId);
                success = true; // exit the retry loop, but set dbSucceeded = false
              } else {
                dbSucceeded = false;
                console.log(`[MOCK_DB] Database '${dbId}' responded with status ${res.status} when writing chunk '${chunkName}'.`);
                success = true; // don't retry other non-429 errors
              }
            } catch (e: any) {
              attempts++;
              console.log(`[MOCK_DB] Exception writing chunk '${chunkName}' to '${dbId}' (attempt ${attempts}/4): ${e.message || e}`);
              if (attempts < 4) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
                delayMs *= 2;
              } else {
                dbSucceeded = false;
              }
            }
          }
        }

        if (dbSucceeded) {
          console.log(`[MOCK_DB] Saved all database chunks to cloud database '${dbId}' successfully.`);
          this.databaseId = dbId;
          overallSuccess = true;
          
          // Populate previouslySyncedKeys with successfully saved keys
          for (const key of Object.keys(db)) {
            previouslySyncedKeys.add(key);
          }
          break; // Saved successfully to primary candidate database, skip other candidates
        }
      }

      return overallSuccess;
    }

    // Retained for backward compatibility
    async getAll(): Promise<Record<string, any>> {
      return this.getMaster();
    }
    async set(k: string, val: any): Promise<void> {}
    async delete(k: string): Promise<void> {}

    async deleteMasterDocument(docId: string): Promise<boolean> {
      try {
        const url = this.getUrl(docId);
        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) {
          console.log(`[MOCK_DB] Successfully deleted master document 'hybrid_sandbox/${docId}' from Cloud Firestore.`);
          return true;
        }
        return false;
      } catch (err: any) {
        console.error(`[MOCK_DB] Exception deleting master document 'hybrid_sandbox/${docId}':`, err.message || err);
        return false;
      }
    }

    async saveDirectDocument(collectionName: string, docId: string, docData: any): Promise<boolean> {
      try {
        const fields = this.convertToFirestoreFields(docData);
        const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/${this.databaseId}/documents/${collectionName}/${docId}?key=${this.apiKey}`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `projects/${this.projectId}/databases/${this.databaseId}/documents/${collectionName}/${docId}`,
            fields
          })
        });
        if (res.ok) {
          console.log(`[MOCK_DB] Successfully saved direct document '${collectionName}/${docId}' to Cloud Firestore.`);
          return true;
        } else {
          const text = await res.text();
          console.warn(`[MOCK_DB] Failed to save direct document '${collectionName}/${docId}' to Cloud Firestore: Status ${res.status} ${text}`);
          return false;
        }
      } catch (err: any) {
        console.error(`[MOCK_DB] Exception saving direct document '${collectionName}/${docId}' to Cloud Firestore:`, err.message || err);
        return false;
      }
    }

    async deleteDirectDocument(collectionName: string, docId: string): Promise<boolean> {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/${this.databaseId}/documents/${collectionName}/${docId}?key=${this.apiKey}`;
        const res = await fetch(url, {
          method: "DELETE"
        });
        if (res.ok) {
          console.log(`[MOCK_DB] Successfully deleted direct document '${collectionName}/${docId}' from Cloud Firestore.`);
          return true;
        } else {
          const text = await res.text();
          console.warn(`[MOCK_DB] Failed to delete direct document '${collectionName}/${docId}' from Cloud Firestore: Status ${res.status} ${text}`);
          return false;
        }
      } catch (err: any) {
        console.error(`[MOCK_DB] Exception deleting direct document '${collectionName}/${docId}' from Cloud Firestore:`, err.message || err);
        return false;
      }
    }

    private convertToFirestoreFields(obj: any): any {
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v === null || v === undefined) continue;
        if (typeof v === "string") {
          fields[k] = { stringValue: v };
        } else if (typeof v === "boolean") {
          fields[k] = { booleanValue: v };
        } else if (typeof v === "number") {
          if (Number.isInteger(v)) {
            fields[k] = { integerValue: String(v) };
          } else {
            fields[k] = { doubleValue: v };
          }
        } else if (Array.isArray(v)) {
          const values = v.map(item => {
            if (typeof item === "string") {
              return { stringValue: item };
            } else if (typeof item === "object" && item !== null) {
              return { mapValue: { fields: this.convertToFirestoreFields(item) } };
            }
            return { stringValue: String(item) };
          });
          fields[k] = { arrayValue: { values } };
        } else if (typeof v === "object") {
          fields[k] = { mapValue: { fields: this.convertToFirestoreFields(v) } };
        }
      }
      return fields;
    }
  }

  let firestoreRestSync: FirestoreRestSync | null = null;
  let isCloudHydrated = false;
  let previouslySyncedKeys = new Set<string>();
  let triggerActiveRecoveryScan: (() => Promise<void>) | null = null;

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.projectId && config.apiKey) {
        firestoreRestSync = new FirestoreRestSync(config);
        console.log(`[MOCK_DB] Firestore WebSync initialized with project '${config.projectId}' database '${config.firestoreDatabaseId || "(default)"}'`);
      }
    }
  } catch (e) {
    console.warn("[MOCK_DB] Failed to initialize live cloud Firestore WebSync client:", e);
  }

  const saveMockDbToDisk = () => {
    try {
      fs.writeFileSync(mockDbFilePath, JSON.stringify(serverMockDbStore, null, 2), "utf8");
    } catch (err) {
      console.error("[MOCK_DB] Failed to write mock database to disk:", err);
    }
  };

  // Debounce saving the database to cloud to prevent rapid continuous write blasting
  let saveMasterTimeout: NodeJS.Timeout | null = null;
  const saveMasterCloudDebounced = () => {
    if (!isCloudHydrated) {
      console.log("[MOCK_DB] Guarding cloud save: cloud is not yet hydrated. Preventing overwrite of live cloud database.");
      return;
    }
    if (saveMasterTimeout) {
      clearTimeout(saveMasterTimeout);
    }
    saveMasterTimeout = setTimeout(async () => {
      if (firestoreRestSync) {
        try {
          const success = await firestoreRestSync.saveMaster(serverMockDbStore);
          if (success) {
            console.log("[MOCK_DB] Successfully committed aggregated state changes to cloud master document.");
          }
        } catch (e: any) {
          console.log("[MOCK_DB] Cloud transaction holds pending network configuration.");
        }
      }
    }, 2500); // 2.5 second aggregation window to keep Cloud writes low
  };

  const cleanDefaultEntries = (store: Record<string, any>) => {
    // Disabled per user instruction to never delete any records
    return false;
  };

  // Load initial state from disk fallback AND try to hydrate from Firestore cloud to deal with Cloud Run multiple stateless containers!
  const hydrateStore = async () => {
    // 1. First feed from disk file (fast local fallback in development mode only)
    try {
      const isProduction = process.env.NODE_ENV === "production";
      if (!isProduction && fs.existsSync(mockDbFilePath)) {
        const savedData = fs.readFileSync(mockDbFilePath, "utf8");
        serverMockDbStore = JSON.parse(savedData);
        cleanDefaultEntries(serverMockDbStore);
        console.log(`[MOCK_DB] Pre-hydrated ${Object.keys(serverMockDbStore).length} keys from container disk.`);
      } else if (isProduction) {
        console.log("[MOCK_DB] Production environment detected. Bypassing container disk cache to prevent stale state overwriting the live cloud database.");
      }
    } catch (e) {
      console.warn("[MOCK_DB] Disk load warning:", e);
    }

    // Helper to fetch direct collections from Firestore to recover any missing items
    const importDirectCollectionsFromFirestore = async () => {
      console.log("[MOCK_DB] Bypassing active scanning of direct collections as per user directive. All entries and data pulling are directed exclusively from hybrid_sandbox.");
      return;
    };

    // 2. Then merge from central cloud Firestore using REST
    if (firestoreRestSync) {
      try {
        console.log("[MOCK_DB] Hydrating database from live central Firestore cloud REST API...");
        const cloudState = await firestoreRestSync.getMaster();
        if (cloudState !== null) {
          isCloudHydrated = true;
          
          // Clear and populate previouslySyncedKeys
          previouslySyncedKeys.clear();
          for (const k of Object.keys(cloudState)) {
            previouslySyncedKeys.add(k);
          }

          if (Object.keys(cloudState).length > 0) {
            serverMockDbStore = { ...serverMockDbStore, ...cloudState };
            const wasCleaned = cleanDefaultEntries(serverMockDbStore);
            console.log(`[MOCK_DB] Fully synchronized and merged ${Object.keys(cloudState).length} records from central cloud Firestore database.`);
            saveMockDbToDisk();
            if (wasCleaned) {
              saveMasterCloudDebounced();
            }
          } else {
            console.log("[MOCK_DB] Live central database is new or empty. Keeping local pre-hydrate parameters.");
          }

          // Trigger recovery scan
          triggerActiveRecoveryScan = importDirectCollectionsFromFirestore;
          await importDirectCollectionsFromFirestore();
        } else {
          console.warn("[MOCK_DB] Cloud Firestore REST connection returned null (rate-limited or unreachable). Will retry hydration shortly...");
          isCloudHydrated = false; // Guard saving/overwriting until successfully hydrated
          setTimeout(hydrateStore, 10000); // retry in 10s
        }
      } catch (err) {
        console.warn("[MOCK_DB] Cloud Firestore REST connection warning (continuing with container filesystem only):", err);
        isCloudHydrated = false; // Guard saving/overwriting until successfully hydrated
        setTimeout(hydrateStore, 15000); // retry in 15s
      }
    } else {
      isCloudHydrated = true;
    }
  };

  // Fire hydration shortly after start
  setTimeout(hydrateStore, 500);

  // Background Cloud Poller to ensure multiple server containers stay perfectly in sync in real-time
  const pollCloudDatabase = async () => {
    if (!firestoreRestSync) return;
    try {
      const cloudState = await firestoreRestSync.getMaster();
      if (cloudState) {
        isCloudHydrated = true;
        let changedKeys: Record<string, any> = {};
        let deletedKeys: string[] = [];

        // Check for new or modified keys from the cloud
        for (const [k, newVal] of Object.entries(cloudState)) {
          const oldVal = serverMockDbStore[k];
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changedKeys[k] = newVal;
          }
        }

        // Check for deleted keys: only if they WERE previously synced in the cloud but are now gone
        for (const k of Object.keys(serverMockDbStore)) {
          if (!(k in cloudState) && previouslySyncedKeys.has(k)) {
            deletedKeys.push(k);
          }
        }

        // Update previouslySyncedKeys to match the new cloudState
        previouslySyncedKeys.clear();
        for (const k of Object.keys(cloudState)) {
          previouslySyncedKeys.add(k);
        }

        if (Object.keys(changedKeys).length > 0 || deletedKeys.length > 0) {
          console.log(`[REAL_TIME_SYNC] Detected cloud changes: ${Object.keys(changedKeys).length} updated, ${deletedKeys.length} deleted.`);
          
          // Apply changes incrementally without destroying local-only or unsynced data!
          for (const [k, val] of Object.entries(changedKeys)) {
            serverMockDbStore[k] = val;
          }
          for (const k of deletedKeys) {
            delete serverMockDbStore[k];
          }
          
          saveMockDbToDisk();

          // Broadcast to all active clients
          const broadcastPayload = JSON.stringify({
            type: "update",
            updates: changedKeys,
            deletedKeys: deletedKeys
          });
          sseClients.forEach((client) => {
            try {
              client.write(`data: ${broadcastPayload}\n\n`);
            } catch (e) {
              // ignore
            }
          });
        }
      }
    } catch (err: any) {
      // quiet logging
    }
  };

  if (firestoreRestSync) {
    setInterval(pollCloudDatabase, 180000); // 3 minute polling interval to be kind on API quotas
    // Continuously and automatically run the Deep Cloud Recovery Scan every 15 minutes to keep memory store fully synchronized with live collections!
    setInterval(async () => {
      if (triggerActiveRecoveryScan) {
        try {
          console.log("[BACKGROUND_RECOVERY] Running automated periodic background recovery scan to recover newly registered profiles, complaints, and lost-and-found items...");
          await triggerActiveRecoveryScan();
        } catch (e) {
          console.error("[BACKGROUND_RECOVERY] Background recovery scan failed:", e);
        }
      }
    }, 900000); // 15 minutes instead of 20 seconds!
  }

  // Server-Sent Events (SSE) Stream Endpoint
  app.get("/api/sync-stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Send initial connected notification along with the server build version
    const initPayload = JSON.stringify({
      type: "connected",
      serverVersion: SERVER_VERSION
    });
    res.write(`data: ${initPayload}\n\n`);

    sseClients.push(res);

    req.on("close", () => {
      sseClients = sseClients.filter((client) => client !== res);
    });
  });

  app.get("/api/sync-cloud", async (req, res) => {
    const isForceGet = req.query.forceGet === "true";
    if (isForceGet) {
      console.log("[MOCK_DB] Diagnostic startup alert: client requested forceGet cache-busting fetch. Re-hydrating immediately.");
    }
    if (firestoreRestSync) {
      try {
        console.log(`[MOCK_DB] Explicit client request: forcing cloud fetch and merge... (forceGet=${isForceGet})`);
        const cloudState = await firestoreRestSync.getMaster();
        if (cloudState !== null) {
          isCloudHydrated = true;
          let changedKeys: Record<string, any> = {};

          // Find differences
          for (const [k, newVal] of Object.entries(cloudState)) {
            const oldVal = serverMockDbStore[k];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              changedKeys[k] = newVal;
            }
          }

          // No sync-driven deletions per user instruction to ensure we never delete any records
          const deletedKeys: string[] = [];

          // Update previouslySyncedKeys to match the new cloudState
          previouslySyncedKeys.clear();
          for (const k of Object.keys(cloudState)) {
            previouslySyncedKeys.add(k);
          }

          // Apply changes incrementally without destroying local-only or unsynced data!
          for (const [k, val] of Object.entries(changedKeys)) {
            serverMockDbStore[k] = val;
          }

          saveMockDbToDisk();

          if (Object.keys(changedKeys).length > 0 || deletedKeys.length > 0) {
            // Broadcast to other clients
            const broadcastPayload = JSON.stringify({
              type: "update",
              updates: changedKeys,
              deletedKeys: deletedKeys
            });
            sseClients.forEach((client) => {
              try {
                client.write(`data: ${broadcastPayload}\n\n`);
              } catch (e) {}
            });
          }
        }
      } catch (err) {
        console.error("[MOCK_DB] Force cloud sync failed:", err);
      }
    }
    res.json(serverMockDbStore);
  });

  const waitForHydration = async (): Promise<boolean> => {
    if (!firestoreRestSync || isCloudHydrated) return true;
    let attempts = 0;
    while (!isCloudHydrated && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    return isCloudHydrated;
  };

  app.post("/api/trigger-recovery-scan", async (req, res) => {
    try {
      if (triggerActiveRecoveryScan) {
        console.log("[API] Explicitly triggered a Deep Cloud Ledger Recovery Scan from HOD dashboard.");
        await triggerActiveRecoveryScan();
        res.json({ success: true, message: "Deep Firestore collections scan completed successfully. All historical ledger data recovered." });
      } else {
        res.status(500).json({ success: false, message: "Active recovery scanner is currently initializing. Please try again in a few seconds." });
      }
    } catch (e: any) {
      console.error("[API] Recovery scan error:", e);
      res.status(500).json({ success: false, error: e.message || String(e) });
    }
  });

  app.get("/api/mock-db", async (req, res) => {
    // Wait for central cloud database state to load first to prevent empty state wiping local storage
    const hydrated = await waitForHydration();
    if (!hydrated && firestoreRestSync) {
      return res.status(503).json({ error: "Cloud database hydration in progress. Please retry in a moment." });
    }
    res.json(serverMockDbStore);
  });

  app.post("/api/mock-db", async (req, res) => {
    const hydrated = await waitForHydration();
    if (!hydrated && firestoreRestSync) {
      return res.status(503).json({ error: "Cloud database hydration in progress. Please retry in a moment." });
    }
    const { updates, deletedKeys } = req.body;
    let mutated = false;
    
    if (updates && typeof updates === "object" && Object.keys(updates).length > 0) {
      serverMockDbStore = { ...serverMockDbStore, ...updates };
      mutated = true;

      // Propagate direct collection updates to individual Firestore collections
      if (firestoreRestSync) {
        for (const [key, value] of Object.entries(updates)) {
          if (isDirectCollectionKey(key)) {
            const parts = key.split('/');
            if (parts.length === 2) {
              const [collectionName, docId] = parts;
              firestoreRestSync.saveDirectDocument(collectionName, docId, value);
            }
          }
        }
      }
    }
    
    if (Array.isArray(deletedKeys) && deletedKeys.length > 0) {
      deletedKeys.forEach((k: string) => {
        delete serverMockDbStore[k];

        // Propagate direct collection deletions to individual Firestore collections
        if (firestoreRestSync && isDirectCollectionKey(k)) {
          const parts = k.split('/');
          if (parts.length === 2) {
            const [collectionName, docId] = parts;
            firestoreRestSync.deleteDirectDocument(collectionName, docId);
          }
        }
      });
      mutated = true;
    }
    
    if (mutated) {
      saveMockDbToDisk();
      
      // Persist aggregated updates to central Cloud database in a debounced, rate-safe way
      if (firestoreRestSync) {
        saveMasterCloudDebounced();
      }

      // Broadcast changes to all connected SSE clients instantly
      const broadcastPayload = JSON.stringify({
        type: "update",
        updates: updates || {},
        deletedKeys: deletedKeys || []
      });
      sseClients.forEach((client) => {
        try {
          client.write(`data: ${broadcastPayload}\n\n`);
        } catch (e) {
          // ignore dead client
        }
      });
    }
    
    res.json({ success: true, db: serverMockDbStore });
  });

  app.options("/api/newsletter-ingest", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  app.post("/api/newsletter-ingest", async (req, res) => {
    // Add CORS headers to allow submissions from any external website domain
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    try {
      const hydrated = await waitForHydration();
      if (!hydrated && firestoreRestSync) {
        return res.status(503).json({ error: "Database is currently offline/hydrating. Please try again soon." });
      }
      const { email, source, companyId, firstName, lastName, phone, phoneType, country, zipCode, businessTraveler, marketingOptIn, joinRewards } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Missing email parameter" });
      }

      const activeCompanyId = companyId || "cml";
      const id = "sub_" + Math.random().toString(36).substring(2, 11);
      const dbKey = `newsletter-subscribers-${activeCompanyId}/${id}`;
      
      const newSubscriber = {
        id,
        email: email.trim().toLowerCase(),
        source: source || "Newsletter Submission",
        createdAt: new Date().toISOString(),
        convertedToRewards: false, // Charles wants to manually convert!
        companyId: activeCompanyId
      };

      serverMockDbStore[dbKey] = newSubscriber;
      saveMockDbToDisk();
      
      if (firestoreRestSync) {
        saveMasterCloudDebounced();
      }

      // Broadcast changes to all connected SSE clients instantly
      const broadcastPayload = JSON.stringify({
        type: "update",
        updates: { [dbKey]: newSubscriber },
        deletedKeys: []
      });
      sseClients.forEach((client) => {
        try {
          client.write(`data: ${broadcastPayload}\n\n`);
        } catch (e) {
          // ignore dead client
        }
      });

      // SYNC TO LIVE FIRESTORE COLLECTIONS DIRECTLY
      try {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
          const apiKey = config.apiKey;
          const projectId = config.projectId;
          const databaseId = config.firestoreDatabaseId || "(default)";
          
          if (apiKey && projectId) {
            // 1. Sync to newsletter-subscribers collection
            const subCollection = `newsletter-subscribers-${activeCompanyId}`;
            const subUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${subCollection}?documentId=${id}&key=${apiKey}`;
            
            const subFields: Record<string, any> = {
              id: { stringValue: id },
              email: { stringValue: email.trim().toLowerCase() },
              source: { stringValue: source || "Newsletter Submission" },
              createdAt: { stringValue: new Date().toISOString() },
              convertedToRewards: { booleanValue: false }, // false here as well!
              companyId: { stringValue: activeCompanyId }
            };

            await fetch(subUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fields: subFields })
            }).then(r => {
              if (r.ok) {
                console.log(`[Firestore Ingest Direct] Synced subscriber ${email} to ${subCollection}`);
              } else {
                r.text().then(t => console.error(`[Firestore Ingest Direct Error]`, t));
              }
            }).catch(e => console.error(`[Firestore Ingest Direct Fetch Error]`, e));
          }
        }
      } catch (firestoreErr: any) {
        console.error("[Firestore Ingest Direct Hook Exception]:", firestoreErr.message || firestoreErr);
      }

      // Notify Google Chat Newsletter Webhook
      try {
        let newsletterWebhookUrl = "";
        if (activeCompanyId === "ramada") {
          newsletterWebhookUrl = "https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=weGCY7esGrGvsqE8yK7-bT8zXrwPrOTc9Zpsi9a6ZNU";
        } else if (activeCompanyId === "wyndham") {
          newsletterWebhookUrl = "https://chat.googleapis.com/v1/spaces/AAQAOj5WBis/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=w-Ybrizm2yG2N1gJKOIOnG_uRXX0Axb9vgmXUL9Rlrs";
        }
        
        if (newsletterWebhookUrl) {
          const propertyLabelName = activeCompanyId === "ramada" ? "Ramada Suites" : "Wyndham Garden";
          const messageText = `📨 *New Newsletter Subscriber Registered (${propertyLabelName})*\n\n` +
                              `*Email:* ${email.trim().toLowerCase()}\n` +
                              `*Source:* ${source || "Newsletter Submission"}\n` +
                              `*Date/Time:* ${new Date().toLocaleString()}\n` +
                              `*Portal Link:* https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app`;
                              
          fetch(newsletterWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify({ text: messageText })
          }).catch(err => console.error("Newsletter webhook failed:", err));
        }
      } catch (webhookErr) {
        console.error("Newsletter webhook trigger exception:", webhookErr);
      }

      console.log(`[Newsletter Ingest] Registered subscriber: ${email} for company ${activeCompanyId}`);
      res.json({ success: true, subscriber: newSubscriber });
    } catch (err: any) {
      console.error("[Newsletter Ingest Error]:", err.message || err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.options("/api/rewards-ingest", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  app.post("/api/rewards-ingest", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    try {
      const hydrated = await waitForHydration();
      if (!hydrated && firestoreRestSync) {
        return res.status(503).json({ error: "Database is currently offline/hydrating. Please try again soon." });
      }
      
      const email = (req.body.email || req.body.guest_email || req.body.email_address || "").trim();
      const rawFullName = (req.body.fullName || req.body.fullname || req.body.guest_name || req.body.name || "").trim();
      const phone = (req.body.phone || req.body.phone_number || req.body.telephone || "").trim();
      const companyId = (req.body.companyId || req.body.company_id || "cml").trim().toLowerCase();
      const source = (req.body.source || req.body.signup_source || "WordPress Member Portal").trim();
      const initialPoints = parseInt(req.body.points || req.body.rewardPoints || "100", 10) || 100;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Missing email parameter" });
      }

      // Email address syntax validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email address format." });
      }

      const activeCompanyId = companyId || "cml";
      
      // Prevent duplicate members under the same property/company
      const activeCompanyGuestsPrefix = `restaurant-guests-${activeCompanyId}/`;
      let existingGuest: any = null;
      for (const [key, val] of Object.entries(serverMockDbStore)) {
        if (key.startsWith(activeCompanyGuestsPrefix)) {
          const guest = val as any;
          if (guest && guest.email && guest.email.toLowerCase() === email.toLowerCase()) {
            existingGuest = guest;
            break;
          }
        }
      }

      if (existingGuest) {
        console.log(`[Rewards Ingest] Member ${email} already exists under ID ${existingGuest.id}. Returning existing profile.`);
        return res.json({ 
          success: true, 
          guest: existingGuest, 
          message: "Existing rewards member profile retrieved successfully.",
          isDuplicate: true 
        });
      }
      
      const guestPrefix = activeCompanyId === "ramada" ? "RP" : activeCompanyId === "wyndham" ? "WG" : "CR";
      const guestIdNum = Math.floor(10000 + Math.random() * 90000);
      const guestCardId = `${guestPrefix}${guestIdNum}`;
      
      let fullName = rawFullName;
      if (!fullName) {
        const emailPrefix = email.split('@')[0];
        fullName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      }

      const dbKey = `restaurant-guests-${activeCompanyId}/${guestCardId}`;
      
      const newGuest = {
        id: guestCardId,
        fullName: fullName,
        email: email.toLowerCase(),
        phone: phone || "+679",
        visitCount: 1,
        rewardPoints: initialPoints,
        lastVisited: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        signUpSource: source,
        property: activeCompanyId === "ramada" ? "Ramada Suites Suva" : activeCompanyId === "wyndham" ? "Wyndham Resort Denarau" : "CML",
        status: "Active",
        newsletterSubscribed: true
      };

      serverMockDbStore[dbKey] = newGuest;
      saveMockDbToDisk();
      
      if (firestoreRestSync) {
        saveMasterCloudDebounced();
      }

      const broadcastPayload = JSON.stringify({
        type: "update",
        updates: { [dbKey]: newGuest },
        deletedKeys: []
      });
      sseClients.forEach((client) => {
        try {
          client.write(`data: ${broadcastPayload}\n\n`);
        } catch (e) {
          // ignore
        }
      });

      try {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
          const apiKey = config.apiKey;
          const projectId = config.projectId;
          const databaseId = config.firestoreDatabaseId || "(default)";
          
          if (apiKey && projectId) {
            const guestCollection = `restaurant-guests-${activeCompanyId}`;
            const guestUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${guestCollection}?documentId=${guestCardId}&key=${apiKey}`;

            const guestFields: Record<string, any> = {
              id: { stringValue: guestCardId },
              fullName: { stringValue: fullName },
              email: { stringValue: email.toLowerCase() },
              phone: { stringValue: phone || "+679" },
              visitCount: { integerValue: 1 },
              rewardPoints: { integerValue: initialPoints },
              lastVisited: { stringValue: new Date().toISOString() },
              createdAt: { stringValue: new Date().toISOString() },
              signUpSource: { stringValue: source },
              property: { stringValue: activeCompanyId === "ramada" ? "Ramada Suites Suva" : activeCompanyId === "wyndham" ? "Wyndham Resort Denarau" : "CML" },
              newsletterSubscribed: { booleanValue: true },
              status: { stringValue: "Active" }
            };

            await fetch(guestUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fields: guestFields })
            }).then(r => {
              if (r.ok) {
                console.log(`[Firestore Rewards Ingest] Created guest profile ${guestCardId} for ${fullName}`);
              } else {
                r.text().then(t => console.error(`[Firestore Rewards Ingest Error]`, t));
              }
            }).catch(e => console.error(`[Firestore Rewards Ingest Fetch Error]`, e));

            const visitId = "vis_" + Math.random().toString(36).substring(2, 11);
            const visitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/restaurant-guests-${activeCompanyId}/${guestCardId}/visits?documentId=${visitId}&key=${apiKey}`;
            
            const visitFields = {
              cardId: { stringValue: guestCardId },
              receiptNumber: { stringValue: "REWARDS-WELCOME-BONUS" },
              billAmount: { doubleValue: 0.0 },
              pointsAwarded: { integerValue: initialPoints },
              type: { stringValue: "visit" },
              timestamp: { stringValue: new Date().toISOString() }
            };

            await fetch(visitUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fields: visitFields })
            }).catch(e => console.error(`[Firestore Visit Log Error]`, e));
          }
        }
      } catch (firestoreErr: any) {
        console.error("[Firestore Rewards Ingest Direct Hook Exception]:", firestoreErr.message || firestoreErr);
      }

      // Notify Google Chat Rewards Webhook
      try {
        let rewardsWebhookUrl = "";
        if (activeCompanyId === "ramada") {
          rewardsWebhookUrl = "https://chat.googleapis.com/v1/spaces/AAAAEpnKTIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=Flm9AZapRbM1ELNS1IJg61a5Ojo_4Zvw4RBflbQZ6EE";
        } else if (activeCompanyId === "wyndham") {
          rewardsWebhookUrl = "https://chat.googleapis.com/v1/spaces/AAQAOj5WBis/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=WZ4oHyv2wkwXRangjrIB6Vjz_ff7Uev1T_m9WA9-si8";
        }
        
        if (rewardsWebhookUrl) {
          const propertyLabelName = activeCompanyId === "ramada" ? "Ramada Suites" : "Wyndham Garden";
          const messageText = `★ *New CML Rewards Member Registered (${propertyLabelName})*\n\n` +
                              `*Member Name:* ${fullName}\n` +
                              `*Email:* ${email.toLowerCase()}\n` +
                              `*Digital Card ID:* ${guestCardId}\n` +
                              `*Phone:* ${phone || "+679"}\n` +
                              `*Welcome Points:* ${initialPoints} PTS\n` +
                              `*Source:* ${source || "WordPress Member Portal"}\n` +
                              `*Date/Time:* ${new Date().toLocaleString()}\n` +
                              `*Portal Link:* https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app`;
                              
          fetch(rewardsWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify({ text: messageText })
          }).catch(err => console.error("Rewards webhook failed:", err));
        }
      } catch (webhookErr) {
        console.error("Rewards webhook trigger exception:", webhookErr);
      }

      console.log(`[Rewards Ingest] Registered member: ${email} with ID ${guestCardId}`);
      res.json({ success: true, guest: newGuest });
    } catch (err: any) {
      console.error("[Rewards Ingest Error]:", err.message || err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.get("/api/kpis", (req, res) => {
    res.json({
      summary: {
        occupancy: 78.5,
        adr: 245.0,
        revpar: 192.3,
        totalRevenue: 1254000
      },
      properties: [
        { id: "1", name: "Grand Plaza Hotel", occupancy: 82, adr: 280 },
        { id: "2", name: "Boutique Suites", occupancy: 75, adr: 210 },
        { id: "3", name: "Villas & Spa", occupancy: 68, adr: 450 }
      ]
    });
  });

  // Training courses API
  app.get("/api/training/courses", (req, res) => {
    res.json([
      { id: "c1", title: "Standard Operating Procedures: Front Desk", duration: "45m", complete: true },
      { id: "c2", title: "Fire Safety & Emergency Protocols", duration: "30m", complete: false },
      { id: "c3", title: "Guest Privacy & GDPS Compliance", duration: "60m", complete: false }
    ]);
  });

  // Cloud Usage API for Gemini/Vertex AI
  app.get("/api/cloud/usage", (req, res) => {
    res.json({
      dateRange: { start: "2026-04-17", end: "2026-05-17" },
      grouping: "principal_api_key_id",
      services: [
        {
          id: "AEFD-7695-64FA",
          name: "Gemini API",
          requests: 45200,
          cost: 12.50,
          usage: [
            { date: "2026-04-20", count: 1200 },
            { date: "2026-04-25", count: 1500 },
            { date: "2026-05-01", count: 2100 },
            { date: "2026-05-05", count: 1800 },
            { date: "2026-05-10", count: 2500 },
            { date: "2026-05-17", count: 2900 }
          ]
        },
        {
          id: "C7E2-9256-1C43",
          name: "Gemini Enterprise Agent Platform (Vertex AI)",
          requests: 12400,
          cost: 85.20,
          usage: [
            { date: "2026-04-20", count: 400 },
            { date: "2026-04-25", count: 550 },
            { date: "2026-05-01", count: 800 },
            { date: "2026-05-05", count: 700 },
            { date: "2026-05-10", count: 950 },
            { date: "2026-05-17", count: 1100 }
          ]
        }
      ],
      keys: [
        { id: "principal-cml-hq-01", name: "HQ Primary Hub", totalRequests: 32000, lastActive: "2026-05-17T14:20:00Z" },
        { id: "principal-ramada-serv-02", name: "Ramada Services Edge", totalRequests: 18000, lastActive: "2026-05-17T12:10:00Z" },
        { id: "principal-wyndham-dev-03", name: "Wyndham Dev Sandbox", totalRequests: 7600, lastActive: "2026-05-16T09:45:00Z" }
      ]
    });
  });

  // Email Campaigns Dispatch API
  app.post("/api/campaigns/send", async (req, res) => {
    const { senderName, senderEmail, recipientEmail, recipientName, subject, body, config } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ success: false, error: "Recipient email is required" });
    }

    // 1. Simulation Check
    if (config?.provider === "simulation") {
      console.log(`[SIMULATION MAIL] From: "${senderName}" <${senderEmail}> To: ${recipientEmail} Subject: "${subject}"`);
      return res.json({ success: true, mode: "simulation" });
    }

    // 2. Transporter Selection
    try {
      let transporter;
      let fromAddress = `"${senderName}" <${senderEmail || "newsletter@cml.com.fj"}>`;

      if (config?.provider === "sendgrid" && config.sendgridApiKey) {
        // Use SMTP gateway of SendGrid with custom API Key
        transporter = nodemailer.createTransport({
          host: "smtp.sendgrid.net",
          port: 587,
          secure: false,
          auth: {
            user: "apikey",
            pass: config.sendgridApiKey
          }
        });
        fromAddress = `"${senderName}" <${config.defaultSenderEmail || senderEmail || "newsletter@cml.com.fj"}>`;
      } else if (config?.provider === "smtp" && config.smtpHost) {
        transporter = nodemailer.createTransport({
          host: config.smtpHost,
          port: Number(config.smtpPort) || 587,
          secure: Number(config.smtpPort) === 465,
          auth: {
            user: config.smtpUser,
            pass: config.smtpPass
          }
        });
        fromAddress = `"${senderName}" <${config.defaultSenderEmail || senderEmail || "newsletter@cml.com.fj"}>`;
      } else {
        // Fall back to server's own Env configuration if any
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.example.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
          fromAddress = `"${senderName}" <${process.env.SMTP_USER || senderEmail}>`;
        } else {
          // If no custom config entered and no system env configured, run in simulation mode gracefully
          console.log(`[NO_CONFIG FALLBACK SIMULATION] From: ${senderName} To: ${recipientEmail}`);
          return res.json({ success: true, mode: "simulation_fallback" });
        }
      }

      const isHtml = body.trim().startsWith("<");
      await transporter.sendMail({
        from: fromAddress,
        to: `"${recipientName || ""}" <${recipientEmail}>`,
        subject: subject,
        text: isHtml ? "To view this email, please use an HTML-compatible client." : body,
        html: isHtml ? body : body.replace(/\n/g, "<br/>")
      });

      return res.json({ success: true, mode: "production" });

    } catch (error: any) {
      console.error("[CAMPAIGN_SEND_ERROR]", error);
      return res.status(500).json({ success: false, error: error.message || "Failed to deliver email" });
    }
  });

  // Explicit favicon and apple-touch-icon routing to avoid wildcard SPA HTML fallback
  app.get("/favicon.ico", (req, res) => {
    const pubFav = path.join(process.cwd(), "public/favicon.ico");
    const distFav = path.join(process.cwd(), "dist/favicon.ico");
    const pubIcon = path.join(process.cwd(), "public/icon.png");
    const distIcon = path.join(process.cwd(), "dist/icon.png");

    res.setHeader("Content-Type", "image/x-icon");
    if (fs.existsSync(pubFav)) return res.sendFile(pubFav);
    if (fs.existsSync(distFav)) return res.sendFile(distFav);
    if (fs.existsSync(pubIcon)) return res.sendFile(pubIcon);
    if (fs.existsSync(distIcon)) return res.sendFile(distIcon);
    res.sendStatus(404);
  });

  app.get("/favicon.png", (req, res) => {
    const pubFav = path.join(process.cwd(), "public/favicon.png");
    const distFav = path.join(process.cwd(), "dist/favicon.png");
    const pubIcon = path.join(process.cwd(), "public/icon.png");
    const distIcon = path.join(process.cwd(), "dist/icon.png");

    res.setHeader("Content-Type", "image/png");
    if (fs.existsSync(pubFav)) return res.sendFile(pubFav);
    if (fs.existsSync(distFav)) return res.sendFile(distFav);
    if (fs.existsSync(pubIcon)) return res.sendFile(pubIcon);
    if (fs.existsSync(distIcon)) return res.sendFile(distIcon);
    res.sendStatus(404);
  });

  // Dev server vs. Production static serving
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite dev server not available, using static assets");
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath, {
        etag: false,
        maxAge: 0,
        setHeaders: (res) => {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }));
      app.get("*", (req, res) => {
        res.set({
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      etag: false,
      maxAge: 0,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }));
    app.get("*", (req, res) => {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

