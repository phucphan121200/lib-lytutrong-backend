const express = require("express");
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const userRouter = require("./routers/userRouter.js");
const categoryRouter = require("./routers/categoryRouter");
const bookRouter = require("./routers/bookRouter");
const cartRouter = require("./routers/cartRouter");
const bannerRouter = require("./routers/bannerRouter");
var cors = require('cors')


dotenv.config();
mongoose.set('strictQuery', true);

const PORT = process.env.PORT || 8800
const DATABASE = process.env.MONGO_URL

mongoose.connect(DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("DB Connection Successfull in port: " + PORT)).catch((err) => console.log(err))

const app = express();

app.use(cors())
app.use(express.json());
//app.use(cookieParser());


app.use("/users", userRouter);
app.use("/categories", categoryRouter);
app.use("/books", bookRouter);
app.use("/carts", cartRouter);
app.use("/banners", bannerRouter);

app.listen(PORT, () => {
    console.log("Backend server is running!")
});