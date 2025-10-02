// In-memory storage for OTPs (shared with send-2fa.js)
// Note: In production, use Redis or a database for persistence
const otpStorage = new Map();

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
		const { user_id, email, otp } = req.body || {};
		
		// Determine storage key: use email if provided (for email verification), otherwise user_id (for 2FA)
		const storageKey = email ? email.trim().toLowerCase() : user_id;
		
		if (!storageKey || !otp) {
			return res
				.status(400)
				.json({ status: "error", message: "User ID/Email and OTP are required" });
		}

		// Check if OTP exists
		const storedData = otpStorage.get(storageKey);
		
		if (!storedData) {
			return res
				.status(400)
				.json({ 
					status: "error", 
					message: "No OTP found. Please request a new verification code." 
				});
		}

		// Check if OTP has expired
		if (new Date() > new Date(storedData.expiresAt)) {
			otpStorage.delete(storageKey); // Clean up expired OTP
			return res
				.status(400)
				.json({ 
					status: "error", 
					message: "OTP has expired. Please request a new verification code." 
				});
		}

		// Validate OTP
		if (storedData.otp !== otp) {
			return res
				.status(400)
				.json({ 
					status: "error", 
					message: "Invalid OTP. Please check and try again." 
				});
		}

		// OTP is valid - remove it from storage (one-time use)
		otpStorage.delete(storageKey);

		res
			.status(200)
			.json({ 
				status: "success", 
				message: email ? "Email verified successfully" : "OTP validated successfully"
			});
	} catch (err) {
		res.status(500).json({
			status: "error",
			message: err.message || "Failed to validate OTP",
		});
	}
}
