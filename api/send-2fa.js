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

// Vercel serverless function handler
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
		const { user_id, email, fullName } = req.body || {};
		if (!user_id && !email)
			return res
				.status(400)
				.json({ status: "error", message: "User ID or Email is required" });

		// Determine verification type and expiration
		const verificationType = req.body.verificationType || '2fa'; // '2fa' or 'email'
		const isEmailVerification = verificationType === 'email';
		const expirationMinutes = isEmailVerification ? 3 : 5;
		
		// Generate OTP and store in memory
		const otp = generateOtp();
		const expirationTime = new Date(Date.now() + expirationMinutes * 60 * 1000);
		
		// For email verification, use email as key; for 2FA, use user_id
		const storageKey = isEmailVerification ? (email || '').trim().toLowerCase() : user_id;
		
		// Store OTP in memory with expiration
		otpStorage.set(storageKey, {
			otp: otp,
			email: email,
			expiresAt: expirationTime,
			createdAt: new Date()
		});

		console.log(`${isEmailVerification ? 'Email verification' : '2FA'} OTP generated for ${storageKey}: ${otp}`);

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
          <p>${isEmailVerification 
            ? 'You have requested to verify your email address. Please use the following One-Time Password (OTP) to complete your email verification:' 
            : 'You have requested to enable Two-Factor Authentication (2FA) for your account. Please use the following One-Time Password (OTP) to verify your email address:'}</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2c5530; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <ul>
            <li>OTP is valid for ${isEmailVerification ? '3' : '5'} minutes</li>
            <li>Do not share this OTP with anyone</li>
            <li>${isEmailVerification 
              ? 'If you did not request this verification, please ignore this email' 
              : 'If you did not request this verification, please contact your administrator immediately'}</li>
          </ul>
          ${!isEmailVerification ? '<p>Once verified, Two-Factor Authentication will be enabled for your account, providing an extra layer of security.</p>' : ''}
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
			to: recipientEmail,
			subject: isEmailVerification ? "Email Verification - GSD Reservation" : "2FA Email Verification - GSD Reservation",
			html,
		});

		res
			.status(200)
			.json({ 
				status: "success", 
				message: isEmailVerification ? "Email verification OTP sent successfully" : "2FA verification OTP sent successfully", 
				otp 
			});
	} catch (err) {
		res.status(500).json({
			status: "error",
			message: err.message || "Failed to send 2FA verification email",
		});
	}
}
