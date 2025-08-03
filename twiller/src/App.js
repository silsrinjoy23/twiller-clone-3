import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login/Login";
import Signup from "./Pages/Login/Signup";
import Feed from "./Pages/Feed/Feed";
import Explore from "./Pages/Explore/Explore";
import Notification from "./Pages/Notification/Notification";
import Message from "./Pages/Messages/Message";
import ProtectedRoute from "./Pages/ProtectedRoute";
import Lists from "./Pages/Lists/Lists";
import Profile from "./Pages/Profile/Profile";
import More from "./Pages/more/More";
import { UserAuthContextProvider, useUserAuth } from "./context/UserAuthContext";
import Bookmark from "./Pages/Bookmark/Bookmark";
import ForgotPasswordEmail from "./Pages/Login/ForgotPasswordEmail";
import ForgotPasswordPhone from "./Pages/Login/ForgotPasswordPhone";
import Chatbot from "./Pages/chatbot/chatbot";
import LoginHistory from "./Pages/Login/LoginHistory";

// ✅ Separate child component to use `useUserAuth()` safely
const AppRoutes = () => {
  const { user } = useUserAuth(); // ✅ now inside provider

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      >
        <Route index element={<Feed />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password-email" element={<ForgotPasswordEmail />} />
      <Route path="/forgot-password-phone" element={<ForgotPasswordPhone />} />
      <Route path="/forgot-password" element={<ForgotPasswordEmail />} />

      <Route path="/home" element={<Home />}>
        <Route path="feed" element={<Feed />} />
        <Route path="explore" element={<Explore />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="notification" element={<Notification />} />
        <Route path="messages" element={<Message />} />
        <Route path="lists" element={<Lists />} />
        <Route path="bookmarks" element={<Bookmark />} />
        <Route path="profile" element={<Profile />} />
        <Route path="more" element={<More />} />
        <Route path="login-history" element={<LoginHistory user={user} />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <div className="app">
      <UserAuthContextProvider>
        <AppRoutes /> {/* ✅ user hook only used inside this */}
      </UserAuthContextProvider>
    </div>
  );
}

export default App;
