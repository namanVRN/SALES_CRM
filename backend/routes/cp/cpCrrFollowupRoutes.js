const express = require("express");
const router = express.Router();
const cpCrrFollowupController = require("../../controllers/cp/cpCrrFollowupController");

router.get("/list", cpCrrFollowupController.getCrrFollowupList);
router.post("/done", cpCrrFollowupController.markCrrFollowupDone);

module.exports = router;