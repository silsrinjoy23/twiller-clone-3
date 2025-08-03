import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./forgotPassword.css";

const ForgotPasswordPhone = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [finalMessage, setFinalMessage] = useState("");
  const [showResetSection, setShowResetSection] = useState(false);

  // Step 1: Enter Email → Go to Phone step
  const handleEmailNext = (e) => {
    e.preventDefault();
    if (!email) return;
    setStep(2);
  };

  // Step 2: Send OTP to phone
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });

      const data = await res.json();
      setMessage(data.message);
      if (res.ok) setStep(3);
    } catch (err) {
      setMessage("Failed to send OTP.");
      console.error(err);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/verify-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, otp }),
      });

      const data = await res.json();
      setMessage(data.message);
      if (res.ok) setShowResetSection(true);
    } catch (err) {
      setMessage("OTP verification failed.");
      console.error(err);
    }
  };

  // Step 4: Random password generation
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  // Step 5: Reset password
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
      <h2>Reset Password via Phone</h2>

      {/* Step 1: Email */}
      {step === 1 && (
        <form onSubmit={handleEmailNext}>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Next</button>
        </form>
      )}

      {/* Step 2: Phone */}
      {step === 2 && (
        <form onSubmit={handleSendOtp}>
          <input
            type="text"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit">Send OTP</button>
        </form>
      )}

      {/* Step 3: OTP */}
      {step === 3 && (
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

      {/* Step 4: New password input or generator */}
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
          Prefer email reset?{" "}
          <Link to="/forgot-password-email">Go back</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPhone;
