const express = require("express");
const router = express.Router();
const { generateRoutine } = require("../controllers/aiController");

router.post("/", generateRoutine);

module.exports = router;