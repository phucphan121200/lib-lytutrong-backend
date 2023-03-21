const { CartModel } = require("../models/CartModel")
const { BookModel } = require("../models/BookModel");
const { now } = require("mongoose");

// ADD CART
exports.createCart = async (req, res) => {
    const checkCart = await CartModel.findOne({ "userBorrowInfo": req.userExists.id });
    const checkBookStock = await BookModel.findById(req.body.cartItems[0].bookId)
    if (checkCart) {
        const findBookinCart = checkCart.cartItems.find(cart => cart.bookId == req.body.cartItems[0].bookId
            && cart.isOrder == false
            && cart.isConfirm == false
            && cart.isBorrowed == false
            && cart.isReturned == false)
        if (findBookinCart) {
            if (findBookinCart.amount + req.body.cartItems[0].amount > checkBookStock.authStock) {
                res.status(200).json({ success: false, data: [], msg: "Không thể thêm quá số lượng cho phép!" })
            }
            else {
                findBookinCart.amount = findBookinCart.amount + req.body.cartItems[0].amount
                const updateCart = await CartModel.findOneAndUpdate({ "userBorrowInfo": req.userExists.id },
                    { $set: checkCart },
                    { new: true });
                res.status(200).json({ success: true, data: updateCart, msg: "Đã thêm sách vào giỏ hàng" })
            }
        }
        else {
            const updateCart = await CartModel.findOneAndUpdate({ "userBorrowInfo": req.userExists.id },
                { $push: { cartItems: req.body.cartItems[0] } },
                { new: true });
            res.status(200).json({ success: true, data: updateCart, msg: "Đã thêm sách vào giỏ hàng" })
        }
    }
    if (!checkCart) {
        const newCart = {
            userBorrowInfo: req.userExists.id,
            cartItems: req.body.cartItems
        }
        try {
            const addUserCart = await CartModel(newCart).save();
            res.status(200).json({ success: true, data: addUserCart, msg: "Đã thêm sách vào giỏ hàng" })
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    }
}

//REMOVE FROM CART
exports.removeCart = async (req, res) => {
    const checkCart = await CartModel.findOne({ "userBorrowInfo": req.userExists.id });
    console.log(req.body)
    if (checkCart) {
        const isAddedBook = checkCart.cartItems.find((cart) => cart.bookId == req.body.cartItems[0].bookId
            && cart.isOrder == false
            && cart.isConfirm == false
            && cart.isBorrowed == false
            && cart.isReturned == false)
        if (isAddedBook) {
            try {
                const addCart = await CartModel.findOneAndUpdate({ "userBorrowInfo": req.userExists.id },
                    {
                        $pull: {
                            cartItems:
                                isAddedBook
                        }
                    }, { new: true });
                res.status(200).json({ success: true, data: addCart, msg: "Đã xóa sách khỏi giỏ hàng" })
            }
            catch (err) {
                return res.status(500).json({ success: false, msg: err.message });
            }
        }
        else {
            res.status(200).json({ success: false, data: [], msg: "Không thể xóa sách không có trong giỏ hàng" })
        }
    }
    if (!checkCart) {
        res.status(200).json({ success: true, data: addUserCart, msg: "Không thể xóa sách không có trong giỏ hàng" })
    }
}

//ORDER BOOK
exports.orderBook = async (req, res) => {
    const checkCart = await CartModel.findOne({ "userBorrowInfo": req.userExists.id });
    try {
        for (let i = 0; i < req.body.cartItems.length; i++) {
            if (checkCart) {
                const checkBookStock = await BookModel.findById(req.body.cartItems[i].bookId)
                if (req.body.cartItems[i].amount > checkBookStock.authStock) {
                    res.status(200).json({ success: false, data: [], msg: "Không thể đặt quá số lượng cho phép!" })
                } else {
                    for (let y = 0; y < checkCart.cartItems.length; y++) {
                        if (checkCart.cartItems[y].bookId == req.body.cartItems[i].bookId
                            && checkCart.cartItems[y].isOrder == false
                            && checkCart.cartItems[y].isConfirm == false
                            && checkCart.cartItems[y].isBorrowed == false
                            && checkCart.cartItems[y].isReturned == false) {
                            checkCart.cartItems[y].isOrder = true;
                            checkCart.cartItems[y].amount = req.body.cartItems[i].amount
                            await BookModel.findOneAndUpdate({ "_id": checkCart.cartItems[y].bookId },
                                { $set: { authStock: checkBookStock.authStock - req.body.cartItems[i].amount } })
                        }
                    }
                    const orderBook = await CartModel.findOneAndUpdate({ "userBorrowInfo": req.userExists.id },
                        { $set: checkCart },
                        { new: true })
                    if (i == req.body.cartItems.length - 1) {
                        res.status(200).json({ success: true, data: orderBook, msg: "Đã đặt sách thành công! Chờ nhân viên thư viện xác nhận!" })
                    }

                }
            }
            else {
                res.status(200).json({ success: false, data: [], msg: "Lỗi không thể xác định!" })
            }
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}

//CONFIRM BOOK
exports.confirmBook = async (req, res) => {
    const checkCart = await CartModel.findOne({ "userBorrowInfo": req.body.userBorrowInfo });
    try {
        for (let i = 0; i < req.body.cartItems.length; i++) {
            if (checkCart) {
                const checkBookStock = await BookModel.findById(req.body.cartItems[i].bookId)
                if (req.body.cartItems[i].amount == 0) {
                    for (let y = 0; y < checkCart.cartItems.length; y++) {
                        if (checkCart.cartItems[y].bookId == req.body.cartItems[i].bookId
                            && checkCart.cartItems[y].isOrder == true
                            && checkCart.cartItems[y].isConfirm == false
                            && checkCart.cartItems[y].isBorrowed == false
                            && checkCart.cartItems[y].isReturned == false
                            && checkCart.cartItems[y].isCancel == false
                            && checkCart.cartItems[y]._id == req.params.id) {
                            if (checkCart.cartItems[y].amount < req.body.cartItems.amount) {
                                res.status(200).json({ success: false, data: [], msg: "Không thể hủy quá số lượng cho phép!" })
                            } else {
                                checkCart.cartItems[y].isCancel = true;
                                checkCart.cartItems[y].teacherCancel = req.userExists.id
                                checkCart.cartItems[y].isBorrowed = true;
                                checkCart.cartItems[y].teacherBorrow = req.userExists.id
                                checkCart.cartItems[y].isConfirm = true;
                                checkCart.cartItems[y].teacherConfirm = req.userExists.id
                                checkCart.cartItems[y].isReturned = true;
                                checkCart.cartItems[y].teacherReturn = req.userExists.id
                                checkCart.cartItems[y].timeCancel = new Date()
                                checkCart.cartItems[y].exp = new Date()
                                await BookModel.findOneAndUpdate({ "_id": checkCart.cartItems[y].bookId },
                                    {
                                        $set: {
                                            authStock: checkBookStock.authStock + req.body.cartItems[i].amount
                                        }
                                    })
                            }
                        }
                    }
                    const orderBook = await CartModel.findOneAndUpdate({ "userBorrowInfo": req.body.userBorrowInfo },
                        { $set: checkCart },
                        { new: true })
                    res.status(200).json({ success: true, data: orderBook, msg: "Xác nhận hủy phiên mượn thành công!" })
                } else {

                    for (let y = 0; y < checkCart.cartItems.length; y++) {
                        if (checkCart.cartItems[y].bookId == req.body.cartItems[i].bookId
                            && checkCart.cartItems[y].isOrder == true
                            && checkCart.cartItems[y].isConfirm == false
                            && checkCart.cartItems[y].isBorrowed == false
                            && checkCart.cartItems[y].isReturned == false
                            && checkCart.cartItems[y]._id == req.params.id) {
                            if (checkCart.cartItems[y].amount < req.body.cartItems[i].amount) {
                                res.status(200).json({ success: false, data: [], msg: "Không thể duyệt quá số lượng cho phép!" })
                            } else {
                                checkCart.cartItems[y].isConfirm = true;
                                checkCart.cartItems[y].teacherConfirm = req.userExists.id
                                checkCart.cartItems[y].timeConfirm = new Date()
                                await BookModel.findOneAndUpdate({ "_id": checkCart.cartItems[y].bookId },
                                    { $set: { authStock: checkBookStock.authStock + (checkCart.cartItems[y].amount - req.body.cartItems[i].amount) } })
                                checkCart.cartItems[y].amount = req.body.cartItems[i].amount
                            }
                        }
                    }
                    const orderBook = await CartModel.findOneAndUpdate({ "userBorrowInfo": req.body.userBorrowInfo },
                        { $set: checkCart },
                        { new: true })
                    res.status(200).json({ success: true, data: orderBook, msg: "Xác nhận mượn sách thành công!" })
                }
            }
            else {
                res.status(200).json({ success: false, data: [], msg: "Lỗi không thể xác định!" })
            }
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}

//BORROW BOOK
exports.borrowBook = async (req, res) => {
    const checkCart = await CartModel.findOne({ "userBorrowInfo": req.body.userBorrowInfo });
    try {
        for (let i = 0; i < req.body.cartItems.length; i++) {
            if (checkCart) {
                const checkBookStock = await BookModel.findById(req.body.cartItems[i].bookId)
                if (req.body.cartItems[i].amount > checkBookStock.stock) {
                    res.status(200).json({ success: false, data: [], msg: "Không thể đặt quá số lượng cho phép!" })
                } else {
                    for (let y = 0; y < checkCart.cartItems.length; y++) {
                        if (checkCart.cartItems[y].bookId == req.body.cartItems[i].bookId
                            && checkCart.cartItems[y].isOrder == true
                            && checkCart.cartItems[y].isConfirm == true
                            && checkCart.cartItems[y].isBorrowed == false
                            && checkCart.cartItems[y].isReturned == false
                            && checkCart.cartItems[y].isCancel == false
                            && checkCart.cartItems[y]._id == req.params.id) {
                            if (checkCart.cartItems[y].amount < req.body.cartItems[i].amount) {
                                res.status(200).json({ success: false, data: [], msg: "Không thể duyệt quá số lượng cho phép!" })
                            } else {
                                checkCart.cartItems[y].isBorrowed = true;
                                checkCart.cartItems[y].teacherBorrow = req.userExists.id
                                checkCart.cartItems[y].timeBorrow = new Date()
                                const date1Year = new Date()
                                date1Year.setFullYear(date1Year.getFullYear() + 1)
                                checkCart.cartItems[y].exp = date1Year;
                                await BookModel.findOneAndUpdate({ "_id": checkCart.cartItems[y].bookId },
                                    {
                                        $set: {
                                            authStock: checkBookStock.authStock + (checkCart.cartItems[y].amount - req.body.cartItems[i].amount),
                                            stock: checkBookStock.stock - req.body.cartItems[i].amount

                                        }
                                    })
                                checkCart.cartItems[y].amount = req.body.cartItems[i].amount
                            }
                        }
                    }
                    const orderBook = await CartModel.findOneAndUpdate({ "userBorrowInfo": req.body.userBorrowInfo },
                        { $set: checkCart },
                        { new: true })
                    res.status(200).json({ success: true, data: orderBook, msg: "Xác nhận mượn sách thành công!" })
                }
            }
            else {
                res.status(200).json({ success: false, data: [], msg: "Lỗi không thể xác định!" })
            }
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}

//RETURN BOOK
exports.returnBook = async (req, res) => {

    const checkCart = await CartModel.findOne({ "userBorrowInfo": req.body.userBorrowInfo });
    try {
        for (let i = 0; i < req.body.cartItems.length; i++) {
            if (checkCart) {
                const checkBookStock = await BookModel.findById(req.body.cartItems[i].bookId)
                // if (req.body.cartItems[i].amount > checkBookStock.authStock) {
                //     res.status(200).json({ success: false, data: [], msg: "Không thể duyệt quá số lượng cho phép!" })
                // } else {

                for (let y = 0; y < checkCart.cartItems.length; y++) {
                    if (checkCart.cartItems[y].bookId == req.body.cartItems[i].bookId
                        && checkCart.cartItems[y].isOrder == true
                        && checkCart.cartItems[y].isConfirm == true
                        && checkCart.cartItems[y].isBorrowed == true
                        && checkCart.cartItems[y].isReturned == false
                        && checkCart.cartItems[y].isCancel == false
                        && checkCart.cartItems[y]._id == req.params.id
                    ) {
                        if (checkCart.cartItems[y].amount < req.body.cartItems[i].amount) {
                            res.status(200).json({ success: false, data: [], msg: "Không thể duyệt quá số lượng cho phép!" })
                        } else {
                            checkCart.cartItems[y].isReturned = true;
                            checkCart.cartItems[y].teacherReturn = req.userExists.id
                            checkCart.cartItems[y].timeReturn = new Date()
                            await BookModel.findOneAndUpdate({ "_id": checkCart.cartItems[y].bookId },
                                {
                                    $set: { authStock: checkBookStock.authStock + req.body.cartItems[i].amount },
                                    stock: checkBookStock.stock + req.body.cartItems[i].amount
                                })
                            checkCart.cartItems[y].amount = req.body.cartItems[i].amount
                        }
                    }
                }
                const orderBook = await CartModel.findOneAndUpdate({ "userBorrowInfo": req.body.userBorrowInfo },
                    { $set: checkCart },
                    { new: true })              
                res.status(200).json({ success: true, data: orderBook, msg: "Xác nhận trả sách sách thành công!" })
                // }
            }
            else {
                res.status(200).json({ success: false, data: [], msg: "Lỗi không thể xác định!" })
            }
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}

//CANCEL ORDER
exports.cancelBook = async (req, res) => {
    const checkCart = await CartModel.findOne({ "userBorrowInfo": req.userExists.id });
    try {
        for (let i = 0; i < req.body.cartItems.length; i++) {
            if (checkCart) {
                const checkBookStock = await BookModel.findById(req.body.cartItems[i].bookId)
                // if (req.body.cartItems[i].amount > checkBookStock.authStock) {
                //     res.status(200).json({ success: false, data: [], msg: "Không thể đặt quá số lượng cho phép!" })
                // } else 
                {
                    for (let y = 0; y < checkCart.cartItems.length; y++) {
                        if (checkCart.cartItems[y].bookId == req.body.cartItems[i].bookId
                            && checkCart.cartItems[y].isOrder == true
                            && checkCart.cartItems[y].isConfirm == false
                            && checkCart.cartItems[y].isBorrowed == false
                            && checkCart.cartItems[y].isReturned == false
                            && checkCart.cartItems[y].isCancel == false
                            && checkCart.cartItems[y]._id == req.params.id) {
                            if (checkCart.cartItems[y].amount < req.body.cartItems.amount) {
                                res.status(200).json({ success: false, data: [], msg: "Không thể hủy quá số lượng cho phép!" })
                            } else {
                                checkCart.cartItems[y].isCancel = true;
                                checkCart.cartItems[y].teacherCancel = req.userExists.id
                                checkCart.cartItems[y].isBorrowed = true;
                                checkCart.cartItems[y].teacherBorrow = req.userExists.id
                                checkCart.cartItems[y].isConfirm = true;
                                checkCart.cartItems[y].teacherConfirm = req.userExists.id
                                checkCart.cartItems[y].isReturned = true;
                                checkCart.cartItems[y].teacherReturn = req.userExists.id
                                checkCart.cartItems[y].timeCancel = new Date()
                                checkCart.cartItems[y].exp = new Date()
                                await BookModel.findOneAndUpdate({ "_id": checkCart.cartItems[y].bookId },
                                    {
                                        $set: {
                                            authStock: checkBookStock.authStock + req.body.cartItems[i].amount
                                        }
                                    })
                            }
                        }
                    }
                    const orderBook = await CartModel.findOneAndUpdate({ "userBorrowInfo": req.body.userBorrowInfo },
                        { $set: checkCart },
                        { new: true })
                    res.status(200).json({ success: true, data: orderBook, msg: "Xác nhận hủy phiên mượn thành công!" })
                }
            }
            else {
                res.status(200).json({ success: false, data: [], msg: "Lỗi không thể xác định!" })
            }
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}
//GET WAIT TO CONFIRM BOOK
exports.getwaittoConfirmAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.find({ isDeleted: false })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ]).sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    for (let y = 0; y < getwaittoconfirmAdmin[i].cartItems.length; y++) {
                        if (getwaittoconfirmAdmin[i].cartItems[y].isOrder == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isConfirm == true
                            || getwaittoconfirmAdmin[i].cartItems[y].isCancel == true) {
                            getwaittoconfirmAdmin[i].cartItems.splice(y, 1)
                            y--
                        }
                    }
                }
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    if (getwaittoconfirmAdmin[i].cartItems.length == 0) {
                        getwaittoconfirmAdmin.splice(i, 1)
                        i--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}

//GET BOOK IN CART
exports.getBookInCart = async (req, res) => {
    try {
        const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, "userBorrowInfo": req.userExists.id })
            .populate("userBorrowInfo")
            .populate([
                {
                    path: "cartItems",
                    populate: {
                        path: "bookId"
                    }
                }
            ])
            .sort({ updatedAt: -1 });
        if (getwaittoconfirmAdmin) {
            for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                if (getwaittoconfirmAdmin.cartItems[y].isOrder == true
                    || getwaittoconfirmAdmin.cartItems[y].isCancel == true) {
                    getwaittoconfirmAdmin.cartItems.splice(y, 1)
                    y--
                }
            }
            res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
        }
        else {
            res.status(200).json({ success: true, data: "", msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
        }
    } catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}

//GET BOOK OF USER WAIT TO CONFIRM
exports.getWaitotConfirmUser = async (req, res) => {
    try {
        const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, "userBorrowInfo": req.userExists.id })
            .populate("userBorrowInfo")
            .populate([
                {
                    path: "cartItems",
                    populate: {
                        path: "bookId"
                    }
                }
            ])
            .sort({ updatedAt: -1 });
        if (getwaittoconfirmAdmin) {
            for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                if (getwaittoconfirmAdmin.cartItems[y].isOrder == false
                    || getwaittoconfirmAdmin.cartItems[y].isConfirm == true
                    || getwaittoconfirmAdmin.cartItems[y].isCancel == true) {
                    getwaittoconfirmAdmin.cartItems.splice(y, 1)
                    y--
                }
            }
            res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
        }
        else {
            res.status(200).json({ success: true, data: "", msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
        }
    } catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}

//GET BOOK OF USER WAIT TO BORROW
exports.getWaitoBorrowUser = async (req, res) => {
    try {
        const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, "userBorrowInfo": req.userExists.id })
            .populate("userBorrowInfo")
            .populate([
                {
                    path: "cartItems",
                    populate: {
                        path: "bookId"
                    }
                }
            ])
            .sort({ updatedAt: -1 });
        if (getwaittoconfirmAdmin) {
            for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                if (getwaittoconfirmAdmin.cartItems[y].isOrder == false
                    || getwaittoconfirmAdmin.cartItems[y].isConfirm == false
                    || getwaittoconfirmAdmin.cartItems[y].isBorrowed == true
                    || getwaittoconfirmAdmin.cartItems[y].isCancel == true) {
                    getwaittoconfirmAdmin.cartItems.splice(y, 1)
                    y--
                }
            }
            res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
        }
        else {
            res.status(200).json({ success: true, data: "", msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
        }
    } catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}

//GET BOOK OF USER BORROWING
exports.getBorrowingUser = async (req, res) => {
    try {
        const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, "userBorrowInfo": req.userExists.id })
            .populate("userBorrowInfo")
            .populate([
                {
                    path: "cartItems",
                    populate: {
                        path: "bookId"
                    }
                }
            ])
            .sort({ updatedAt: -1 });
        if (getwaittoconfirmAdmin) {
            for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                if (getwaittoconfirmAdmin.cartItems[y].isOrder == false
                    || getwaittoconfirmAdmin.cartItems[y].isConfirm == false
                    || getwaittoconfirmAdmin.cartItems[y].isBorrowed == false
                    || getwaittoconfirmAdmin.cartItems[y].isReturned == true
                    || getwaittoconfirmAdmin.cartItems[y].isCancel == true) {
                    getwaittoconfirmAdmin.cartItems.splice(y, 1)
                    y--
                }
            }
            res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
        }
        else {
            res.status(200).json({ success: true, data: "", msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
        }
    } catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}

//GET BOOK OF USER RETURNED
exports.getReturnedUser = async (req, res) => {
    try {
        const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, "userBorrowInfo": req.userExists.id })
            .populate("userBorrowInfo")
            .populate([
                {
                    path: "cartItems",
                    populate: {
                        path: "bookId"
                    }
                }
            ])
            .sort({ updatedAt: -1 });
        if (getwaittoconfirmAdmin) {
            for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                if (getwaittoconfirmAdmin.cartItems[y].isOrder == false
                    || getwaittoconfirmAdmin.cartItems[y].isConfirm == false
                    || getwaittoconfirmAdmin.cartItems[y].isBorrowed == false
                    || getwaittoconfirmAdmin.cartItems[y].isReturned == false
                    || getwaittoconfirmAdmin.cartItems[y].isCancel == true) {
                    getwaittoconfirmAdmin.cartItems.splice(y, 1)
                    y--
                }
            }
            res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
        }
        else {
            res.status(200).json({ success: true, data: "", msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
        }
    } catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}


//GET WAIT TO BORROW BOOK
exports.getwaittoBorrowAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.find({ isDeleted: false })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ]).sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    for (let y = 0; y < getwaittoconfirmAdmin[i].cartItems.length; y++) {
                        if (getwaittoconfirmAdmin[i].cartItems[y].isOrder == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isConfirm == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isBorrowed == true
                            || getwaittoconfirmAdmin[i].cartItems[y].isCancel == true) {
                            getwaittoconfirmAdmin[i].cartItems.splice(y, 1)
                            y--
                        }
                    }
                }
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    if (getwaittoconfirmAdmin[i].cartItems.length == 0) {
                        getwaittoconfirmAdmin.splice(i, 1)
                        i--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }
}

