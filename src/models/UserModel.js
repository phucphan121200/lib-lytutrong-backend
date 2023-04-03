const mongoose = require ("mongoose");

const UserSchema = mongoose.Schema(
    {
        name: {
            type: String,
            require: true
        },
        idcard: {
            type: String,
            require: true,
            unique: true
        },
        password: {
            type: String,
            require: true,
            default: "1"
        },
        userId: {
            type: String,
            unique: true,
            default: "1"
        },
        image: {
            type: String,
            default: "https://cdn-icons-png.flaticon.com/512/219/219969.png"
        },
        phone: {
            type: String,
            require: true, unique: true
        },
        isStudent: {
            type: Boolean,
            require: true,
            default: true,
        },
        isAdmin: {
            type: Boolean,
            require: true,
            default: false,
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

const UserModel = mongoose.model("Users", UserSchema);

//export default UserModel;
module.exports = {UserModel, UserSchema};
