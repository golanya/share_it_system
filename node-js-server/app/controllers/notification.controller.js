const db = require("../models");
const Notification = db.notification;

/* A function that is being exported. It is a function that is being called when the user goes
to the route /notifications. It is a function that is being called when the user goes to the route
/notifications. It is a function that is being called when the user goes to the route. */
exports.notifications = (req, res) => {
  Notification.find()
    .populate("sender")
    .populate("recipient")
    .then((notifications) => {
      res.status(200).send({ notifications: notifications });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};


/* Gets the amount of all the documents in Notification collection */
exports.notifications_amount = (req, res) => {
  Notification.estimatedDocumentCount()
    .then((amount) => {
      res.status(200).send({ amount: amount });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* A function that is being called when the user goes to the route
/notifications/user_unseen_notifications. Its purpose is to retreive all the notifification
addressed to the current user which he did not read. */
exports.user_unseen_notifications = (req, res) => {
  Notification.find({recipient: req.userId, seen: {$ne: true}})
    .populate("sender")
    .populate("recipient")
    .then((notifications) => {
      res.status(200).send({ notifications: notifications });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* A function that is being called when the user goes to the route /notifications/mark_as_seen/:id. It
is a function that is being called when the user goes to the route /notifications/mark_as_seen/:id.
It is a function that is being called when the user goes to the route. */
exports.mark_as_seen = (req, res) => {
  Notification.findOneAndUpdate({_id: req.params.id}, {seen: true}, {new: true})
    .then((notification) => {
      res.status(200).send({ message: "Notification have been updated successfully", notification: notification });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* This is a function that is being exported. It is a function that is being called when the user goes
to the route /notifications/user. It is a function that is being called when the user goes to the
route /notifications/user. It is a function that is being called when the user goes to the route. */
exports.user_notifications = (req, res) => {
  Notification.find({$or: [{ recipient: req.userId }, { sender: req.userId }]})
    .populate("sender")
    .populate("recipient")
    .sort({date: -1})
    .then((notifications) => {
      res.status(200).send({ notifications: notifications });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* Creating a new notification. */
exports.create_notification = (req, res) => {
  const notification = Notification({
    content: req.body.content,
    date: req.body.date,
    sender: req.userId,
    recipient: req.body.recipient,
    request: req.body.request,
    link: req.body.link
  });

  notification
    .save()
    .then( notification => {
      res.status(200).send({ message: "Notification was added successfully!", notification: notification });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* Deleting a notification by id. */
exports.delete_by_id = (req, res) => {
  Notification.findOneAndRemove({_id: req.params.id, $or: [{ recipient: req.userId }, { sender: req.userId }]})
    .then((results) => {
      if (results) {
        res.status(200).send({ message: 'Notification has been deleted sucessfully!' });
      } 
      else {
        res.status(401).send({ message: "Notification was not found" });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};
