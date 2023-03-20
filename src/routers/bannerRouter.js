const express = require ("express");
const bannerController = require ("../controllers/bannerController");
const verifyToken = require("../middlewares/verifyToken");

const jwt = require("jsonwebtoken");
const router = require("express").Router();

router.post("/createBanner", verifyToken, bannerController.createBanner);
router.put("/updateBanner/:id", verifyToken, bannerController.updateBanner);
router.delete("/deleteBanner/:id", verifyToken, bannerController.deleteBanner);
// router.get("/getCategory/:id", categoryController.getCategory);
router.get("/getallBanner", bannerController.getallBanner);
router.get("/getallBannerAdmin",verifyToken, bannerController.getallBanner);
// router.get("/getalldeletedCategory", categoryController.getalldeletedCategory);
// router.put("/recoverCategory/:id", verifyToken, categoryController.recoverCategory);

module.exports = router;