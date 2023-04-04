const express = require("express");
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");
const jwt = require("jsonwebtoken");
const router = require("express").Router();
const user = express();
const multer = require('multer')
const path = require('path');
const bodyParser = require('body-parser');



//fetch data from the request
user.use(bodyParser.urlencoded({ extended: true }));

//static folder path
user.use(express.static(path.resolve(__dirname, 'public')));


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

router.post("/addFileUser", upload.single('file'), verifyToken, userController.addFileUser);
router.get("/exportFileUser", verifyToken, userController.exportFileUser);
router.post("/createUser", verifyToken, userController.createUser);
router.post("/login", userController.login);
router.post("/loginUser", userController.loginUser);
router.get("/logout", userController.logout);
router.get("/getuser", verifyToken, userController.getUser);
router.get("/", verifyToken, userController.getallUser);
router.put("/update/:id", verifyToken, userController.updateUser);
router.put("/updatePassword", verifyToken, userController.updatePassword);
router.put("/resetPassword", verifyToken, userController.resetPassword);
router.put("/updateRole/:id", verifyToken, userController.updateRoleUser);
router.delete("/delete/:id", verifyToken, userController.deleteUser);

module.exports = router;