//BORROW BOOK ADMIN
exports.borrowBookAdmin = async (req, res) => {
    if (!req.body.userBorrowInfo) {
        res.status(200).json({ success: false, data: [], msg: "Vui lòng chọn giáo viên mượn sách!" })
    }
    else if (req.body.cartItems.length == 0) {
        res.status(200).json({ success: false, data: [], msg: "Sau khi điền số lượng, bấm thêm và xác nhận để mượn sách" })
    }
    else {
        const checkCart = await CartModel.findOne({ "userBorrowInfo": req.body.userBorrowInfo });
        if (checkCart) {
            for (i = 0; i < req.body.cartItems.length; i++) {
                const checkBookStock = await BookModel.findById(req.body.cartItems[i].bookId)
                if (req.body.cartItems[i].amount > checkBookStock.stock) {
                    res.status(200).json({ success: false, data: [], msg: "Không thể đặt quá số lượng cho phép!" })
                    break;
                } else {
                    const date1Year = new Date()
                    date1Year.setFullYear(date1Year.getFullYear() + 1)
                    const updateCart = await CartModel.findOneAndUpdate({ "userBorrowInfo": req.body.userBorrowInfo },
                        {
                            $push: {
                                cartItems:
                                {
                                    bookId: req.body.cartItems[i].bookId,
                                    amount: req.body.cartItems[i].amount,
                                    isOrder: true,
                                    isConfirm: true,
                                    isBorrowed: true,
                                    teacherConfirm: req.userExists.id,
                                    teacherBorrow: req.userExists.id,
                                    timeConfirm: new Date(),
                                    timeBorrow: new Date(),
                                    exp: date1Year
                                }
                            }
                        },
                        { new: true });
                    await BookModel.findOneAndUpdate({ "_id": req.body.cartItems[i].bookId },
                        {
                            $set: {
                                authStock: checkBookStock.authStock - req.body.cartItems[i].amount,
                                stock: checkBookStock.stock - req.body.cartItems[i].amount

                            }
                        })
                    if (i == req.body.cartItems.length - 1) {
                        res.status(200).json({ success: true, data: [], msg: "Đã thêm sách vào giỏ hàng" })
                    }
                }
            }
        }
        if (!checkCart) {
            const newCart = {
                userBorrowInfo: req.body.userBorrowInfo,
                cartItems: []
            }

            try {
                const date1Year = new Date()
                date1Year.setFullYear(date1Year.getFullYear() + 1)
                for (i = 0; i < req.body.cartItems.length; i++) {
                    const checkBookStock = await BookModel.findById(req.body.cartItems[i].bookId)
                    newCart.cartItems.push(
                        {
                            bookId: req.body.cartItems[i].bookId,
                            amount: req.body.cartItems[i].amount,
                            isOrder: true,
                            isConfirm: true,
                            isBorrowed: true,
                            teacherConfirm: req.userExists.id,
                            teacherBorrow: req.userExists.id,
                            timeConfirm: new Date(),
                            timeBorrow: new Date(),
                            exp: date1Year
                        }
                    )
                    await BookModel.findOneAndUpdate({ "_id": req.body.cartItems[i].bookId },
                        {
                            $set: {
                                authStock: checkBookStock.authStock - req.body.cartItems[i].amount,
                                stock: checkBookStock.stock - req.body.cartItems[i].amount

                            }
                        })
                }
                const addUserCart = await CartModel(newCart).save();
                res.status(200).json({ success: true, data: addUserCart, msg: "Đã thêm sách vào giỏ hàng" })
            } catch (err) {
                return res.status(500).json({ success: false, msg: err.message });
            }
        }
    }
}

