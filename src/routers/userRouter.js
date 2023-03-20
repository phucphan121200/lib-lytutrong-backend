const express = require ("express");
const userController = require ("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");

const jwt = require("jsonwebtoken");
const router = require("express").Router();

router.post("/createUser", verifyToken, userController.createUser);
router.post("/login", userController.login);
router.post("/loginUser", userController.loginUser);
router.get("/logout", userController.logout);
router.get("/:id", verifyToken, userController.getUser);
router.get("/", verifyToken, userController.getallUser);
router.put("/update/:id", verifyToken, userController.updateUser);
router.put("/updatePassword", verifyToken, userController.updatePassword);
router.put("/updateRole/:id", verifyToken, userController.updateRoleUser);
router.delete("/delete/:id", verifyToken, userController.deleteUser);

module.exports = router;