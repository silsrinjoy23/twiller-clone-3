
const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const uri = "";//mongo uri
const { GoogleGenerativeAI } = require("@google/generative-ai");

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const axios = require("axios");
const serviceAccount = require("./firebaseServiceAccount.json");

// Fast2SMS: Send OTP SMS (India)
function sendOtpSms(phone, otp) {
  return axios.post(
    "https://www.fast2sms.com/dev/bulkV2",
    {
      route: "q", // transactional route (no verification needed)
      message: `Your Twiller OTP is: ${otp}`, // full message
      language: "english",
      numbers: phone,
    },
    {
      headers: {
        authorization: "", //fast2sms api key
        "Content-Type": "application/json",
      },
    }
  ).then(res => {
    console.log("Fast2SMS response:", res.data); 
    return res;
  }).catch(err => {
    console.error("Fast2SMS error:", err?.response?.data || err.message);
    throw err;
  });
}

// ✅  set your Gemini API key here (be careful not to push this to GitHub)
const genAI = new GoogleGenerativeAI("");

const port = 5000;

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "", // 🔁 Replace with your Gmail
    pass: "",    // 🔁 Replace with Gmail app password
  },
});

function sendEmail(to, subject, text) {
  const mailOptions = {
    from: "Twiller Support <your-email@gmail.com>",
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error("Email error:", err);
    else console.log("Email sent:", info.response);
  });
}

function generatePassword(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}


const client = new MongoClient(uri);



