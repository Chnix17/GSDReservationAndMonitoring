// In-memory storage for OTPs (in production, use Redis or database)
// Note: This should be shared with the send-password-otp.js function
// In a real deployment, use Redis or a database for shared storage
const otpStorage = new Map();

// Vercel serverless function handler for validating password reset OTP
export default async function handler(req, res) {
	// Set CORS headers
	const origin = req.headers.origin || "*";
	res.setHeader("Access-Control-Allow-Origin", origin);
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
		const { email, otp } = req.body || {};
		
		if (!email || !otp) {
			return res
				.status(400)
				.json({ status: "error", message: "Email and OTP are required" });
		}

		// Get stored OTP data
		const storedOtpData = otpStorage.get(email);
		
		if (!storedOtpData) {
			return res.json({
				status: "error",
				message: "No OTP found for this email",
				authenticated: false
			});
		}

		// Check if OTP is expired
		if (new Date() > storedOtpData.expiresAt) {
			// Remove expired OTP
			otpStorage.delete(email);
			return res.json({
				status: "error",
				message: "OTP has expired",
				authenticated: false
			});
		}

		// Check if OTP matches
		if (storedOtpData.otp !== otp) {
			return res.json({
				status: "error",
				message: "Invalid OTP",
				authenticated: false
			});
		}

		// OTP is valid, remove it from storage
		otpStorage.delete(email);

		console.log(`Password reset OTP validated successfully for email ${email}`);

		res.json({
			status: "success",
			message: "OTP validated successfully",
			authenticated: true
		});

	} catch (err) {
		res.status(500).json({
			status: "error",
			message: err.message || "Failed to validate OTP",
		});
	}
}
