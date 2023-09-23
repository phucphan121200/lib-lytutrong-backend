const express = require ("express");
const cartController = require ("../controllers/cartController");
const verifyToken = require("../middlewares/verifyToken");

const jwt = require("jsonwebtoken");
const router = require("express").Router();

router.post("/createCart", verifyToken, cartController.createCart);
router.put("/removeBook", verifyToken, cartController.removeCart);
router.put("/orderBook", verifyToken, cartController.orderBook);
router.put("/confirmBook/:id", verifyToken, cartController.confirmBook);
router.put("/borrowBook/:id", verifyToken, cartController.borrowBook);
router.put("/returnBook/:id", verifyToken, cartController.returnBook);
router.put("/cancelBook/:id", verifyToken, cartController.cancelBook);
// router.delete("/deleteBook/:id", verifyToken, bookController.deleteBook);
router.get("/getwaittoConfirmAdmin", verifyToken, cartController.getwaittoConfirmAdmin);
router.get("/getwaittoBorrowAdmin", verifyToken, cartController.getwaittoBorrowAdmin);
router.get("/getBorrowedAdmin", verifyToken, cartController.getBorrowedAdmin);
router.get("/getCancelAdmin", verifyToken, cartController.getCancelAdmin);
router.get("/getBookInCart", verifyToken, cartController.getBookInCart);

router.get("/getWaitotConfirmUser", verifyToken, cartController.getWaitotConfirmUser);
router.get("/getWaitoBorrowUser", verifyToken, cartController.getWaitoBorrowUser);
router.get("/getBorrowingUser", verifyToken, cartController.getBorrowingUser);
router.get("/getReturnedUser", verifyToken, cartController.getReturnedUser);


router.get("/statsBook", verifyToken, cartController.statsBook);
router.get("/statsUserBook/:id", verifyToken, cartController.statsUserBook);

router.get("/getReturnedAdmin", verifyToken, cartController.getReturnedAdmin);
router.get("/getCartAdmin", verifyToken, cartController.getCartAdmin);

router.get("/getUserCartAdmin/:id", verifyToken, cartController.getUserCartAdmin);
router.get("/getUserConfirmAdmin/:id", verifyToken, cartController.getUserConfirmAdmin);
router.get("/getUserWaittoBorrowAdmin/:id", verifyToken, cartController.getUserWaittoBorrowAdmin);
router.get("/getUserReturnedAdmin/:id", verifyToken, cartController.getUserReturnedAdmin);
router.get("/getUserBorroweddAdmin/:id", verifyToken, cartController.getUserBorroweddAdmin);
router.get("/getUserCancelAdmin/:id", verifyToken, cartController.getUserCancelAdmin);
// router.get("/getallBook", bookController.getallBook);
// router.get("/getalldeletedBook", bookController.getalldeletedBook);
// router.put("/recoverBook/:id", verifyToken, bookController.recoverBook);
router.post("/borrowBookAdmin", verifyToken, cartController.borrowBookAdmin);
router.post("/getCartInTime",verifyToken, cartController.getCartInTime);
router.put("/migrateDataTimeOrder", cartController.migrateDataTimeOrder);

module.exports = router;