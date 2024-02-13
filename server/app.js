const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

//Define Env Variable..................
const PORT = process.env.PORT || 8011;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1/userDatabase";

//Creating Server instance...........
const app = express();
const server = http.createServer(app);

//Creating IO Instance.................
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to MongoDB..................
async function connectDb() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Database Connected");
  } catch (error) {
    console.log("Error In Connecting Database", error.message);
  }
}
connectDb();

// Define Mongoose Schema..........................
const userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  dob: {
    type: Date,
  },
});

//Define Model.....................
const userModel = mongoose.model("user", userSchema);

//Store Data in DB.....
const demoData = [
  {
    username: "user1",
    password: "password1",
    dob: new Date("1990-05-15"),
  },
  {
    username: "user2",
    password: "password2",
    dob: new Date("1985-09-28"),
  },
  {
    username: "user3",
    password: "password3",
    dob: new Date("1958-08-29"),
  },
  {
    username: "user4",
    password: "password4",
    dob: new Date("1958-08-14"),
  },
];
async function generateDB() {
  const userPresentInDb = await userModel.findOne();
  if (!userPresentInDb) {
    await userModel
      .insertMany(demoData)
      .then(() => {
        console.log("Demo data inserted successfully");
      })
      .catch((error) => {
        console.error("Data Insertion Failed");
      });
  } else {
    console.error("Data Already Present");
  }
}

generateDB();

//Handle Cors.......
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

//BodyParser MiddleWare..........
app.use(express.json());

//Rest API....................
app.get("/", (req, res) => {
  res.send("Hello World");
});

//Track Online Users.................
const onlineUsers = new Set();

//Function To Set online Users..............
async function setUserOnline(username) {
  onlineUsers.add(username);
  io.emit("updateOnlineUsers", Array.from(onlineUsers));
}

//Login API.........................
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await userModel.findOne({ username });
    if (user) {
      await setUserOnline(username);
      res.json({ success: true, userOnline: Array.from(onlineUsers) });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//Filter API........................
app.post("/filter", async (req, res) => {
  const { month, onlyOnlineMembers } = req.body;
  if (!month) {
    return res
      .status(200)
      .json({ success: true, user: Array.from(onlineUsers), message: "1" });
  }
  const userData = await userModel.find({
    $expr: {
      $eq: [{ $month: "$dob" }, month],
    },
  });
  if (!onlyOnlineMembers) {
    let username = [];
    for (let data of userData) {
      username.push(data.username);
    }
    return res
      .status(200)
      .json({ success: true, user: username, message: "2" });
  }
  let dataToSend = [];
  for (let data of userData) {
    if (onlineUsers.has(data.username)) {
      dataToSend.push(data.username.toString());
    }
  }
  res.status(200).json({ success: true, user: dataToSend, message: "3" });
});

//Opening the Socket Connection..................
io.on("connection", (socket) => {
  //SetUserId event............................
  socket.on("setUserId", (userId) => {
    console.log(`User ${userId} connected`);
    // Add the user ID to the onlineUsers set
    onlineUsers.add(userId);
    // Emit the 'updateOnlineUsers' event to all connected clients
    io.emit("updateOnlineUsers", Array.from(onlineUsers));
  });

  //Disconnect Event..............................
  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
    for (const username of onlineUsers) {
      if (onlineUsers.has(username)) {
        onlineUsers.delete(username);
        console.log(`User ${username} disconnected`);
        io.emit("updateOnlineUsers", Array.from(onlineUsers));
        break;
      }
    }
  });
});

//Listening Server Instance..................
server.listen(PORT, () => {
  console.log(`Server Is Running on http://localhost:${PORT}`);
});
