import axios from 'axios';

export async function sendLoginOtpMail(user_id, email, fullName) {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
    const baseOverride = process.env.REACT_APP_MAIL_API_BASE;
    
    console.log("baseOverride", baseOverride);
    
    const endpoint = baseOverride
        ? `${baseOverride.replace(/\/$/, "")}/send-login-otp`
        : isLocal
        ? "http://localhost:4001/send-login-otp"
        : "/api/send-login-otp";

    const { data } = await axios.post(endpoint, { 
        user_id, 
        email, 
        fullName 
    });
    return data;
}

export async function validateLoginOtp(user_id, otp, email) {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
    const baseOverride = process.env.REACT_APP_MAIL_API_BASE;
    
    const endpoint = baseOverride
        ? `${baseOverride.replace(/\/$/, "")}/validate-login-otp`
        : isLocal
        ? "http://localhost:4001/validate-login-otp"
        : "/api/validate-login-otp";

    const { data } = await axios.post(endpoint, { 
        user_id, 
        otp, 
        email 
    });
    return data;
}

export async function sendPasswordResetOtpMail(email, fullName) {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
  const baseOverride = process.env.REACT_APP_MAIL_API_BASE;
  
  console.log("baseOverride", baseOverride);
  
  const endpoint = baseOverride
      ? `${baseOverride.replace(/\/$/, "")}/send-password-reset-otp`
      : isLocal
      ? "http://localhost:4001/send-password-reset-otp"
      : "/api/send-password-reset-otp";

    const { data } = await axios.post(endpoint, { 
        email, 
        fullName 
    });
    return data;
}

export async function validatePasswordResetOtp(email, otp) {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
  const baseOverride = process.env.REACT_APP_MAIL_API_BASE;
  
  const endpoint = baseOverride
      ? `${baseOverride.replace(/\/$/, "")}/validate-password-reset-otp`
      : isLocal
      ? "http://localhost:4001/validate-password-reset-otp"
      : "/api/validate-password-reset-otp";

    const { data } = await axios.post(endpoint, { 
        email, 
        otp 
    });
    return data;
}

export async function send2FAOtpMail(user_id, email, fullName) {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
  const baseOverride = process.env.REACT_APP_MAIL_API_BASE;
  
  console.log("baseOverride", baseOverride);
  
  const endpoint = baseOverride
      ? `${baseOverride.replace(/\/$/, "")}/send-2fa-otp`
      : isLocal
      ? "http://localhost:4001/send-2fa-otp"
      : "/api/send-2fa-otp";

    const { data } = await axios.post(endpoint, { 
        user_id,
        email, 
        fullName 
    });
    return data;
}

export async function validate2FAOtp(user_id, otp) {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
  const baseOverride = process.env.REACT_APP_MAIL_API_BASE;
  
  const endpoint = baseOverride
      ? `${baseOverride.replace(/\/$/, "")}/validate-2fa-otp`
      : isLocal
      ? "http://localhost:4001/validate-2fa-otp"
      : "/api/validate-2fa-otp";

    const { data } = await axios.post(endpoint, { 
        user_id, 
        otp 
    });
    return data;
}

export async function sendEmailVerificationOtp(email, fullName) {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
  const baseOverride = process.env.REACT_APP_MAIL_API_BASE;
  
  console.log("baseOverride", baseOverride);
  
  const endpoint = baseOverride
      ? `${baseOverride.replace(/\/$/, "")}/send-email-verification`
      : isLocal
      ? "http://localhost:4001/send-email-verification"
      : "/api/send-email-verification";

    const { data } = await axios.post(endpoint, { 
        email, 
        fullName 
    });
    return data;
}

export async function validateEmailVerificationOtp(email, otp) {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
  const baseOverride = process.env.REACT_APP_MAIL_API_BASE;
  
  const endpoint = baseOverride
      ? `${baseOverride.replace(/\/$/, "")}/validate-email-verification`
      : isLocal
      ? "http://localhost:4001/validate-email-verification"
      : "/api/validate-email-verification";

    const { data } = await axios.post(endpoint, { 
        email, 
        otp 
    });
    return data;
}