async function run() {
  try {
    await client.connect();
    const postcollection = client.db("database").collection("posts");
    const usercollection = client.db("database").collection("users");
    const resetCollection = client.db("database").collection("resets"); // ✅ Add this line
    const loginHistoryCollection = client.db("database").collection("loginHistory");
     // ✅ Detect device/browser info
    const detectDeviceInfo = (userAgent) => {
      const ua = userAgent.toLowerCase();
      let browser = "Unknown", os = "Unknown", deviceType = "desktop";

      if (ua.includes("edg")) browser = "Edge";
      else if (ua.includes("chrome")) browser = "Chrome";
      
      else if (ua.includes("firefox")) browser = "Firefox";
      else if (ua.includes("safari")) browser = "Safari";
      else if (ua.includes("msie") || ua.includes("trident")) browser = "Internet Explorer";

      if (ua.includes("windows")) os = "Windows";
      else if (ua.includes("mac")) os = "MacOS";
      else if (ua.includes("linux")) os = "Linux";
      else if (ua.includes("android")) os = "Android";
      else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

      if (/mobi|android|iphone|ipad/i.test(ua)) deviceType = "mobile";
      else if (ua.includes("tablet")) deviceType = "tablet";
      else if (ua.includes("laptop")) deviceType = "laptop";

      return { browser, os, deviceType };
    };

    // ✅ /api/login-track — track and conditionally block/allow login
    app.post("/api/login-track", async (req, res) => {
      const { email } = req.body;
      const userAgent = req.headers["user-agent"];
      const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

      const { browser, os, deviceType } = detectDeviceInfo(userAgent);

      const loginInfo = {
        email,
        ip,
        browser,
        os,
        deviceType,
        time: new Date()  // ✅ store as actual Date object

      };

      await loginHistoryCollection.insertOne(loginInfo);

      const currentHour = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        hour12: false,
      });

      if (browser === "Chrome") {
        return res.json({ requireOtp: true });
      } else if (browser.includes("Edge") || browser.includes("Explorer")) {
        return res.json({ requireOtp: false });
      } else if (deviceType === "mobile") {
        if (currentHour >= 10 && currentHour <= 13) {
          return res.json({ requireOtp: false });
        } else {
          return res.status(403).json({
            message: "Mobile login only allowed between 10 AM and 1 PM IST.",
          });
        }
      }

      return res.json({ requireOtp: false });
    });

    // ✅ /api/login-history?email=user@example.com
    app.get("/api/login-history", async (req, res) => {
      const { email } = req.query;
      const history = await loginHistoryCollection
        .find({ email })
        .sort({ time: -1 })
        .toArray();
      res.json(history);
    });



    app.post("/register", async (req, res) => {
      const user = req.body;
      // console.log(user)
      const result = await usercollection.insertOne(user);
      res.send(result);
    });
    app.get("/loggedinuser", async (req, res) => {
      const email = req.query.email;
      const user = await usercollection.find({ email: email }).toArray();
      res.send(user);
    });
    app.post("/post", async (req, res) => {
      const post = req.body;
      const result = await postcollection.insertOne(post);
      res.send(result);
    });
    app.get("/post", async (req, res) => {
      const post = (await postcollection.find().toArray()).reverse();
      res.send(post);
    });
    app.get("/userpost", async (req, res) => {
      const email = req.query.email;
      const post = (
        await postcollection.find({ email: email }).toArray()
      ).reverse();
      res.send(post);
    });

    app.get("/user", async (req, res) => {
      const user = await usercollection.find().toArray();
      res.send(user);
    });

    app.patch("/userupdate/:email", async (req, res) => {
      const filter = req.params;
      const profile = req.body;
      const options = { upsert: true };
      const updateDoc = { $set: profile };
      // console.log(profile)
      const result = await usercollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    // Chatbot API endpoint
app.post("/chatbot", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Missing question" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 🔍 Ask Gemini for multiple relevant search keywords
    const result = await model.generateContent(
      `Extract the most important 3 keywords or names (people, topics, places) from the following question for searching tweets. Just return them comma-separated: "${question}"`
    );

    const rawText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = rawText.replace(/[^a-zA-Z0-9, ]/g, "").toLowerCase();
    const keywords = cleaned.split(",").map((kw) => kw.trim()).filter(Boolean);

    if (keywords.length === 0) {
      return res.status(400).json({ error: "No keywords extracted" });
    }

    // 🔍 Build a MongoDB search query using $or
    const orQuery = keywords.map((word) => ({
      $or: [
        { post: { $regex: new RegExp(word, "i") } },
        { username: { $regex: new RegExp(word, "i") } },
      ],
    }));

    const posts = await client
      .db("database")
      .collection("posts")
      .find({ $or: orQuery })
      .limit(10)
      .toArray();

    // ✅ If no posts found, use fallback
    if (posts.length === 0) {
      const fallback = await model.generateContent(
        `Provide a helpful short answer (1–2 sentences) for: "${question}"`
      );
      const reply = fallback.response.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't find anything helpful.";

      return res.json({
        keyword: keywords.join(", "),
        tweets: [
          {
            post: reply,
            username: "InsightBot",
            photo: null,
            url: null,
          },
        ],
      });
    }

    // ✅ Return matched tweets with full info
    return res.json({
      keyword: keywords.join(", "),
      tweets: posts.reverse().map((p) => ({
        post: p.post,
        username: p.username || "user",
        photo: p.photo || null,
        url: p.url || null,
      })),
    });
  } catch (err) {
    console.error("Gemini chatbot error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// 📧 Forgot Password via Email: Send OTP
    app.post("/api/send-email-otp", async (req, res) => {
      const { email } = req.body;
      const today = new Date().toDateString();
      const existing = await resetCollection.findOne({ email });

      if (existing && existing.date === today) {
        return res.status(403).json({ message: "You can only reset once per day." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await resetCollection.updateOne(
        { email },
        { $set: { email, otp, date: today, expiresAt: Date.now() + 5 * 60 * 1000 } },
        { upsert: true }
      );

      sendEmail(email, "Your Twiller OTP", `Your OTP is: ${otp}`);
      res.json({ message: "OTP sent to your email." });
    });

    // 📱 Forgot Password via Phone: Send OTP using Fast2SMS
    app.post("/api/send-phone-otp", async (req, res) => {
      const { email, phone } = req.body;
      const today = new Date().toDateString();
      const key = email + phone;
      const existing = await resetCollection.findOne({ key });

      if (existing && existing.date === today) {
        return res.status(403).json({ message: "You can only reset once per day." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await resetCollection.updateOne(
        { key },
        { $set: { key, otp, date: today, expiresAt: Date.now() + 5 * 60 * 1000 } },
        { upsert: true }
      );

      try {
        await sendOtpSms(phone, otp);
        res.json({ message: "OTP sent to phone successfully." });
      } catch (err) {
        console.error("Fast2SMS Error:", err.response?.data || err.message);
        res.status(500).json({ message: "Failed to send SMS OTP." });
      }
    });

    // ✅ Verify Email OTP
    app.post("/api/verify-email-otp", async (req, res) => {
      const { email, otp } = req.body;
      const record = await resetCollection.findOne({ email });

      if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
        return res.status(401).json({ message: "Invalid or expired OTP." });
      }

      res.json({ message: "OTP verified." });
    });

    // ✅ Verify Phone OTP
    app.post("/api/verify-phone-otp", async (req, res) => {
      const { email, phone, otp } = req.body;
      const key = email + phone;
      const record = await resetCollection.findOne({ key });

      if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
        return res.status(401).json({ message: "Invalid or expired OTP." });
      }

      res.json({ message: "OTP verified." });
    });

    // ✅ Final Step: Set New Password (entered or generated)
    app.post("/api/set-new-password", async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Missing data." });

      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, { password });

        await resetCollection.updateOne(
          { email },
          { $set: { date: new Date().toDateString() } },
          { upsert: true }
        );

        res.json({ message: "Password updated successfully." });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update password." });
      }
    });
    // ✅ Separate route: Send OTP for login
app.post("/api/send-login-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min

  await client.db("database").collection("loginOtps").updateOne(
    { email },
    { $set: { email, otp, expiresAt } },
    { upsert: true }
  );

  sendEmail(email, "Your Twiller Login OTP", `Your login OTP is: ${otp}`);
  res.json({ message: "Login OTP sent." });
});

// ✅ Separate route: Verify OTP for login
app.post("/api/verify-login-otp", async (req, res) => {
  const { email, otp } = req.body;
  const record = await client.db("database").collection("loginOtps").findOne({ email });

  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(401).json({ message: "Invalid or expired login OTP." });
  }

  res.json({ message: "OTP verified." });
});


    

  } catch (error) {
    console.log(error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Twiller is working");
});

app.listen(port, () => {
  console.log(`Twiller clone is workingon ${port}`);
});
