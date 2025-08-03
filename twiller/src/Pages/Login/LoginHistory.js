import React, { useEffect, useState } from "react";
import axios from "axios";
import "./LoginHistory.css";

const LoginHistory = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/login-history?email=${user.email}`
        );
        setHistory(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load login history.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchHistory();
    }
  }, [user]);

  return (
    <div className="login-history">
      <h2>Login History</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : history.length === 0 ? (
        <p>No login records found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Browser</th>
              <th>OS</th>
              <th>Device</th>
              <th style={{ minWidth: "200px" }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, idx) => (
              <tr key={idx}>
                <td>{new Date(entry.time).toLocaleString()}</td>
                <td>{entry.browser}</td>
                <td>{entry.os}</td>
                <td>{entry.deviceType}</td>
                <td style={{ minWidth: "200px" }}>{entry.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LoginHistory;
