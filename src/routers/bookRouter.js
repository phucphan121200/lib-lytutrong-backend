const express = require ("express");
const bookController = require ("../controllers/bookController");
const verifyToken = require("../middlewares/verifyToken");

const jwt = require("jsonwebtoken");
const router = require("express").Router();

router.post("/createBook", verifyToken, bookController.createBook);
router.put("/updateBook/:id", verifyToken, bookController.updateBook);
router.put("/inboundBook/:id", verifyToken, bookController.inboundBook);
router.delete("/deleteBook/:id", verifyToken, bookController.deleteBook);
router.get("/getBook/:id", bookController.getBook);
router.get("/getallBook", verifyToken, bookController.getallBook);
router.get("/getalldeletedBook", bookController.getalldeletedBook);
router.put("/recoverBook/:id", verifyToken, bookController.recoverBook);

router.get("/getallBookClient", bookController.getallBookClient);
router.get("/filterBookClient/:id", bookController.filterBookClient);
router.get("/getallRandomBook", bookController.getallRandomBook);

module.exports = router;