//GET BORROWED BOOK
exports.getBorrowedAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.find({ isDeleted: false })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ]).sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    for (let y = 0; y < getwaittoconfirmAdmin[i].cartItems.length; y++) {
                        if (getwaittoconfirmAdmin[i].cartItems[y].isOrder == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isConfirm == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isBorrowed == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isReturned == true
                            || getwaittoconfirmAdmin[i].cartItems[y].isCancel == true) {
                            getwaittoconfirmAdmin[i].cartItems.splice(y, 1)
                            y--
                        }
                    }
                }
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    if (getwaittoconfirmAdmin[i].cartItems.length == 0) {
                        getwaittoconfirmAdmin.splice(i, 1)
                        i--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}

//GET CANCEL BOOK
exports.getCancelAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.find({ isDeleted: false })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ]).sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    for (let y = 0; y < getwaittoconfirmAdmin[i].cartItems.length; y++) {
                        if (getwaittoconfirmAdmin[i].cartItems[y].isCancel == false) {
                            getwaittoconfirmAdmin[i].cartItems.splice(y, 1)
                            y--
                        }
                    }
                }
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    if (getwaittoconfirmAdmin[i].cartItems.length == 0) {
                        getwaittoconfirmAdmin.splice(i, 1)
                        i--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}


//GET RETURNED BOOK
exports.getReturnedAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.find({ isDeleted: false })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ]).sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    for (let y = 0; y < getwaittoconfirmAdmin[i].cartItems.length; y++) {
                        if (getwaittoconfirmAdmin[i].cartItems[y].isOrder == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isConfirm == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isBorrowed == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isReturned == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isCancel == true) {
                            getwaittoconfirmAdmin[i].cartItems.splice(y, 1)
                            y--
                        }
                    }
                }
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    if (getwaittoconfirmAdmin[i].cartItems.length == 0) {
                        getwaittoconfirmAdmin.splice(i, 1)
                        i--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}


