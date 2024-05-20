// Import required modules
const express = require("express");

// Create Express application instance
const app = express();

// Define routes and middleware
// ...

// Start the server
const PORT = process.env.PORT || 6000; // Change the port number to 6000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const path = require("path");


const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const multer = require("multer");
const helmet = require("helmet");

const User = require("./models/user");
const Product = require("./models/product");

const MONGODB_URI = `mongodb://localhost:27017/yourdatabase`;

app.use(
  session({
    secret: "your_secret_here",
    // other session configurations...
  })
);

// Local MongoDB connection string
const localUri = "mongodb://localhost:27017/yourdatabase"; // Replace 'yourdatabase' with your actual database name

// MongoDB Atlas connection string
const atlasUri =
  "mongodb+srv://vani00712:kOzf43xWuQ7mQAIY@cluster0.6ryucbx.mongodb.net/";

// Set the default connection string based on your environment
const connectionString =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODBCONNECTIONSTRING
    : localUri;

// Connect to MongoDB
mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define routes and other configurations here
// ...

// Start the server

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "",
  expires: 1000 * 60 * 60 * 8,
});

// Middleware setup, route definitions, etc.
// Example:
// app.use(express.json()); // Middleware to parse JSON requests
// app.use('/api/users', userRouter); // Example route setup

// Start the server

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/error");

app.use(helmet());

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "files");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now().toString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const fileTypes = [
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/x-m4a",
    "audio/x-m4p",
    "audio/x-m4b",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/x-m4a",
    "video/x-m4p",
    "video/x-m4b",
  ];
  if (fileTypes.find((type) => type === file.mimetype)) {
    //.find returns undefined if not exists unlike .findIndex which returns -1.
    cb(null, true);
  } else {
    cb(null, false); //cb(err, whether to accept(or)not)
  }
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
    limits: { files: 1, fileSize: 1500000 },
  }).single("audio")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/files", express.static(path.join(__dirname, "files")));
app.use(
  session({
    secret: "",
    cookie: { maxAge: 1000 * 60 * 60 * 8 },
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn || false;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      err.statusCode = 500;
      err.message = "Could not find the user!";
      next(err);
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

app.use((err, req, res, next) => {
  res.status(500).render("error", {
    pageTitle: "Error!",
    path: "/error",
    isAuthenticated: req.session.isLoggedIn || false,
    errorMsg: err.message,
  });
});

mongoose
  .connect(MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true })
  .then((result) => {
    app.listen(process.env.PORT || 6000);
  })
  .catch((err) => {
    console.log(err);
  });
