import nodemailer from "nodemailer";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map();

function generateOtp() {
	return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

function createTransport() {
	const host = process.env.SMTP_HOST || "smtp.gmail.com";
	const port = Number(process.env.SMTP_PORT || 465);
	const secure = process.env.SMTP_SECURE
		? process.env.SMTP_SECURE === "true"
		: port === 465;
	const user = process.env.SMTP_USER || "noreplygsd12@gmail.com";
	const pass = process.env.SMTP_PASS || "ckfo wpow pfmq ziwd";
	
	return nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user, pass },
		tls: {
			rejectUnauthorized: false
		}
	});
}

// Send login OTP endpoint
app.post('/send-login-otp', async (req, res) => {
	// Basic CORS to allow local dev to call the deployed API
	const origin = req.headers.origin || "*";
	res.setHeader("Access-Control-Allow-Origin", origin);
	res.setHeader("Vary", "Origin");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, X-Requested-With"
	);
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

	if (req.method === "OPTIONS") {
		return res.status(204).end();
	}

	if (req.method !== "POST") {
		return res
			.status(405)
			.json({ status: "error", message: "Method Not Allowed" });
	}

	try {
		const { user_id, email, fullName } = req.body || {};
		if (!user_id && !email)
			return res
				.status(400)
				.json({ status: "error", message: "User ID or Email is required" });

		// Generate OTP and store in memory
		const otp = generateOtp();
		const expirationTime = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now
		
		// Store OTP in memory with expiration
		otpStorage.set(user_id, {
			otp: otp,
			email: email,
			expiresAt: expirationTime,
			createdAt: new Date()
		});

		console.log(`OTP generated for user ${user_id}: ${otp}`);

		// Send email
		const transporter = createTransport();
		const recipientEmail = email || 'test@example.com';
		const recipientName = fullName || 'User';

		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h2 style="color: #333;">General Services Department</h2>
          <p style="color: #666; margin: 5px 0;">Reservation & Monitoring System</p>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>You have requested to login to your account. Please use the following One-Time Password (OTP) to complete your authentication:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2c5530; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <ul>
            <li>OTP is valid for 3 minutes</li>
            <li>Do not share this OTP</li>
            <li>If you did not request this login, please ignore this email</li>
          </ul>
          <p>Thank you for using our reservation system.</p>
          <p>Best regards,<br/>General Services Department</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          This is an automated message. Please do not reply.
        </div>
      </div>
    `;

		await transporter.sendMail({
			from: process.env.MAIL_FROM || "noreplygsd12@gmail.com",
			to: recipientEmail,
			subject: "Login Authentication Code - GSD Reservation",
			html,
		});

		res
			.status(200)
			.json({ 
				status: "success", 
				message: "OTP sent successfully", 
				requires_2fa: true,
				otp 
			});
	} catch (err) {
		res.status(500).json({
			status: "error",
			message: err.message || "Failed to send OTP email",
		});
	}
});

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ status: 'OK', service: 'send-login-otp' });
});

// Start server
app.listen(PORT, () => {
	console.log(`Send Login OTP service running on port ${PORT}`);
});