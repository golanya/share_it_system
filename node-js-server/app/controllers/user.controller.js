const db = require("../models");
const mongoose = require("mongoose");
const { deleteMany } = require("../models/user.model");
require("dotenv").config({ path: __dirname + "/.env" });
const OrganizationCode = db.organization_code;
const ToolRequest = db.tool_request;
const Notification = db.notification;
const Tool = db.tool;
const User = db.user;

/* This is a function that is exported to be used for public content. */
exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

/* This is a function that is exported to be used for users content. */
exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

/* This is a function that is exported to be admin for users content. */
exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

/* This is a function that is exported to be used to determine (set) the organization code. */
exports.setOrganizationCode = (req, res) => {
  const id = mongoose.Types.ObjectId("112211221122");
  const new_code = req.body.organization_code;

  OrganizationCode.findOneAndUpdate(
    { _id: id },
    { organization_code: new_code }
  )
    .then((results) => {
      res.status(200).send({ message: "Organization code updated successfully" });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* This is a function that is exported to be used for getting all the system's users. */
exports.users = (req, res) => {
  User.find({
    _id: {
      $ne: mongoose.Types.ObjectId(
        `${process.env.SHAREIT_SYSTEM_USER_ID || "112211221122"}`
      ),
    },
    is_deleted: false
  })
    .populate("roles", "name")
    .then((users) => {
      res.status(200).send({ users: users });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* This is a function that is exported to be used for getting count the system's users. */
exports.users_amount = (req, res) => {
  User.estimatedDocumentCount()
    .then((amount) => {
      res.status(200).send({ amount: amount });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* A function that is exported to be used for getting users by given filter the system's users. */
exports.users_by_filter = (req, res) => {
  let filter = req.body.filter;
  filter._id = {
    $ne: mongoose.Types.ObjectId(
      `${process.env.SHAREIT_SYSTEM_USER_ID || "112211221122"}`
    )
  }
  User.find(filter)
    .populate("roles", "name")
    .then((users) => {
      res.status(200).send({ users: users });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* This is a function that is exported to be used for getting a specific user. */
exports.user = (req, res) => {
  User.findOne({ _id: req.userId })
    .populate("roles", "name")
    .then((user) => {
      res.status(200).send({ user: user });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* This is a function that is exported to be used for updating a specific user. */
exports.update_user = (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password, 8);
  }

  User.findOneAndUpdate({ _id: req.userId }, req.body, { new: true })
    .populate("roles", "name")
    .then((user) => {
      res
        .status(200)
        .send({ message: "User have been updated successfully", user: user });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* This is a function that is exported to be used for restoring a specific user. */
exports.restore_user = (req, res) => {
  User.findOneAndUpdate({ _id: req.params.id }, {is_deleted: false}, { new: true })
    .populate("roles", "name")
    .then((user) => {
      res
        .status(200)
        .send({ message: "User have been restored successfully", user: user });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* This is a function that is exported to be used for suspending a specific user. */
exports.suspend_user = async (req, res) => {
  const now = Date();
  const user_id = req.params.id;

  try {
    // Suspend user
    await User.findOneAndUpdate({ _id: user_id }, { is_suspended: true });

    // Notify user regard his suspention
    await Notification({
      sender: mongoose.Types.ObjectId(process.env.SHAREIT_SYSTEM_USER_ID),
      recipient: user_id,
      content: "You have been Suspended by the system's admin.",
      date: now,
    }).save();

    // Depricates user's tools
    await Tool.bulkWrite([
      {
        updateMany: {
          filter: { owner: user_id, status: { $ne: "loaned" } },
          update: { status: "not available" },
        },
      },
    ]);

    // Reject user's requests
    await ToolRequest.bulkWrite([
      {
        updateMany: {
          filter: { requestor: user_id, status: "pending" },
          update: { status: "rejected by system" },
        },
      },
    ]);

    // Reject users requests for the current user's tools
    const user_tools = await Tool.find({ owner: user_id });
    const others_requests = await ToolRequest.find({
      status: "pending",
      tool: { $in: user_tools },
    })
      .populate("tool")
      .populate("requestor");

    await ToolRequest.bulkWrite(
      others_requests.map((request) => ({
        updateOne: {
          filter: request,
          update: { status: "rejected by system" },
        },
      }))
    );

    // Notify those users regarding the rejecting
    await Notification.bulkWrite(
      others_requests.map((request) => ({
        updateOne: {
          filter: {
            sender: mongoose.Types.ObjectId(process.env.SHAREIT_SYSTEM_USER_ID),
            recipient: request.requestor,
          },
          update: {
            content: `Your request for ${request.tool.name} was rejected by admin, the owner got suspended.`,
            date: now,
          },
          upsert: true,
          new: true,
        },
      }))
    );

    res.status(200).send({ message: "User have been suspended successfully" });
  } catch (err) {
    res.status(500).send(err);
  }
};

/* This is a function that is exported to be used for elevating a specific user. */
exports.elevated_user = async (req, res) => {
  const now = Date();
  const user_id = req.params.id;

  try {
    // Suspend user
    await User.findOneAndUpdate({ _id: user_id }, { is_suspended: false });

    // Notify user regard his suspention
    await Notification({
      sender: mongoose.Types.ObjectId(process.env.SHAREIT_SYSTEM_USER_ID),
      recipient: user_id,
      content: "You have been Elevated by the system's admin.",
      date: now,
    }).save();

    res.status(200).send({ message: "User have been elevated successfully" });
  } catch (err) {
    res.status(500).send(err);
  }
};


/* This is a function that is exported to be used for deleting a specific user. */
exports.delete_user = async (req, res) => {
  const now = Date();
  const user_id = req.params.id;

  try {
    // Check that user doesn't have loaned tools
    const loaned_tools = await Tool.find({ owner: user_id, status: "loaned" });
    if (loaned_tools.length > 0) {
      res.status(401).send({ message: "User have active loanes, suspend him to prevent more activities" });
      return;
    }

    // Check that user doesn't have borrowed tools
    const borrowed_tools = await ToolRequest.find({
      requestor: user_id,
      status: "approved",
    });
    if (borrowed_tools.length > 0) {
      res.status(401).send({ message: "User have active borrows, suspend him to prevent more activities" });
      return;
    }

    // Reject user's requests
    await ToolRequest.bulkWrite([
      {
        updateMany: {
          filter: { requestor: user_id, status: "pending" },
          update: { status: "rejected by system" },
        },
      },
    ]);

    // Reject others' requests for its tools
    const user_tools = await Tool.find({ owner: user_id });
    const others_requests = await ToolRequest.find({
      status: "pending",
      tool: { $in: user_tools },
    })
      .populate("tool")
      .populate("requestor");

    await ToolRequest.bulkWrite(
      others_requests.map((request) => ({
        updateOne: {
          filter: request,
          update: { status: "rejected by system" },
        },
      }))
    );

    // Notify requestors
    await Notification.bulkWrite(
      others_requests.map((request) => ({
        updateOne: {
          filter: {
            sender: mongoose.Types.ObjectId(process.env.SHAREIT_SYSTEM_USER_ID),
            recipient: request.requestor,
          },
          update: {
            content: `Your request for ${request.tool.name} was rejected by admin, the owner got removed.`,
            date: now,
          },
          upsert: true,
          new: true,
        },
      }))
    );

    // Delete user's notifications
    await Notification.deleteMany({recipient: user_id});

    // Delete all its tools
    await Tool.deleteMany({owner: user_id});

    // Delete user
    await User.findOneAndUpdate({_id: user_id}, {is_deleted: true, is_suspended: true});
    
    res.status(200).send({ message: "User have been deleted successfully" });
  } 
  catch (err) {
    res.status(500).send(err);
  }
};
