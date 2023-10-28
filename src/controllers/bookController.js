const { BookModel } = require("../models/BookModel")
const { CategoryModel } = require("../models/CategoryModel")
const XLSX = require('xlsx')
const { Workbook } = require('exceljs')
const fs = require('fs');

//ADD FILE BOOK
exports.addFileBook = async (req, res) => {
  try {
    const count = await BookModel.count()
    const workbook = XLSX.readFile(req.file.path);
    const sheet_namelist = workbook.SheetNames;
    let x = 0;
    const bookData = [];
    for (let x = 0; x < sheet_namelist.length; x++) {
      const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_namelist[x]]);
      for (let i = 0; i < xlData.length; i++) {
        const cate = await CategoryModel.findOne({ name: xlData[i].Theloai });
        bookData.push({
          name: xlData[i].Tensach,
          publicationdate: xlData[i].Namxuatban,
          stock: xlData[i].Soluong,
          authStock: xlData[i].Soluong,
          liquid: 0,
          grade: xlData[i].Lop,
          image: xlData[i].Hinhanh,
          translator: xlData[i].Tacgia,
          price: xlData[i].Dongia,
          categoryItems: [{ categoryId: cate._id }],
          bookId: "BOOK-" + (count+ (i+1))
        });
      }
    }
    await BookModel.insertMany(bookData)
    fs.unlink(req.file.path, (err) => {
      if (err) {
        res.status(200).json({ success: false, data: [], msg: "Lỗi hệ thống" })
      }
      else {
      }
    })
    res.status(200).json({ success: true, msg: "Thêm đầu sách thành công" })
  } catch (error) {
    res.status(200).json({ success: false, data: [], msg: "Lỗi hệ thống" })
  }
}

