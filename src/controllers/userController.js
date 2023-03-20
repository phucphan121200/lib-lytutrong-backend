const { UserModel } = require("../models/UserModel")
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

//ADD USER
exports.createUser = async (req, res) => {
  const password = process.env.NEWPASSWORD
  const newUser = {
    name: req.body.name,
    phone: req.body.phone,
    image: req.body.image,
    password: CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(password), process.env.SECRET_KEY
    ).toString(),
    isAdmin: req.body.isAdmin
  };
  try {
    if (req.userExists.isAdmin) {
      if (!newUser.name || !newUser.phone) {
        return res
          .status(200)
          .send({ success: false, msg: "Vui lòng điền đầy đủ thông tin" });
      } else if (!(await validatePhone(newUser.phone))) {
        return res.status(200).json({ success: false, msg: "Số điện thoại không hợp lệ!" });
      } else if (await UserModel.findOne({ phone: newUser.phone })) {
        return res
          .status(200)
          .json({ success: false, msg: "Số điện thoại đã bị trùng!" });

      }
      else {
        const addUser = await UserModel(newUser).save();
        return res.status(200).json({ success: true, data: addUser, msg: "Thêm người dùng thành công" });
      }
    } else {
      return res
        .status(200)
        .json({ success: false, msg: "Chỉ admin mới có thể thêm người dùng mới" });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//LOGIN ADMIN
exports.login = async (req, res) => {
  try {
    console.log(req.body.phone)
    const findUser = await UserModel.findOne({ phone: req.body.phone });
    console.log(findUser)
    if (!req.body.phone || !req.body.password) {
      return res
        .status(200)
        .json({ success: false, msg: "Vui lòng điền đầy đủ thông tin" });
    } else if (!(await validatePhone(req.body.phone))) {
      return res.status(200).json({ success: false, msg: "Số điện thoại không hợp lệ!" });
    } else if (await validatePhone(req.body.phone)) {
      if (req.body.password.length < 6) {
        return res.status(200).json({
          success: false,
          msg: "Mật khẩu phải trên 6 ký tự",
        });
      }
    } else if (!findUser) {
      return res
        .status(200)
        .json({ success: false, msg: "Sai số điện thoại hoặc mật khẩu" });
    }

    const bytes = CryptoJS.AES.decrypt(findUser.password, process.env.SECRET_KEY);
    const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
    if (findUser.isDeleted === true) {
      return res
        .status(200)
        .json({ success: false, msg: "Tài khoản của bạn đã bị vô hiệu hóa" });
    }
    if (originalPassword !== req.body.password) {
      return res
        .status(200)
        .json({ success: false, msg: "Sai số điện thoại hoặc mật khẩu" });
    }
    if (findUser.isAdmin !== true) {
      return res
        .status(200)
        .json({ success: false, msg: "Đây không phải tài khoản thư viện" });
    }
    const accessToken = jwt.sign(
      { id: findUser._id, isAdmin: findUser.isAdmin }, process.env.ACCESS_TOKEN,
      { expiresIn: "24h" }
    );
    const { password, ...info } = findUser._doc;

    return res.status(200).json({
      success: true,
      msg: "Đăng nhập thành công!",
      data: {
        user: {
          ...info,
          id: info._id,
        },
        accessToken,
        expire_in: 3600000,
      },
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

//LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    const findUser = await UserModel.findOne({ phone: req.body.phone });
    if (!req.body.phone || !req.body.password) {
      return res
        .status(200)
        .json({ success: false, msg: "Vui lòng điền đầy đủ thông tin" });
    } else if (!(await validatePhone(req.body.phone))) {
      return res.status(200).json({ success: false, msg: "Số điện thoại không hợp lệ!" });
    } else if (await validatePhone(req.body.phone)) {
      if (req.body.password.length < 6) {
        return res.status(200).json({
          success: false,
          msg: "Mật khẩu phải trên 6 ký tự",
        });
      }
    } else if (!findUser) {
      return res
        .status(200)
        .json({ success: false, msg: "Sai số điện thoại hoặc mật khẩu" });
    }
    const bytes = CryptoJS.AES.decrypt(findUser.password, process.env.SECRET_KEY);
    const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
    if (findUser.isDeleted === true) {
      return res
        .status(200)
        .json({ success: false, msg: "Tài khoản của bạn đã bị vô hiệu hóa" });
    }
    if (originalPassword !== req.body.password) {
      return res
        .status(200)
        .json({ success: false, msg: "Sai số điện thoại hoặc mật khẩu" });
    }
    const accessToken = jwt.sign(
      { id: findUser._id, isAdmin: findUser.isAdmin }, process.env.ACCESS_TOKEN,
      { expiresIn: "10h" }
    );
    const { password, ...info } = findUser._doc;

    return res.status(200).json({
      success: true,
      msg: "Đăng nhập thành công!",
      data: {
        user: {
          ...info,
          id: info._id,
        },
        accessToken,
        expire_in: 3600000,
      },
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

//LOG OUT
exports.logout = async (req, res) => {
  try {
    res.clearCookie('refreshtoken', { path: '/users' })
    return res.status(200).json({ msg: "Logged out." })
  } catch (err) {
    return res.status(500).json({ msg: err.message })
  }
}
const validatePhone = async (phone) => {
  const re = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;
  return re.test(phone);
};
// const validateEmail = async (email) => {
//   const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
//   return re.test(email);
// };

//GET USER BY ID
exports.getUser = async (req, res) => {
  if (req.userExists.id === req.params.id || req.userExists.isAdmin) {
    try {
      const findUser = await UserModel.findById(req.params.id);
      if (!findUser) {
        return res.status(200).json({ success: false, msg: "Không tìm thấy người dùng!" });
      } else if (findUser.isDeleted === true) {
        return res.status(200).json({ success: false, msg: "Không tìm thấy người dùng!" });
      } else {
        return res.status(200).json(findUser);
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res
      .status(403)
      .json({ success: false, msg: "Chỉ có giáo viên thư viện mới được xem tài khoản user" });
  }
};

//GET ALL USER
exports.getallUser = async (req, res) => {
  if (req.userExists.isAdmin) {
    try {
      const users = await UserModel.find({ isDeleted: false }).sort({
        updatedAt: -1,
      });
      if (!users) {
        return res.status(200).json({
          success: true,
          data: [],
          msg: "Không có bất kì dữ liệu người dùng nào",
        });
      }
      return res.status(200).json({
        success: true,
        data: users,
        msg: "Lấy danh sách thành công",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        data: null,
        msg: err,
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      data: null,
      msg: "Chỉ có giáo viên thư viện mới thấy danh sách người dùng!",
    });
  }
};

//UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      const userData = req.body;
      const user = new UserModel(userData);
      const findUser = await UserModel.findById(req.params.id);
      if (!userData.name || !userData.phone) {
        return res.status(200).json({
          success: false,
          msg: "Vui lòng điền đầy đủ thông tin",
          data: null,
        });
      } else if (!findUser) {
        return res
          .status(200)
          .json({ success: false, msg: "Không tìm thấy bất kì người dùng nào!", data: null });
      } else {

        const updateUser = await UserModel.findByIdAndUpdate(
          req.params.id,
          { $set: userData },
          { new: true }
        );
        return res.status(200).json({ success: true, msg: "Cập nhật thông tin thành công!", data: updateUser });
      }
    }
    return res.status(200).json({
      success: false,
      data: null,
      msg: "Chỉ có nhân viên thư viên mới cập nhật được thông tin người dùng",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ msg: err.message, success: false, data: null });
  }
};

//UPDATE PASSWORD USER
exports.updatePassword = async (req, res) => {
  try {
    const userData = req.body;
    const findUser = await UserModel.findById(req.userExists.id);
    const bytes = CryptoJS.AES.decrypt(findUser.password, process.env.SECRET_KEY);
    const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
    if (!userData.oldPassword || !userData.newPassword || !userData.repPassword) {
      return res.status(200).json({
        success: false,
        msg: "Vui lòng điền đầy đủ thông tin",
        data: null,
      });
    }
    else if (userData.repPassword !== userData.newPassword) {
      return res.status(200).json({
        success: false,
        msg: "Nhập lại không khớp",
        data: null,
      });
    } else if (!findUser) {
      return res
        .status(200)
        .json({ success: false, msg: "Không tìm thấy bất kì người dùng nào!", data: null });
    } else if (originalPassword !== userData.oldPassword) {
      return res
        .status(200)
        .json({ success: false, msg: "Mật khẩu không hợp lệ", data: null });
    } else {
      const pass = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(userData.newPassword), process.env.SECRET_KEY
      ).toString()
      const updateUser = await UserModel.findByIdAndUpdate(
        req.userExists.id,
        { $set: { password: pass } },
        { new: true }
      );
      return res.status(200).json({ success: true, msg: "Cập nhật mật khẩu thành công!", data: updateUser });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ msg: err.message, success: false, data: null });
  }
};

//UPDATE ROLE
exports.updateRoleUser = async (req, res) => {
  try {
    if (req.userExists.isAdmin) {
      let userData = req.body;

      const findUser = await UserModel.findById(req.params.id);
      userData = {
        ...findUser._doc,
        isAdmin: userData.isAdmin,
      };
      const updateUser = await UserModel.findByIdAndUpdate(req.params.id, {
        $set: userData
      }, { new: true }
      );
      return res.status(200).json({ success: true, msg: "Cập nhật chức vụ thành công!", data: updateUser });
    }

    return res.status(403).json({
      success: false,
      data: null,
      msg: "Chỉ có nhân viên thư viện mới cập nhật được!",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ msg: err.message, success: false, data: null });
  }
};

//DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    if (req.userExists.id != req.params.id && req.userExists.isAdmin) {
      const deleteUser = await UserModel.findByIdAndUpdate(
        req.params.id,
        { $set: { isDeleted: true } },
        { new: true }
      );
      if (!deleteUser) {
        return res.status(200).json({ success: false, msg: "Không tìm thấy người dùng" });
      } else {
        return res
          .status(200)
          .json({ success: true, data: deleteUser, msg: "Người dùng đã được xóa thành công" });
      }
    } else {
      return res.status(200).json({ success: false, msg: "Bạn không thể xóa tài khoản của chính mình" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};
