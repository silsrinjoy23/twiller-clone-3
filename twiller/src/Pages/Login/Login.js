import React, { useState } from "react";
import twitterimg from "../../image/twitter.jpeg";
import TwitterIcon from "@mui/icons-material/Twitter";
import GoogleButton from "react-google-button";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
import { useUserAuth } from "../../context/UserAuthContext";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { googleSignIn, logIn } = useUserAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Step 1: Track browser/device/IP
      const res = await axios.post("http://localhost:5000/api/login-track", { email });

      if (res.data.requireOtp) {
        // Step 2: Trigger OTP email
        await axios.post("http://localhost:5000/api/send-login-otp", { email });
        setShowOtp(true);
        alert("OTP sent to your email.");
        return;
      }

      // Step 3: No OTP needed, proceed
      await logIn(email, password);
      navigate("/");
    } catch (error) {
      if (error.response?.status === 403) {
        setError(error.response.data.message);
        alert(error.response.data.message); // Mobile time restriction
      } else {
        setError(error.message);
        alert(error.message);
      }
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const verify = await axios.post("http://localhost:5000/api/verify-login-otp", {
        email,
        otp,
      });

      if (verify.data.message === "OTP verified.") {
        await logIn(email, password);
        navigate("/");
      } else {
        setError("Invalid OTP.");
        alert("Invalid OTP");
      }
    } catch (err) {
      setError("Failed to verify OTP.");
      alert("Failed to verify OTP.");
    }
  };

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    try {
      await googleSignIn();
      navigate("/");
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="image-container">
        <img src={twitterimg} className="image" alt="twitterimg" />
      </div>

      <div className="form-container">
        <div className="form-box">
          <TwitterIcon style={{ color: "skyblue" }} />
          <h2 className="heading">Happening now</h2>
          {error && <p style={{ color: "red" }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              className="email"
              placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ textAlign: "left", marginTop: "5px", marginBottom: "10px" }}>
              <Link to="/forgot-password" style={{ textDecoration: "none", color: "#1DA1F2", fontSize: "14px" }}>
                Forgot Password?
              </Link>
            </div>
            <div className="btn-login">
              <button type="submit" className="btn">Log In</button>
            </div>
          </form>

          {showOtp && (
            <div className="otp-verification" style={{ marginTop: "20px" }}>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button className="btn" onClick={handleVerifyOtp}>Verify OTP</button>
            </div>
          )}

          <hr />
          <GoogleButton className="g-btn" type="light" onClick={handleGoogleSignIn} />
        </div>

        <div>
          Don't have an account?{" "}
          <Link to="/signup" style={{ textDecoration: "none", color: "var(--twitter-color)", fontWeight: "600" }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
