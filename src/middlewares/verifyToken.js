const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers.token;
  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, userExists) => {
      if (err) {
        res.status(401).json({ success: false, msg: "Token is not valid!" });
      } else {
        req.userExists = userExists;
        next();
      }      
    });
  } else {
    return res.status(401).json({ success: false, msg: "You are not authenticated!" });
  }
}
module.exports = verifyToken;