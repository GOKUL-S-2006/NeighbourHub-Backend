const express = require("express");
const router  = express.Router();
const { generateNewsBrief } = require("../controllers/newsController");

router.get("/brief", generateNewsBrief);

module.exports = router;