//STATS BORROWED BOOK
exports.statsBook = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.find({ isDeleted: false });
            if (getwaittoconfirmAdmin) {
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    for (let y = 0; y < getwaittoconfirmAdmin[i].cartItems.length; y++) {
                        if (getwaittoconfirmAdmin[i].cartItems[y].isOrder == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isConfirm == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isBorrowed == false
                            // || getwaittoconfirmAdmin[i].cartItems[y].isReturned == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isCancel == true) {
                            getwaittoconfirmAdmin[i].cartItems.splice(y, 1)
                            y--
                        }
                    }
                }
                let monthYear = [];
                for (let z = 0; z < getwaittoconfirmAdmin.length; z++) {
                    for (let c = 0; c < getwaittoconfirmAdmin[z].cartItems.length; c++) {
                        if (getwaittoconfirmAdmin[z].cartItems.length == 0) {
                            c++
                        }
                        else {

                            monthYear.push({ Tháng: (getwaittoconfirmAdmin[z].cartItems[c].timeBorrow.getMonth() + 1) + "/" + getwaittoconfirmAdmin[z].cartItems[c].timeBorrow.getFullYear() })
                        }
                    }
                }
                if (monthYear.length != 0) {
                    let result = monthYear.reduce(function (acc, curr) {
                        // Check if there exist an object in empty array whose CategoryId matches
                        let isElemExist = acc.findIndex(function (item) {
                            return item.Tháng === curr.Tháng;
                        })
                        if (isElemExist === -1) {
                            let obj = {};
                            obj.Tháng = curr.Tháng;
                            obj.Tổng = 1;
                            acc.push(obj)
                        } else {
                            acc[isElemExist].Tổng += 1
                        }
                        return acc;

                    }, [])

                    res.status(200).json({ success: true, data: result, msg: "Lấy dữ liệu thành công!" })
                }
                else {
                    res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào!" })
                }

            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }
}

