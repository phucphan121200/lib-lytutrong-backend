const mongoose = require ("mongoose");

const CartSchema = mongoose.Schema(
    {
        cartItems: [
            {
                bookId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Books",
                    require: true,
                },
                amount: {
                    type: Number,
                    require: true
                },
                isOrder: {
                    type:Boolean,
                    default: false
                },
                isConfirm: {
                    type: Boolean,
                    default: false
                },
                isBorrowed: {
                    type: Boolean,
                    default: false
                },
                isReturned: {
                    type: Boolean,
                    default: false
                },
                isCancel: {
                    type:Boolean,
                    default: false
                },
                teacherConfirm: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Users"
                },
                teacherBorrow: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Users"
                },
                teacherCancel: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Users"
                },
                teacherReturn: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Users"
                },
                timeOrder: {
                    type: Date
                },
                timeConfirm: {
                    type: Date
                },
                timeCancel: {
                    type: Date
                },
                timeBorrow: {
                    type: Date
                },
                exp: {
                    type: Date
                },
                timeReturn: {
                    type: Date
                }
            },
        ],
        userBorrowInfo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            require: true,
        },
        isDeleted: { type: Boolean, default: false, require: true },
    },
    {
        timestamps: true,
    }
);

const CartModel = mongoose.model("Carts", CartSchema);

//export default UserModel;
module.exports = {CartModel, CartSchema};