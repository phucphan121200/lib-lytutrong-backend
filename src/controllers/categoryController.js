const { CategoryModel } = require("../models/CategoryModel")

//ADD CATEGORY
exports.createCategory = async (req, res) => {
  const newCategory = {
    name: req.body.name,
    image: req.body.image
  };
  try {
    if (req.userExists.isAdmin) {
      if (!newCategory.name || !req.body.image) {
        return res
          .status(200)
          .send({ success: false, msg: "Không được để trống thông tin" });
      } else if (await CategoryModel.findOne({ name: newCategory.name, isDeleted: false })) {
        return res
          .status(200)
          .json({ success: false, msg: "Đã có thể loại này! Vui lòng kiểm tra lại!" });

      } else {
        const addCategory = await CategoryModel(newCategory).save();
        return res.status(200).json({ success: true, data: addCategory, msg: "Thêm thể loại thành công" });
      }
    } else {
      return res
        .status(200)
        .json({ success: false, msg: "Không có quyền truy cập"  });
    }

  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

//UPDATE CATEGORY
exports.updateCategory = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      if (!req.body.name || !req.body.image) {
        return res
          .status(401)
          .send({ success: false, msg: "Không được để trống thông tin" });
      }  else {
        const updateCategory = await CategoryModel.findByIdAndUpdate(req.params.id,
          { $set: req.body },
          { new: true });
        return res.status(200).json({ success: true, data: updateCategory, msg: "Cập nhật thể loại thành công" });
      }
    } else {
      return res
        .status(200)
        .json({ success: false, msg: "Không có quyền truy cập" });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//DELETE CATEGORY
exports.deleteCategory = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      const deleteCategory = await CategoryModel.findByIdAndUpdate(
        req.params.id,
        { $set: { isDeleted: true } },
        { new: true }
      );
      if (!deleteCategory) {
        return res.status(403).json({ success: false, msg: "hông tìm thấy thể loại nào!" });
      } else {
        return res
          .status(200)
          .json({ success: true, msg: "Thể loại sách đã xóa thành công!" });
      }
    } else {
      return res.status(403).json({ success: false, msg: "Not Permission" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

//RECOVER CATEGORY
exports.recoverCategory = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      const deleteCategory = await CategoryModel.findByIdAndUpdate(
        req.params.id,
        { $set: { isDeleted: false } },
        { new: true }
      );
      if (!deleteCategory) {
        return res.status(403).json({ success: false, msg: "Category not found!" });
      } else {
        return res
          .status(200)
          .json({ success: true, msg: "Category has been recovered..." });
      }
    } else {
      return res.status(403).json({ success: false, msg: "Not Permission" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

//GET CATEGORY
exports.getCategory = async (req, res) => {
  try {
    const findCategory = await CategoryModel.findById(req.params.id);
    if (!findCategory) {
      return res.status(403).json({ success: false, msg: "Category not found!" });
    } else if (findCategory.isDeleted === true) {
      return res.status(403).json({ success: false, msg: "Category not found!" });
    } else {
      return res.status(200).json({ success: true, data: findCategory, msg: "" });
    }
  } catch (err) {
    return res.status(500).json({ success: true, msg: err });
  }
};

//GET ALL CATEGORY
exports.getallCategory = async (req, res) => {
  try {
    const findCategory = await CategoryModel.find({ isDeleted: false }).sort({updatedAt: -1});
    if (findCategory == "") {
      return res.status(200).json({ success: false, msg: "Không có bất kỳ loại sách được tìm thấy", data: [] });
    } else {
      return res.status(200).json({ success: true, data: findCategory, msg: "" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
};

//GET ALL DELETE CATEGORY
exports.getalldeletedCategory = async (req, res) => {
  try {
    const findCategory = await CategoryModel.find({ isDeleted: true });
    console.log(findCategory)
    if (findCategory == "") {
      return res.status(200).json({ success: true, msg: "Category not found!", data: [] });
    } else {
      return res.status(200).json({ success: true, data: findCategory, msg: "" });
    }
  } catch (err) {
    return res.status(500).json({ success: true, msg: err });
  }
};