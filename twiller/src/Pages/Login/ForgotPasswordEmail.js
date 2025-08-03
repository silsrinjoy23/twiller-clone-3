import React, { useState } from "react";
import "./forgotPassword.css";
import { Link } from "react-router-dom";

const ForgotPasswordEmail = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [finalMessage, setFinalMessage] = useState("");
  const [showResetSection, setShowResetSection] = useState(false);

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setMessage(data.message);
      if (res.ok) setStep(2);
    } catch (err) {
      setMessage("Failed to send OTP.");
      console.error(err);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      setMessage(data.message);
      if (res.ok) setShowResetSection(true);
    } catch (err) {
      setMessage("OTP verification failed.");
      console.error(err);
    }
  };

  // Step 3: Generate random password (letters only)
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  // Step 4: Final password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/set-new-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword }),
      });

      const data = await res.json();
      setFinalMessage(data.message);
    } catch (err) {
      setFinalMessage("Password reset failed.");
      console.error(err);
    }
  };

  return (
    <div className="forgot-container">
      <h2>Reset Password via Email</h2>

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send OTP</button>
          
        </form>
        
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button type="submit">Verify OTP</button>
        </form>
      )}

      {showResetSection && (
        <form onSubmit={handlePasswordReset}>
          <input
            type="text"
            placeholder="Enter new password or generate one"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="button" onClick={generatePassword}>
            Generate Random Password
          </button>
          <button type="submit">Reset Password</button>
        </form>
      )}

      {message && <p>{message}</p>}
      {finalMessage && <p style={{ color: "green" }}>{finalMessage}</p>}
       
      <div className="link-option">
        <p>
          Want to reset via phone?{" "}
          <Link to="/forgot-password-phone">Click here</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordEmail;
