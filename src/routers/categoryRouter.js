const express = require ("express");
const categoryController = require ("../controllers/categoryController");
const verifyToken = require("../middlewares/verifyToken");

const jwt = require("jsonwebtoken");
const router = require("express").Router();

router.post("/createCategory", verifyToken, categoryController.createCategory);
router.put("/updateCategory/:id", verifyToken, categoryController.updateCategory);
router.delete("/deleteCategory/:id", verifyToken, categoryController.deleteCategory);
router.get("/getCategory/:id", categoryController.getCategory);
router.get("/getallCategory", categoryController.getallCategory);
router.get("/getallCategoryAdmin",verifyToken, categoryController.getallCategory);
router.get("/getalldeletedCategory", categoryController.getalldeletedCategory);
router.put("/recoverCategory/:id", verifyToken, categoryController.recoverCategory);

module.exports = router;