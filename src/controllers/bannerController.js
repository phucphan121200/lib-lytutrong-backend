const { BannerModel } = require("../models/BannerModel")

//ADD BANNER
exports.createBanner = async (req, res) => {
  const newBanner = {
    name: req.body.name,
    image: req.body.image,
    description: req.body.description,
    link: req.body.link
  };
  try {
    if (req.userExists.isAdmin) {
      if (!newBanner.name || !req.body.image || !req.body.description || !req.body.link) {
        return res
          .status(200)
          .send({ success: false, msg: "Không được để trống thông tin" });
      } else if (await BannerModel.findOne({ name: newBanner.name, isDeleted: false })) {
        return res
          .status(200)
          .json({ success: false, msg: "Không thể đặt tên banner trùng với banner trước đó" });

      } else {
        const addCategory = await BannerModel(newBanner).save();
        return res.status(200).json({ success: true, data: addCategory, msg: "Thêm banner thành công" });
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

//UPDATE BANNER
exports.updateBanner = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      if (!req.body.name || !req.body.image || !req.body.description || !req.body.link) {
        return res
          .status(200)
          .send({ success: false, msg: "Không được để trống thông tin" });
      }  else {
        const updateCategory = await BannerModel.findByIdAndUpdate(req.params.id,
          { $set: req.body },
          { new: true });
        return res.status(200).json({ success: true, data: updateCategory, msg: "Cập nhật banner thành công" });
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
exports.deleteBanner = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      const deleteCategory = await BannerModel.findByIdAndUpdate(
        req.params.id,
        { $set: { isDeleted: true } },
        { new: true }
      );
      if (!deleteCategory) {
        return res.status(403).json({ success: false, msg: "Không tìm thấy banner nào!" });
      } else {
        return res
          .status(200)
          .json({ success: true, msg: "Banner đã bị xóa thành công!" });
      }
    } else {
      return res.status(403).json({ success: false, msg: "Không có quyền truy cập" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

//GET ALL CATEGORY
exports.getallBanner = async (req, res) => {
  try {
    const findCategory = await BannerModel.find({ isDeleted: false }).sort({createdAt: 1});
    if (findCategory == "") {
      return res.status(200).json({ success: false, msg: "Không có bất kỳ banner được tìm thấy", data: [] });
    } else {
      return res.status(200).json({ success: true, data: findCategory, msg: "" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
};