//GET USER ALL BOOK
exports.getUserCartAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, userBorrowInfo: req.params.id })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherConfirm"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherBorrow"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherReturn"
                        }
                    }
                ])
                .sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                    if (getwaittoconfirmAdmin.cartItems[y].isReturned == false
                        & getwaittoconfirmAdmin.cartItems[y].isBorrowed == false
                        & getwaittoconfirmAdmin.cartItems[y].isConfirm == false
                        & getwaittoconfirmAdmin.cartItems[y].isOrder == false
                        & getwaittoconfirmAdmin.cartItems[y].isCancel == false
                    ) {
                        getwaittoconfirmAdmin.cartItems.splice(y, 1)
                        y--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, data: "", msg: "Không tìm thấy dữ liệu" });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}

//STATS BORROWED BOOK
exports.statsUserBook = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, userBorrowInfo: req.params.id });
            if (getwaittoconfirmAdmin) {
                for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                    if (getwaittoconfirmAdmin.cartItems[y].isOrder == false
                        || getwaittoconfirmAdmin.cartItems[y].isConfirm == false
                        || getwaittoconfirmAdmin.cartItems[y].isBorrowed == false
                        // || getwaittoconfirmAdmin.cartItems[y].isReturned == true
                        || getwaittoconfirmAdmin.cartItems[y].isCancel == true) {
                        getwaittoconfirmAdmin.cartItems.splice(y, 1)
                        y--
                    }
                }

                let arrayList = getwaittoconfirmAdmin
                let monthYear = [];
                for (let c = 0; c < arrayList.cartItems.length; c++) {
                    if (arrayList.cartItems.length == 0) {
                        c++
                    }
                    else {

                        monthYear.push({ Tháng: (arrayList.cartItems[c].timeBorrow.getMonth() + 1) + "/" + arrayList.cartItems[c].timeBorrow.getFullYear() })
                    }
                }
                if (monthYear.length != 0) {
                    let result = monthYear.reduce(function (acc, curr) {
                        // Check if there exist an object in empty array whose CategoryId matches
                        let isElemExist = acc.findIndex(function (item) {
                            return item.Tháng === curr.Tháng;
                        })
                        if (isElemExist === -1) {
                            let obj = {};
                            obj.Tháng = curr.Tháng;
                            obj.Tổng = 1;
                            acc.push(obj)
                        } else {
                            acc[isElemExist].Tổng += 1
                        }
                        return acc;

                    }, [])

                    res.status(200).json({ success: true, data: result, msg: "Lấy dữ liệu thành công!" })
                }
                else {
                    res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào!" })
                }

            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }
}

