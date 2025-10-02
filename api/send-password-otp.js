import nodemailer from "nodemailer";

// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map();

function generateOtp() {
	return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

function createTransport() {
	const host = process.env.SMTP_HOST;
	const port = Number(process.env.SMTP_PORT);
	const secure = process.env.SMTP_SECURE === "true";
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	
	if (!host || !port || !user || !pass) {
		throw new Error("SMTP configuration is missing. Please check your environment variables.");
	}
	
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

// Vercel serverless function handler for sending password reset OTP
export default async function handler(req, res) {
	// Set CORS headers with allowed origin from environment
	const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:3000";
	const requestOrigin = req.headers.origin;
	
	// Check if the request origin is allowed
	if (requestOrigin && requestOrigin === allowedOrigin) {
		res.setHeader("Access-Control-Allow-Origin", requestOrigin);
		res.setHeader("Access-Control-Allow-Credentials", "true");
	} else {
		res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
	}
	
	res.setHeader("Vary", "Origin");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, X-Requested-With"
	);
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

	// Handle preflight requests
	if (req.method === "OPTIONS") {
		return res.status(204).end();
	}

	// Only allow POST requests
	if (req.method !== "POST") {
		return res
			.status(405)
			.json({ status: "error", message: "Method Not Allowed" });
	}

	try {
		const { email, fullName } = req.body || {};
		if (!email)
			return res
				.status(400)
				.json({ status: "error", message: "Email is required" });

		// Generate OTP and store in memory
		const otp = generateOtp();
		const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
		
		// Store OTP in memory with expiration
		otpStorage.set(email, {
			otp: otp,
			email: email,
			expiresAt: expirationTime,
			createdAt: new Date()
		});

		console.log(`Password reset OTP generated for email ${email}: ${otp}`);

		// Send email
		const transporter = createTransport();
		const recipientName = fullName || 'User';

		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h2 style="color: #333;">General Services Department</h2>
          <p style="color: #666; margin: 5px 0;">Reservation & Monitoring System</p>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>You have requested to reset your password. Please use the following One-Time Password (OTP) to complete your password reset:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2c5530; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <ul>
            <li>OTP is valid for 10 minutes</li>
            <li>Do not share this OTP</li>
            <li>If you did not request this password reset, please ignore this email</li>
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
			from: process.env.MAIL_FROM,
			to: email,
			subject: "Password Reset OTP - GSD Reservation",
			html,
		});

		res
			.status(200)
			.json({ 
				status: "success", 
				message: "Password reset OTP sent successfully", 
				otp 
			});
	} catch (err) {
		res.status(500).json({
			status: "error",
			message: err.message || "Failed to send OTP email",
		});
	}
}