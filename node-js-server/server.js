const cors = require("cors");
const db = require("./app/models");
const express = require("express");
const mongoose = require("mongoose");
var CronJob = require("cron").CronJob;
const cookieSession = require("cookie-session");
const dbConfig = require("./app/config/db.config");
require("dotenv").config({ path: __dirname + "/.env" });
const notifyConfig = require("./app/config/notifying.config");
const controller = require("./app/controllers/server.controller");

const User = db.user;
const Role = db.role;
const OrganizationCode = db.organization_code;
const remote_username = encodeURIComponent(process.env.SHAREIT_REMOTE_USERNAME);
const remote_password = encodeURIComponent(process.env.SHAREIT_REMOTE_PASSWORD);

const app = express();

var corsOptions = {
  origin: ["http://localhost:4200"],
  credentials: true,
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "shareit-session",
    secret: "COOKIE_SECRET", // should use as secret environment variable
    httpOnly: true,
  })
);

let db_url = `mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`;

// In case we want connecting to remote DB
if (process.argv.slice(2).includes("--remote")) {
  db_url = `mongodb+srv://${remote_username}:${remote_password}@cluster0.ak13rx0.mongodb.net/${dbConfig.DB}`;
}

/* Connecting to the database. */
db.mongoose
  .connect(db_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

// simple route
app.get("/", (_req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

// Add routes to server api
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/tool.routes")(app);
require("./app/routes/notification.routes")(app);

// set port, listen for requests
const PORT = process.env.SHAREIT_PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

/**
 * Checks if the database is empty, if it is, it adds some data to it.
 */
function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "admin",
      })
        .save()
        .then((role) => {
          console.log("added 'admin' to roles collection");

          const u = new User({
            _id: mongoose.Types.ObjectId(process.env.SHAREIT_SYSTEM_USER_ID),
            username: process.env.SHAREIT_USERNAME,
            email: process.env.SHAREIT_EMAIL,
            password: process.env.SHAREIT_PASSWORD,
            fname: process.env.SHAREIT_FNAME,
            lname: process.env.SHAREIT_LNAME,
            phone: process.env.SHAREIT_PHONE,
            allow_emails: true,
            roles: role,
          });
          u.save((err) => {
            if (err) {
              console.log("error", err);
            }

            console.log(
              `added admin user ${process.env.SHAREIT_USERNAME} to users collection`
            );
          });
        })
        .catch((err) => {
          console.log("error", err);
        });
    }
  });

  OrganizationCode.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      const org_code = process.env.SHAREIT_ORG_CODE || "111111";
      new OrganizationCode({
        organization_code: org_code,
        _id: mongoose.Types.ObjectId(
          "112211221122"
        ),
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log(
          `added organization code ${org_code} to organization_code collection`
        );
      });
    }
  });

  new CronJob( // Will run every hour
    "0 0 * * * *",
    function () {
      /*
       * For it to runs every midnight: '0 0 * * *'
       * For it to runs every minute: '0 * * * * *'
       * * For it to runs every hour: '0 0 * * * *'
       */
      controller.closeExpiredApprovedRequests();
      controller.closeExpiredPendingRequests();
    },
    function () {
      /* This function is executed when the job stops */
    },
    true /* Start the job right now */
  );

  new CronJob( // Will run every midnight
    "0 0 0 * * *",
    function () {
      controller.dbAutoBackUp();
    },
    function () {
      /* This function is executed when the job stops */
    },
    true /* Start the job right now */
  );

  new CronJob( // Will run every "HOUR_OF_SENDING_NOTIFY" Oclock
    `0 0 ${notifyConfig.HOUR_OF_SENDING_NOTIFY} * * *`,
    function () {
      controller.notifyDayBeforeBorrowEnds();
    },
    function () {
      /* This function is executed when the job stops */
    },
    true /* Start the job right now */
  );

  // var users = require('../../generated_users.json');
  // var User = require('./app/models/user.model');
  // User.insertMany(users).then( u => {
  //   let ids = [];
  //   for (let i = 0 ; i < u.length; i++){
  //     ids.push(u[i].id);
  //   }
  //   console.log(ids);
  // }).catch(err => {
  //   console.log(err);
  // })

  // var tools = require('../../generated_tools.json');
  // var User = require('./app/models/tool.model');
  // User.insertMany(tools).then( tools => {
  //   console.log(tools);
  // }).catch(err => {
  //   console.log(err);
  // })
}
