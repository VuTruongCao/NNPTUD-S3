var express = require("express");
var router = express.Router();
let messageModel = require("../schemas/message");
let { CheckLogin } = require("../utils/authHandler");

// GET /:userID - Lấy lịch sử chat giữa user hiện tại và userID
router.get("/:userID", CheckLogin, async function (req, res, next) {
  try {
    const currentUserID = req.user._id; // Giả sử req.user được set bởi CheckLogin
    const { userID } = req.params;

    const messages = await messageModel.find({
      $or: [
        { from: currentUserID, to: userID },
        { from: userID, to: currentUserID }
      ]
    }).sort({ createdAt: 1 }); // Sắp xếp theo thời gian tăng dần (cũ đến mới)

    res.send({ success: true, data: messages });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

// POST / - Gửi tin nhắn mới
router.post("/", CheckLogin, async function (req, res, next) {
  try {
    const currentUserID = req.user._id;
    const { to, content } = req.body;

    // Giả sử req.body.content có object chứa type và text
    let type = 'text'; // mặc định là text
    let text = content; 
    
    // Xử lý type nếu được gửi theo format mới 
    if(req.body.type && req.body.text) {
        type = req.body.type;
        text = req.body.text;
    }

    if (!to || !text) {
      return res.status(400).send({ success: false, message: "Thiếu thông tin người nhận 'to' hoặc nội dung 'text'." });
    }

    const newMessage = new messageModel({
      from: currentUserID,
      to: to,
      messageContent: {
        type: type, // 'text' hoặc 'file'
        text: text  // nội dung text hoặc đường dẫn file
      }
    });

    const savedMessage = await newMessage.save();
    res.status(201).send({ success: true, data: savedMessage });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

// GET / - Lấy tin nhắn cuối cùng với mỗi user đã từng nhắn tin
router.get("/", CheckLogin, async function (req, res, next) {
  try {
    const currentUserID = req.user._id;

    const lastMessages = await messageModel.aggregate([
      {
        $match: {
          $or: [{ from: currentUserID }, { to: currentUserID }]
        }
      },
      {
        $sort: { createdAt: -1 } // Sắp xếp giảm dần theo thời gian (mới nhất đầu tiên)
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$from", currentUserID] }, 
              "$to",   // Nếu mình là người gửi, nhóm theo người nhận
              "$from"  // Nếu mình là người nhận, nhóm theo người gửi
            ]
          },
          lastMessage: { $first: "$$ROOT" } // Lấy document đầu tiên (mới nhất do đã sort)
        }
      },
      {
        // Tuỳ chọn: Join (Lookup) sang collection users để lấy thông tin của user kia nếu cần
        $lookup: {
            from: "users", // tên collection
            localField: "_id",
            foreignField: "_id",
            as: "userInfo"
        }
      },
      {
         $unwind: "$userInfo"
      },
      {
         $project: {
            "userInfo.password": 0, // Ẩn password
            "userInfo.loginCount": 0
         }
      }
    ]);

    res.send({ success: true, data: lastMessages });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
