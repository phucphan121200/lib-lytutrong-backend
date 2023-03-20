const mongoose = require ("mongoose");

const CategorySchema = mongoose.Schema(
    {
        name: {
            type: String,
            require: true,
            unique: true
        },
        image: {
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
const CategoryModel = mongoose.model("Categories", CategorySchema);

//export default UserModel;
module.exports = {CategoryModel, CategorySchema};