require("dotenv").config();
const request = require("request");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  () => {
    console.log("connected to DB!");
  }
);

//DB Schema
let URLSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
  created_on: {
    type: Date,
    default: Date.now(),
  },
});

let URL = mongoose.model("URL", URLSchema);

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// Middleware to check http(s) is in the URL
const checkHTTP = (req, res, next) => {
  if (/(http(s?)):\/\//.test(req.body.url)) {
    return next();
  } else {
    return res.json({
      error: "invalid url",
    });
  }
};

// Generate short URL
const shortUrlGen = (len) => {
  let chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";

  for (let i = 0; i < len; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return key;
};

app.post("/api/shorturl", checkHTTP, (req, res) => {
  // Receive a URL

  request(req.body.url, (err) => {
    if (err) {
      return res.json({
        error: "invalid url",
      });
    } else {
      let response = {
        original_url: req.body.url,
        short_url: shortUrlGen(5),
      };

      // Save to DB
      URL.create(response, (err) => {
        if (err) {
          return err;
        } else {
          return res.json(response);
        }
      });
    }
  });
});

app.get("/api/shorturl/:slug", (req, res) => {
  let slug = req.params.slug;

  URL.findOne(
    {
      short_url: slug,
    },
    (err, url) => {
      if (err || !url) {
        return res.json({
          error: "invalid url",
        });
      } else {
        return res.redirect(301, url["original_url"]);
      }
    }
  );
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
