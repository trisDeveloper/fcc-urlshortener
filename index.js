require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
const mongoose = require("mongoose");
// Basic Configuration
const port = process.env.PORT || 3000;
const mySecret = process.env["MONGO_URI"];
app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});
//db
mongoose
  .connect(mySecret, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));
//model
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const Url = mongoose.model("Url", urlSchema);

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});
// POST

app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;

  // Validate URL using regular expression
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  if (!urlRegex.test(url)) {
    return res.json({ error: 'Invalid URL' });
  }

  // Proceed with URL processing if validation passed
  const short_url = Math.floor(Math.random() * 10000).toString();
  const newUrl = new Url({ original_url: url, short_url: short_url });

  try {
    await newUrl.save();
    res.json({ original_url: url, short_url: short_url });
  } catch (error) {
    console.error(error);
    res.json({ error: 'Internal server error' });
  }
});

// GET
app.get('/api/shorturl/:short_url', async (req, res) => {
  const short_url = req.params.short_url;

  // Retrieve URL from database using short ID
  const url = await Url.findOne({ short_url: short_url });

  if (!url) {
    // Handle not found scenario (e.g., 404 error)
    return res.status(404).json({ error: 'URL not found' });
  }

  // Redirect to original URL
  res.redirect(url.original_url);
});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
