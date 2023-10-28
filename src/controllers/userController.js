const { UserModel } = require("../models/UserModel")
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const XLSX = require('xlsx')
const { Workbook } = require('exceljs')
const fs = require('fs');


//ADD FILE USER
exports.addFileUser = async (req, res) => {
  try {
    const password = process.env.NEWPASSWORD;
    const count = await UserModel.count();
    const workbook = XLSX.readFile(req.file.path);
    const sheet_namelist = workbook.SheetNames;
    const userData = [];

    for (const sheetName of sheet_namelist) {
      const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      for (let i = 0; i < xlData.length; i++) {
        const encryptedPassword = CryptoJS.AES.encrypt(
          CryptoJS.enc.Utf8.parse(password),
          process.env.SECRET_KEY
        ).toString();

        userData.push({
          name: xlData[i].HovaTen,
          phone: xlData[i].SDT,
          idcard: xlData[i].CCCD,
          password: encryptedPassword,
          userId: "USER-" + (count+ (i+1))
        });
      }
    }

    await UserModel.insertMany(userData);

    fs.unlink(req.file.path, (err) => {
      if (err) {
        res.status(200).json({ success: false, data: [], msg: "Lỗi hệ thống" })
      }
      else {
      }
    })
    res.status(200).json({ success: true, msg: "Thêm người dùng thành công" })
  } catch (error) {
    res.status(200).json({ success: false, data: [], msg: "Lỗi hệ thống" })
  }
}

//EXPORT FILE
exports.exportFileUser = async (req, res) => {
  try {
    const wb = new Workbook();
    const ws = wb.addWorksheet("Người dùng")

    ws.columns = [
      { header: "STT", key: "stt" },
      { header: "ID", key: "userId" },
      { header: "Họ và Tên", key: "name" },
      { header: "CCCD/ Mã định danh", key: "idcard" },
      { header: "SDT", key: "phone" },
    ]

    const data = await UserModel.find({ isDeleted: false })

    const add = []
    for (let i = 0; i < data.length; i++) {
      add.push({
        stt: i + 1,
        userId: data[i].userId,
        name: data[i].name,
        idcard: data[i].idcard,
        phone: data[i].phone
      })
    }

    add.forEach((user) => {
      ws.addRow(user)
    })


    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true }
    })
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=users-${Date()}.xlsx`);

    return wb.xlsx.write(res).then(() => {
      res.status(200);
    })
  } catch (error) {
    res.status(200).json({ success: false, data: [], msg: "Lỗi hệ thống" })
  }
}

//ADD USER
exports.createUser = async (req, res) => {
  const password = process.env.NEWPASSWORD
  const count = await UserModel.count()
  const newUser = {
    name: req.body.name,
    phone: req.body.phone,
    idcard: req.body.idcard,
    image: req.body.image,
    userId: "USER-" + (count + 1),
    password: CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(password), process.env.SECRET_KEY
    ).toString(),
    isAdmin: req.body.isAdmin
  };
  try {
    if (req.userExists.isAdmin) {
      if (!newUser.name || !newUser.phone || !newUser.idcard) {
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
        console.log(newUser)
        const addUser = await UserModel(newUser).save();
        return res.status(200).json({ success: true, data: addUser, msg: "Thêm người dùng thành công" });
      }
    } else {
      return res
        .status(200)
        .json({ success: false, msg: "Chỉ admin mới có thể thêm người dùng mới" });
    }

  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: err.message });
  }
};

//LOGIN ADMIN
exports.login = async (req, res) => {
  try {
    const findUser = await UserModel.findOne({ idcard: req.body.idcard });
    if (!req.body.idcard || !req.body.password) {
      return res
        .status(200)
        .json({ success: false, msg: "Vui lòng điền đầy đủ thông tin" });
    } else if (!(await validateIdCard(req.body.idcard))) {
      return res.status(200).json({ success: false, msg: "CCCD/ Mã định danh không hợp lệ!" });
    } else if (await validateIdCard(req.body.idcard)) {
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
      { expiresIn: "4h" }
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
        expire_in: 14400000,
      },
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

//LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    const findUser = await UserModel.findOne({ idcard: req.body.idcard });
    if (!req.body.idcard || !req.body.password) {
      return res
        .status(400)
        .json({ success: false, msg: "Vui lòng điền đầy đủ thông tin" });
    } else if (!(await validateIdCard(req.body.idcard))) {
      return res.status(400).json({ success: false, msg: "CCCD/ Mã định danh không hợp lệ!" });
    } else if (await validatePhone(req.body.phone)) {
      if (req.body.password.length < 6) {
        return res.status(200).json({
          success: false,
          msg: "Mật khẩu phải trên 6 ký tự",
        });
      }
    } else if (!findUser) {
      return res
        .status(400)
        .json({ success: false, msg: "Sai số điện thoại hoặc mật khẩu" });
    }
    const bytes = CryptoJS.AES.decrypt(findUser.password, process.env.SECRET_KEY);
    const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
    if (findUser.isDeleted === true) {
      return res
        .status(403)
        .json({ success: false, msg: "Tài khoản của bạn đã bị vô hiệu hóa" });
    }
    if (originalPassword !== req.body.password) {
      return res
        .status(400)
        .json({ success: false, msg: "Sai số điện thoại hoặc mật khẩu" });
    }
    const accessToken = jwt.sign(
      { id: findUser._id, isAdmin: findUser.isAdmin }, process.env.ACCESS_TOKEN,
      { expiresIn: "4h" }
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
        expire_in: 14400000,
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

const validateIdCard = async (idcard) => {
  const re = /^\d+$/;
  return re.test(idcard);
};

// const validateEmail = async (email) => {
//   const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
//   return re.test(email);
// };

//GET USER BY ID
exports.getUser = async (req, res) => {
  if (req.userExists.id) {
    try {
      const findUser = await UserModel.findById(req.userExists.id);
      if (!findUser) {
        return res.status(200).json({ success: false, msg: "Không tìm thấy người dùng!" });
      } else if (findUser.isDeleted === true) {
        return res.status(200).json({ success: false, msg: "Không tìm thấy người dùng!" });
      } else {
        return res.status(200).json({ data: findUser });
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
        createdAt: -1,
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

//RESET PASSWORD USER
exports.resetPassword = async (req, res) => {
  try {
    const userData = req.body;
    const findUser = await UserModel.findById(req.userExists.id);
    const bytes = CryptoJS.AES.decrypt(findUser.password, process.env.SECRET_KEY);
    const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
    if (!userData.password) {
      return res.status(400).json({
        success: false,
        msg: "Vui lòng điền đầy đủ thông tin",
        data: null,
      });
    } else if (!findUser) {
      return res
        .status(404)
        .json({ success: false, msg: "Không tìm thấy bất kì người dùng nào!", data: null });
    } else if (originalPassword !== userData.password) {
      return res
        .status(400)
        .json({ success: false, msg: "Mật khẩu không hợp lệ", data: null });
    } else {
      const pass = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(process.env.NEWPASSWORD), process.env.SECRET_KEY
      ).toString();
      const updateUser = await UserModel.findByIdAndUpdate(
        userData.iduser,
        { $set: { password: pass } },
        { new: true }
      );
      return res.status(200).json({ success: true, msg: "Thiết lập lại mật khẩu thành công!", data: updateUser });
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