//GET USER RETURNED BOOK
exports.getUserReturnedAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, userBorrowInfo: req.params.id })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherConfirm"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherBorrow"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherReturn"
                        }
                    }
                ])
                .sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                    if (getwaittoconfirmAdmin.cartItems[y].isReturned == false
                        || getwaittoconfirmAdmin.cartItems[y].isBorrowed == false
                        || getwaittoconfirmAdmin.cartItems[y].isConfirm == false
                        || getwaittoconfirmAdmin.cartItems[y].isOrder == false
                        || getwaittoconfirmAdmin.cartItems[y].isCancel == true
                    ) {
                        getwaittoconfirmAdmin.cartItems.splice(y, 1)
                        y--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}

//GET USER BORROWING BOOK
exports.getUserBorroweddAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, userBorrowInfo: req.params.id })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherConfirm"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherBorrow"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherReturn"
                        }
                    }
                ])
                .sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                    if (getwaittoconfirmAdmin.cartItems[y].isReturned == true
                        || getwaittoconfirmAdmin.cartItems[y].isBorrowed == false
                        || getwaittoconfirmAdmin.cartItems[y].isConfirm == false
                        || getwaittoconfirmAdmin.cartItems[y].isOrder == false
                        || getwaittoconfirmAdmin.cartItems[y].isCancel == true
                    ) {
                        getwaittoconfirmAdmin.cartItems.splice(y, 1)
                        y--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}

