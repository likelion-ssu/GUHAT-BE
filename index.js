const express = require("express");
const cors = require("cors");
const cheerio = require("cheerio");
const axios = require("axios");
const puppeteer = require("puppeteer");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = 8001;
const app = express();

const authRouter = require("./routes/auth");

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json()); // json 파싱

app.set("port", process.env.PORT || PORT);

app.use("/auth", authRouter);

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

app.listen(app.get("port"), () => {
    console.log(`Server listening on port ${app.get("port")}...`);
});
