const mongoose = require ("mongoose");

const BookSchema = mongoose.Schema(
    {
        name: {
            type: String,
            require: true
        },
        issuingcompany: {
            type: String,
            require: true
        },
        booklet: {
            type: String,
        },
        price: {
            type: Number,
        },
        image: {
            type: String,

        },
        publicationdate: {
            type: String,
            require: true
        },
        translator: {
            type: String,
            require: true
        },
        numberofpages: {
            type: Number,
            require: true,
            default: true,
        },
        publishingcompany: {
            type: String,
            require: true,
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

const BookModel = mongoose.model("Books", BookSchema);
module.exports = {BookModel, BookSchema};