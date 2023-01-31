const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const db = require("../models");
const mongoose = require("mongoose");
const exec = require("child_process").exec;
const dbConfig = require("../config/db.config");
const notifyConfig = require("../config/notifying.config");

/* Used to encode the username and password. */
const remote_username = encodeURIComponent(dbConfig.REMOTE_USERNAME);
const remote_password = encodeURIComponent(dbConfig.REMOTE_PASSWORD);

const User = db.user;
const Tool = db.tool;
const Notification = db.notification;
const ToolRequest = db.tool_request;

// Concatenate root directory path with our backup folder.
const backupDirPath = path.join(process.cwd(), "database-backup/");
const local_db = process.argv.slice(2).includes("--remote");

/* A configuration object for the database. */
const dbOptions = {
  user: local_db ? remote_username : dbConfig.USER_ID || "",
  pass: local_db ? remote_password : dbConfig.USER_PASSWORD || "",
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  database: dbConfig.DB,
  autoBackup: true,
  removeOldBackup: true,
  keepLastDaysBackup: 3,
  autoBackupPath: backupDirPath,
};

/* A function that converts a string to a date object. */
exports.stringToDate = (dateString) => {
  return new Date(dateString);
};

/* Checking if the variable is empty or not. */
exports.empty = (mixedVar) => {
  let undef, key, i, len;
  const emptyValues = [undef, null, false, 0, "", "0"];
  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixedVar === emptyValues[i]) {
      return true;
    }
  }
  if (typeof mixedVar === "object") {
    for (key in mixedVar) {
      return false;
    }
    return true;
  }
  return false;
};

/* Creating a backup of the database. */
exports.dbAutoBackUp = () => {
  // check for auto backup is enabled or disabled
  if (dbOptions.autoBackup == true) {
    let date = new Date();
    let beforeDate, oldBackupDir, oldBackupPath;

    // Current date
    currentDate = this.stringToDate(date);
    let newBackupDir =
      currentDate.getFullYear() +
      "-" +
      (currentDate.getMonth() + 1) +
      "-" +
      currentDate.getDate();

    // New backup path for current backup process
    let newBackupPath = dbOptions.autoBackupPath + "mongodump-" + newBackupDir;
    // check for remove old backup after keeping # of days given in configuration
    if (dbOptions.removeOldBackup == true) {
      beforeDate = _.clone(currentDate);
      // Substract number of days to keep backup and remove old backup
      beforeDate.setDate(beforeDate.getDate() - dbOptions.keepLastDaysBackup);
      oldBackupDir =
        beforeDate.getFullYear() +
        "-" +
        (beforeDate.getMonth() + 1) +
        "-" +
        beforeDate.getDate();
      // old backup(after keeping # of days)
      oldBackupPath = dbOptions.autoBackupPath + "mongodump-" + oldBackupDir;
    }

    // Command for mongodb dump process
    let cmd = `mongodump /h ${dbOptions.host} /port ${dbOptions.port} /d ${
      dbOptions.database
    } ${dbOptions.user ? `/u ${dbOptions.user}` : ""} ${
      dbOptions.user ? `/p ${dbOptions.pass}` : ""
    } /o "${newBackupPath}"`;

    exec(cmd, (error, stdout, stderr) => {
      if (this.empty(error)) {
        console.log("Created system backup successfully");
        // check for remove old backup after keeping # of days given in configuration.
        if (dbOptions.removeOldBackup == true) {
          if (fs.existsSync(oldBackupPath)) {
            exec("rm -rf " + oldBackupPath, (err) => {});
          }
        }
      } else {
        console.log("Failed to create system backup with the error: " + stderr);
      }
    });
  }
};

/* Closing expired pending requests and sending a notification to the requestor. */
exports.closeExpiredPendingRequests = async function run() {
  const now = new Date();
  try {
    const res = await ToolRequest.find({
      status: "pending",
      expiration_date: { $lte: now },
    }).populate("tool"); // , {$set: {status: 'closed'}}
    if (res.length > 0) {
      const note_res = await Notification.bulkWrite(
        res.map((request) => ({
          deleteOne: {
            filter: { request: request, sender: request.requestor },
          },
        }))
      );

      const tool_res = await ToolRequest.bulkWrite(
        res.map((request) => ({
          updateOne: {
            filter: { _id: request },
            update: { $set: { status: "closed" } },
          },
        }))
      );

      console.log(
        `Closed ${tool_res.modifiedCount} requests and removed ${note_res.nRemoved} notification successfully at ~${now}`
      );

      const ack_users = await Notification.bulkWrite(
        res.map((request) => ({
          updateOne: {
            filter: {
              sender: mongoose.Types.ObjectId(
                process.env.SHAREIT_SYSTEM_USER_ID
              ),
              recipient: request.requestor,
              request: request,
            },
            update: {
              content: `Your request for ${request.tool.name} expired and closed by SYSTEM`,
              date: now,
              link: "tools/board-tool/" + request.tool._id,
            },
            upsert: true,
            new: true,
          },
        }))
      );

      if (ack_users.modifiedCount === res.length) {
        console.log(`Successfully ack ${res.length} users`);
      }
    }
  } catch (err) {
    console.error(`Something went wrong: ${err}`);
  }
};

