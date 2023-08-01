const mongoose = require ("mongoose");

const BookSchema = mongoose.Schema(
    {
        name: {
            type: String,
            require: true
        },
        bookId: {
            type: String,
            unique: true,
            default: "1"
        },
        booklet: {
            type: String,
        },
        price: {
            type: Number,
        },
        image: {
            type: String,
            default: "https://www.hachette.co.nz/graphics/CoverNotAvailable.jpg"
        },
        publicationdate: {
            type: String,
            require: true
        },
        translator: {
            type: String,
            default: "Chưa cập nhật..."
        },
        categoryItems: [{
            categoryId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Categories",
                require: true,
            }
            
        }],
        grade: {
            type: Number,
            default: 0,
        },
        stock: {
            type: Number,
            require: true,
            default: 0
        },
        authStock: {
            type: Number,
            require: true,
            default: 0
        },
        liquid: {
            type: Number,
            require: true,
            default: 0,
        },
        isDeleted: {
            type: Boolean,
            require: true,
            default: false
        },
        // bookOnline: {
        //     type: String,
        //     default: ""
        // }
    },
    {
        timestamps: true,
    }
);

const BookModel = mongoose.model("Books", BookSchema);
module.exports = {BookModel, BookSchema};