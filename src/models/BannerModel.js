const mongoose = require ("mongoose");

const BannerSchema = mongoose.Schema(
    {
        name: {
            type: String,
            require: true
        },
        image: {
            type: String,
            require: true
        },
        description: {
            type: String,
            require: true
        },
        link: {
            type: String,
            require: true
        },
        isDeleted: {
            type: Boolean,
            require: true,
            default: false
        }
    },
    {
        timestamps: true,
    }
);
const BannerModel = mongoose.model("Banners", BannerSchema);

//export default UserModel;
module.exports = {BannerModel, BannerSchema};