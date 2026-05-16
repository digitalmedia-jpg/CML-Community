import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Recovery Team Notification Endpoint
  app.post("/api/notify-recovery", async (req, res) => {
    const { complaint, sender } = req.body;
    
    console.log(`[Notification] New Complaint Lodged: ${complaint.guestName} (Room ${complaint.roomNumber})`);
    
    // Simulate/Perform Email Sending
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
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Guest Name:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${complaint.guestName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Room Number:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${complaint.roomNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Issue Type:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${complaint.type}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Priority:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><span style="color: red;">${complaint.priority}</span></td>
              </tr>
            </table>
            
            <p style="font-style: italic; color: #666; margin: 30px 0;">"${complaint.description}"</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #C5A059;">
              <p style="margin: 0; font-size: 11px;">Lodged By: <strong>${sender.name}</strong></p>
              <p style="margin: 5px 0 0; font-size: 11px;">Identity: ${sender.email}</p>
            </div>
            
            <div style="margin-top: 40px; text-align: center;">
              <a href="https://ais-pre-gcwictxbxhm26j2xpgqytj-300636305940.asia-southeast1.run.app" style="background: #000; color: #fff; text-decoration: none; padding: 15px 30px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Resolve in Portal</a>
            </div>
          </div>
        `
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
        console.log("[SMTP] Notification sent successfully");
      } else {
        console.log("[SMTP] SMTP credentials missing. Notification simulated in logs.");
      }

      res.status(200).json({ success: true, message: "Recovery team notified" });
    } catch (error) {
      console.error("[SMTP Error]", error);
      res.status(500).json({ success: false, message: "Notification failed but case registered" });
    }
  });

  // Mock API for Dashboard KPIs (existing)
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

  // Training Module Endpoints (existing)
  app.get("/api/training/courses", (req, res) => {
    res.json([
      { id: "c1", title: "Standard Operating Procedures: Front Desk", duration: "45m", complete: true },
      { id: "c2", title: "Fire Safety & Emergency Protocols", duration: "30m", complete: false },
      { id: "c3", title: "Guest Privacy & GDPS Compliance", duration: "60m", complete: false }
    ]);
  });

  // Vite middleware for development
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
