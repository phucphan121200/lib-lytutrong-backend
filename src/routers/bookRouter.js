const express = require ("express");
const bookController = require ("../controllers/bookController");
const verifyToken = require("../middlewares/verifyToken");
const jwt = require("jsonwebtoken");
const router = require("express").Router();
const book = express();
const multer = require('multer')
const path = require('path');
const bodyParser = require('body-parser');

//fetch data from the request
book.use(bodyParser.urlencoded({ extended: true }));

//static folder path
book.use(express.static(path.resolve(__dirname, 'public')));


//multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage });

router.post("/addFileBook", upload.single('file'), verifyToken, bookController.addFileBook);
router.get("/exportFileBook/:id", bookController.exportFileBook);
router.post("/createBook", verifyToken, bookController.createBook);
router.put("/updateBook/:id", verifyToken, bookController.updateBook);
router.put("/inboundBook/:id", verifyToken, bookController.inboundBook);
router.put("/liquidBook/:id", verifyToken, bookController.liquidBook);
router.delete("/deleteBook/:id", verifyToken, bookController.deleteBook);
router.get("/getBook/:id", bookController.getBook);
router.get("/getallBook/:id", verifyToken, bookController.getallBook);
router.get("/getallStockBook", verifyToken, bookController.getallStockBook);
router.get("/getalldeletedBook", bookController.getalldeletedBook);
router.put("/recoverBook/:id", verifyToken, bookController.recoverBook);

router.get("/getallBookClient", bookController.getallBookClient);
router.post("/filterBookClient", bookController.filterBookClient);
router.get("/getallRandomBook", bookController.getallRandomBook);

module.exports = router;