/* A cron job that runs every day at midnight. It checks for all the approved requests that have
expired and closes them. */
exports.closeExpiredApprovedRequests = async function run() {
  const now = new Date();

  try {
    const res = await ToolRequest.find({
      status: "approved",
      expiration_date: { $lte: now },
    })
      .populate("requestor")
      .populate({
        path: "tool",
        populate: {
          path: "owner",
          model: "User",
        },
      });

    if (res.length > 0) {
      const tool_res = await ToolRequest.bulkWrite(
        res.map((request) => ({
          updateOne: {
            filter: { _id: request },
            update: { $set: { status: "closed" } },
          },
        }))
      );

      console.log(`Closed ${tool_res.modifiedCount}/${res.length} reuests`);

      let acks_list = [];
      const acks_pairs = res.map((request) =>
        [request.requestor, request.tool.owner].map((recipient) => ({
          updateOne: {
            filter: {
              sender: mongoose.Types.ObjectId(
                process.env.SHAREIT_SYSTEM_USER_ID
              ),
              recipient: recipient,
              request: request,
              date: now,
              content: `${request.tool.name} loan expired and closed by SYSTEM`,
              link: "tools/board-tool/" + request.tool._id,
            },
            update: {
            },
            upsert: true,
            new: true,
          },
        }))
      );

      for (let i = 0; i < acks_pairs.length; i++) {
        acks_list.push(acks_pairs[i][0]);
        acks_list.push(acks_pairs[i][1]);
      }

      const ack_users = await Notification.bulkWrite(acks_list);

      console.log(
        `Ack ${ack_users.modifiedCount || ack_users.nUpserted}/${2*(res.length)} users about the tools closing`
      );

      const decrease_rank = await User.bulkWrite(
        res.map((request) => ({
          updateOne: {
            filter: { _id: request.requestor },
            update: { $inc: { rank: -1 } },
          },
        }))
      );

      console.log(
        `Decreased rank for ${decrease_rank.modifiedCount}/${res.length} users`
      );

      let suspended_users_tools = [];
      for (let i = 0; i < res.length; i++) {
        if (res[i].tool.owner.is_suspended === true) {
          suspended_users_tools.push(res[i]);
        }
      }

      for (let i = 0; i < suspended_users_tools.length; i++) {
        let index = res.indexOf(suspended_users_tools[i]);
        if (index > -1) {
          res.splice(index, 1);
        }
      }

      const tools_1 = await Tool.bulkWrite(
        res.map((request) => ({
          updateOne: {
            filter: { _id: request.tool },
            update: { status: "available" },
            new: true,
          },
        }))
      );

      console.log(
        `Updated ${tools_1.modifiedCount}/${res.length} tools' status to 'available'`
      );

      const tools_2 = await Tool.bulkWrite(
        suspended_users_tools.map((request) => ({
          updateOne: {
            filter: { _id: request.tool },
            update: { status: "not available" },
            new: true,
          },
        }))
      );

      console.log(
        `Updated ${tools_2.modifiedCount}/${res.length} tools' status to 'not available'`
      );
    }
  } catch (err) {
    console.error(`Something went wrong: ${err}`);
  }
};

/* This function is used to notify users about the end of their borrow. */
exports.notifyDayBeforeBorrowEnds = async function run() {
  const now = new Date();
  const threshold_time = new Date(
    now.getTime() + 1000 * 60 * 60 * notifyConfig.NUM_OF_HOURS_BEFORE_EXP
  );

  try {
    const res = await ToolRequest.find({
      status: "approved",
      expiration_date: { $lte: threshold_time },
    })
      .populate("requestor")
      .populate("tool");

    if (res.length > 0) {
      const ack_users = await Notification.bulkWrite(
        res.map((request) => ({
          updateOne: {
            filter: {
              sender: mongoose.Types.ObjectId(
                process.env.SHAREIT_SYSTEM_USER_ID
              ),
              recipient: request.requestor,
              request: request,
            },
            update: {
              content: `Your borrow for ${request.tool.name} is about to be expired, please return the tool in time.`,
              date: now,
              link: "tools/board-tool/" + request.tool._id,
            },
            upsert: true,
            new: true,
          },
        }))
      );

      console.log(
        `Ack ${ack_users.modifiedCount}/${res.length} users about borrow's end of time`
      );
    }
  } catch (err) {
    console.error(`Something went wrong: ${err}`);
  }
};