//EXPORT FILE
exports.exportFileBook = async (req, res) => {
  try {
    const wb = new Workbook();
    const ws = wb.addWorksheet("Đầu sách")

    ws.columns = [
      { header: "STT", key: "stt" },
      { header: "ID", key: "bookId" },
      { header: "Tên sách", key: "name" },
      { header: "Tác giả", key: "translator" },
      { header: "Năm xuất bản", key: "publicationdate" },
      { header: "Thể loại", key: "categoryItems" },
      { header: "Số lượng khả dụng", key: "authStock" },
      { header: "Số lượng thực tế", key: "stock" },
      { header: "Số lượng thanh lý", key: "liquid" }
    ]

    const data = await BookModel.find({ isDeleted: false }).populate([
      {
        path: "categoryItems",
        populate: {
          path: "categoryId",
          select: "name",
        }
      }
    ])

    const add = []
    if (req.params.id == 1) {
      for (let i = 0; i < data.length; i++) {
        add.push({
          stt: i + 1,
          bookId: data[i].bookId,
          name: data[i].name,
          translator: data[i].translator,
          publicationdate: data[i].publicationdate,
          categoryItems: data[i].categoryItems[0].categoryId.name,
          authStock: data[i].authStock,
          stock: data[i].stock,
          liquid: data[i].liquid
        })
      }
    }
    else {
      let count = 0;
      for (let i = 0; i < data.length; i++) {
        for (let y = 0; y < data[i].categoryItems.length; y++) {
          if (data[i].categoryItems[y].categoryId._id == req.params.id) {
            add.push({
              stt: count + 1,
              bookId: data[i].bookId,
              name: data[i].name,
              translator: data[i].translator,
              publicationdate: data[i].publicationdate,
              categoryItems: data[i].categoryItems[0].categoryId.name,
              authStock: data[i].authStock,
              stock: data[i].stock,
              liquid: data[i].liquid
            })
            count += 1
          }
        }
      }
    }

    add.forEach((book) => {
      ws.addRow(book)
    })


    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true }
    })
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=book-${Date()}.xlsx`);

    return wb.xlsx.write(res).then(() => {
      res.status(200);
    })
  } catch (error) {
    res.status(200).json({ success: false, data: [], msg: "Lỗi hệ thống" })
  }
}

//ADD BOOK
exports.createBook = async (req, res) => {
  const count = await BookModel.count()
  const newBook = {
    name: req.body.name,
    bookId: "BOOK-" + (count + 1),
    publicationdate: req.body.publicationdate,
    stock: req.body.stock,
    authStock: req.body.stock,
    liquid: 0,
    grade: req.body.grade,
    image: req.body.image,
    categoryItems: req.body.categoryItems,
    translator: req.body.translator,
    price: req.body.price
  };

  try {
    if (req.userExists.isAdmin) {
      if (!newBook.name
        || !newBook.publicationdate
        || !newBook.stock
        || !newBook.categoryItems
        || !newBook.price) {
        return res
          .status(200)
          .send({ success: false, msg: "Vui lòng điền đủ thông tin" });
      } else {
        const addBook = await BookModel(newBook).save();
        return res.status(200).json({ success: true, data: addBook, msg: "Thêm đầu sách thành công" });
      }
    } else {
      return res
        .status(200)
        .json({ success: false, msg: "Bạn không có quyền để thêm đầu sách" });
    }

  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

//UPDATE BOOK
exports.updateBook = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      if (!req.body.name
        || !req.body.publicationdate
        || !req.body.categoryItems) {
        return res
          .status(200)
          .send({ success: false, msg: "Vui lòng điền đầy đủ thông tin" });
      } {
        const updateBook = await BookModel.findByIdAndUpdate(req.params.id,
          { $set: req.body },
          { new: true });
        return res.status(200).json({ success: true, data: updateBook, msg: "Cập nhật đầu sách thành công" });
      }
    } else {
      return res
        .status(200)
        .json({ success: false, msg: "Bạn không có quyền để cập nhật thông tin" });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
//INBOUND BOOK
exports.inboundBook = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      if (!req.body.stock) {
        return res
          .status(200)
          .json({ success: false, data: [], msg: "Vui lòng thêm số lượng cần nhập" });
      } else {
        const findBook = await BookModel.findById(req.params.id);
        const newstock = findBook.stock + parseInt(req.body.stock);
        const newAuthStock = findBook.authStock + parseInt(req.body.stock)
        const updateBook = await BookModel.findByIdAndUpdate(req.params.id,
          {
            $set: {
              "stock": newstock,
              authStock: newAuthStock
            }
          },
          { new: true });
        return res.status(200).json({ success: true, data: updateBook, msg: "Nhập sách thành công! Số tồn hiện tại là: " + updateBook.stock });
      }
    } else {
      return res
        .status(200)
        .json({ success: false, msg: "Bạn không có quyền tăng tồn!" });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//LIQUID BOOK
exports.liquidBook = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      if (!req.body.stock) {
        return res
          .status(200)
          .json({ success: false, data: [], msg: "Vui lòng thêm số lượng cần nhập" });
      } else {
        const findBook = await BookModel.findById(req.params.id);
        if (req.body.stock > findBook.authStock) {
          return res
            .status(200)
            .json({ success: false, data: [], msg: "Có phiên mượn đang chứa sách đã chọn" });
        }
        else {
          const newstock = findBook.stock - parseInt(req.body.stock);
          const newAuthStock = findBook.authStock - parseInt(req.body.stock)
          const newLiquid = findBook.liquid + parseInt(req.body.stock)
          const updateBook = await BookModel.findByIdAndUpdate(req.params.id,
            {
              $set: {
                stock: newstock,
                authStock: newAuthStock,
                liquid: newLiquid
              }
            },
            { new: true });
          return res.status(200).json({ success: true, data: updateBook, msg: "Thanh lý thành công! Số tồn hiện tại là: " + updateBook.stock });
        }
      }
    } else {
      return res
        .status(200)
        .json({ success: false, msg: "Bạn không có quyền thanh lý sách!" });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//DELETE BOOK
exports.deleteBook = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      const deleteCategory = await BookModel.findByIdAndUpdate(
        req.params.id,
        { $set: { isDeleted: true } },
        { new: true }
      );
      if (!deleteCategory) {
        return res.status(200).json({ success: false, msg: "Không tìm thấy đầu sách này" });
      } else {
        return res
          .status(200)
          .json({ success: true, msg: "Đầu sách đã được xóa thành công" });
      }
    } else {
      return res.status(200).json({ success: false, msg: "Bạn không có quyền xóa đầu sách" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

//RECOVER BOOK
exports.recoverBook = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      const deleteCategory = await BookModel.findByIdAndUpdate(
        req.params.id,
        { $set: { isDeleted: false } },
        { new: true }
      );
      if (!deleteCategory) {
        return res.status(403).json({ success: false, msg: "Book not found!" });
      } else {
        return res
          .status(200)
          .json({ success: true, msg: "Book has been recovered..." });
      }
    } else {
      return res.status(403).json({ success: false, msg: "Not Permission" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

//GET BOOK
exports.getBook = async (req, res) => {
  try {
    const findBook = await BookModel.findById(req.params.id).populate([
      {
        path: "categoryItems",
        populate: {
          path: "categoryId",
          select: "name",
        }
      }
    ]);
    if (!findBook) {
      return res.status(200).json({ success: false, data: [], msg: "Không tìm thấy sách!" });
    } else if (findBook.isDeleted === true) {
      return res.status(200).json({ success: false, data: [], msg: "Không tìm thấy sách!" });
    } else {
      return res.status(200).json({ success: true, data: findBook, msg: "Lấy dữ liệu thành công" });
    }
  } catch (err) {
    return res.status(200).json({ success: false, data: "", msg: "Không tìm thấy sách này!" });
  }
};

// GET ALL BOOK
exports.getallBook = async (req, res) => {
  if (req.userExists.isAdmin) {
    try {
      const findBook = await BookModel.find({ isDeleted: false }).populate([
        {
          path: "categoryItems",
          populate: {
            path: "categoryId",
            select: "name",
          }
        }
      ]).sort({ updatedAt: -1 });
      if (findBook == "") {
        return res.status(200).json({ success: true, msg: "Không tìm thấy bất kì đầu sách nào!", data: [] });
      } else {
        if (req.params.id == 1) {
          return res.status(200).json({ success: true, data: findBook, msg: "Lấy dữ liệu thành công" });
        }
        else {
          const filter = []
          for (i = 0; i < findBook.length; i++) {
            for (y = 0; y < findBook[i].categoryItems.length; y++) {
              if (findBook[i].categoryItems[y].categoryId._id == req.params.id) {
                filter.push(findBook[i])
              }
            }
          }
          return res.status(200).json({ success: true, data: filter, msg: "Lấy dữ liệu thành công" });
        }
      }
    } catch (err) {
      return res.status(500).json({ success: true, msg: err });
    }
  }
  else {
    return res.status(200).json({ success: true, msg: "Bạn không có quyền truy cập", data: [] });
  }
};

// GET ALL BOOK WITH AUTH STOCK !=0
exports.getallStockBook = async (req, res) => {
  if (req.userExists.isAdmin) {
    try {
      const findBook = await BookModel.find({ isDeleted: false, stock: { $gt: 0 } }).populate([
        {
          path: "categoryItems",
          populate: {
            path: "categoryId",
            select: "name",
          }
        }
      ]).sort({ updatedAt: -1 });
      if (findBook == "") {
        return res.status(200).json({ success: true, msg: "Không tìm thấy bất kì đầu sách nào!", data: [] });
      } else {
        return res.status(200).json({ success: true, data: findBook, msg: "Lấy dữ liệu thành công" });
      }
    } catch (err) {
      return res.status(500).json({ success: true, msg: err });
    }
  }
  else {
    return res.status(200).json({ success: true, msg: "Bạn không có quyền truy cập", data: [] });
  }
};

// GET ALL BOOK
exports.getallBookClient = async (req, res) => {

  try {
    const findBook = await BookModel.find({ isDeleted: false, stock: { $gt: 0 } }).populate([
      {
        path: "categoryItems",
        populate: {
          path: "categoryId",
          select: "name",
        }
      }
    ]).sort({ updatedAt: -1 });
    if (findBook == "") {
      return res.status(200).json({ success: true, msg: "Không tìm thấy bất kì đầu sách nào!", data: [] });
    } else {
      return res.status(200).json({ success: true, data: findBook, msg: "Lấy dữ liệu thành công" });
    }
  } catch (err) {
    return res.status(500).json({ success: true, msg: err });
  }
};

// FILTER ALL BOOK
exports.filterBookClient = async (req, res) => {
  try {
    const findBook = await BookModel.find({ isDeleted: false }).populate([
      {
        path: "categoryItems",
        populate: {
          path: "categoryId",
          select: "name",
        }
      }
    ]).sort({ updatedAt: -1 });
    if (findBook == "") {
      return res.status(200).json({ success: true, msg: "Không tìm thấy bất kì đầu sách nào!", data: [] });
    } else {
      const filter = []
      if (req.body.cate == 1 && req.body.grade == 0) {
        return res.status(200).json({ success: true, data: findBook, msg: "Lấy dữ liệu thành công" });
      }
      else if (req.body.cate != 1 && req.body.grade == 0) {
        for (i = 0; i < findBook.length; i++) {
          for (y = 0; y < findBook[i].categoryItems.length; y++) {
            if (findBook[i].categoryItems[y].categoryId._id == req.body.cate) {
              filter.push(findBook[i])
            }
          }
        }
        return res.status(200).json({ success: true, data: filter, msg: "Lấy dữ liệu thành công" });
      }
      else if (req.body.cate === 1 && req.body.grade != 0) {
        for (i = 0; i < findBook.length; i++) {
          if (findBook[i].grade == req.body.grade) {
            filter.push(findBook[i])
          }
        }
        return res.status(200).json({ success: true, data: filter, msg: "Lấy dữ liệu thành công" });
      }
      else {
        for (i = 0; i < findBook.length; i++) {
          for (y = 0; y < findBook[i].categoryItems.length; y++) {
            if (findBook[i].categoryItems[y].categoryId._id == req.body.cate && findBook[i].grade == req.body.grade) {
              filter.push(findBook[i])
            }
          }
        }
        return res.status(200).json({ success: true, data: filter, msg: "Lấy dữ liệu thành công" });
      }
    }
  } catch (err) {
    return res.status(500).json({ success: true, msg: err });
  }
};

//GET ALL DELETE CATEGORY
exports.getalldeletedBook = async (req, res) => {
  try {
    const findBook = await BookModel.find({ isDeleted: true }).populate([
      {
        path: "categoryItems",
        populate: {
          path: "categoryId",
          select: "name",
        }
      }
    ]);
    if (findBook == "") {
      return res.status(200).json({ success: true, msg: "Book not found!", data: [] });
    } else {
      return res.status(200).json({ success: true, data: Book, msg: "" });
    }
  } catch (err) {
    return res.status(500).json({ success: true, msg: err });
  }
};

// GET ALL BOOK
exports.getallRandomBook = async (req, res) => {
  try {
    const findBook = await BookModel.find({ isDeleted: false, stock: { $gt: 0 } }).populate([
      {
        path: "categoryItems",
        populate: {
          path: "categoryId",
          select: "name",
        }
      }
    ]);
    if (findBook == "") {
      return res.status(200).json({ success: true, msg: "Không tìm thấy bất kì đầu sách nào!", data: [] });
    } else {
      for (let i = findBook.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [findBook[i], findBook[j]] = [findBook[j], findBook[i]];
      }
      if (findBook.length >= 8) {
        let array8length = []
        for (let i = 0; i < 8; i++) {
          array8length.push(findBook[i])
        }
        return res.status(200).json({ success: true, data: array8length, msg: "Lấy dữ liệu thành công" });
      }
      else {
        return res.status(200).json({ success: true, data: findBook, msg: "Lấy dữ liệu thành công" });
      }
    }
  } catch (err) {
    return res.status(500).json({ success: true, msg: err });
  }
};