//GET USER CONFIRM BOOK
exports.getUserConfirmAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, userBorrowInfo: req.params.id })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherConfirm"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherBorrow"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherReturn"
                        }
                    }
                ])
                .sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                    if (getwaittoconfirmAdmin.cartItems[y].isOrder == false
                        || getwaittoconfirmAdmin.cartItems[y].isConfirm == true
                        || getwaittoconfirmAdmin.cartItems[y].isBorrowed == true
                        || getwaittoconfirmAdmin.cartItems[y].isCancel == true) {
                        getwaittoconfirmAdmin.cartItems.splice(y, 1)
                        y--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}

//GET USER WAIT TO BORROW BOOK
exports.getUserWaittoBorrowAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, userBorrowInfo: req.params.id })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherConfirm"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherBorrow"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherReturn"
                        }
                    }
                ])
                .sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                    if (getwaittoconfirmAdmin.cartItems[y].isOrder == false
                        || getwaittoconfirmAdmin.cartItems[y].isConfirm == false
                        || getwaittoconfirmAdmin.cartItems[y].isBorrowed == true
                        || getwaittoconfirmAdmin.cartItems[y].isCancel == true) {
                        getwaittoconfirmAdmin.cartItems.splice(y, 1)
                        y--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}

//GET USER WAIT TO BORROW BOOK
exports.getUserCancelAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.findOne({ isDeleted: false, userBorrowInfo: req.params.id })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherConfirm"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherBorrow"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherReturn"
                        }
                    }
                ])
                .sort({ updatedAt: -1 });
            if (getwaittoconfirmAdmin) {
                for (let y = 0; y < getwaittoconfirmAdmin.cartItems.length; y++) {
                    if (getwaittoconfirmAdmin.cartItems[y].isCancel == false) {
                        getwaittoconfirmAdmin.cartItems.splice(y, 1)
                        y--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}

//GET USER ALL BOOK
exports.getCartAdmin = async (req, res) => {
    if (req.userExists.isAdmin) {
        try {
            const getwaittoconfirmAdmin = await CartModel.find({ isDeleted: false })
                .populate("userBorrowInfo")
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "bookId"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherConfirm"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherBorrow"
                        }
                    }
                ])
                .populate([
                    {
                        path: "cartItems",
                        populate: {
                            path: "teacherReturn"
                        }
                    }
                ]).sort({ cartItems: -1 });
            if (getwaittoconfirmAdmin) {
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    for (let y = 0; y < getwaittoconfirmAdmin[i].cartItems.length; y++) {
                        if (getwaittoconfirmAdmin[i].cartItems[y].isOrder == false
                            & getwaittoconfirmAdmin[i].cartItems[y].isConfirm == false
                            & getwaittoconfirmAdmin[i].cartItems[y].isBorrowed == false
                            & getwaittoconfirmAdmin[i].cartItems[y].isReturned == false
                            || getwaittoconfirmAdmin[i].cartItems[y].isCancel == true) {
                            getwaittoconfirmAdmin[i].cartItems.splice(y, 1)
                            y--
                        }
                    }
                }
                for (let i = 0; i < getwaittoconfirmAdmin.length; i++) {
                    if (getwaittoconfirmAdmin[i].cartItems.length == 0) {
                        getwaittoconfirmAdmin.splice(i, 1)
                        i--
                    }
                }
                res.status(200).json({ success: true, data: getwaittoconfirmAdmin, msg: "Lấy dữ liệu thành công!" })
            }
            else {
                res.status(200).json({ success: true, data: [], msg: "Không có bất kì phiên mượn sách nào chờ duyệt!" })
            }
        } catch (err) {
            return res.status(500).json({ success: false, msg: err.message });
        }
    } else {
        res.status(200).json({ success: true, data: [], msg: "Bạn không phải admin để thực hiện thao tác này" })
    }

}