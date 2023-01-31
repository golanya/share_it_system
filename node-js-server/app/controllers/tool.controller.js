const { mongoose } = require("../models");
const db = require("../models");
const Tool = db.tool;
const User = db.user;
const Notification = db.notification;
const ToolRequest = db.tool_request;

/* The above code is a function that is being exported to the router.js file. The function is called
tools and it is using the Tool model to find all the tools in the database. It is then populating
the owner field with the username of the owner. It is then sorting the tools by status. If there are
no tools found, it will send a message to the user. If there are tools found, it will send the tools
to the user. If there is an error, it will send the error to the user. */
exports.tools = (req, res) => {
  Tool.find()
    .populate("owner", "username")
    .sort({ status: 1 })
    .then((tools) => {
      if (!tools) {
        res.status(401).send({ message: "Tools was not found" });
        return;
      } else {
        res.status(200).send({ tools: tools });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* Counting the number of pending requests. */
exports.pending_requests_amount = (req, res) => {
  ToolRequest.find({status: 'pending'}).estimatedDocumentCount()
    .then((amount) => {
      res.status(200).send({ amount: amount });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* A function that respond requests list with given filter. */
exports.requests_by_filter = (req, res) => {
  ToolRequest.find(req.body.filter)
  .populate("requestor")
  .populate({
    path: "tool",
    populate: {
      path: "owner",
      model: "User",
    },
  })
  .sort({date: -1})
    .then( requests => {
      res.status(200).send({ requests: requests });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* The above code is a function that is used to find all the tools that belong to the user. */
exports.my_tools = (req, res) => {
  Tool.find({ owner: req.userId })
    .populate("owner")
    .then((tools) => {
      if (!tools) {
        res.status(401).send({ message: "Tools was not found" });
        return;
      } else {
        res.status(200).send({ tools: tools });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* The above code is a function that is called when a user wants to see all the tools that they have
borrowed. */
exports.my_borrows = (req, res) => {
  ToolRequest.find({ requestor: req.userId, status: "approved" })
    .populate("tool")
    .then((requests) => {
      if (!requests) {
        res.status(401).send({ message: "Borrows tools were not found" });
        return;
      } else {
        res.status(200).send({ requests: requests });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* The above code is a function that is used to get all the notifications of a user. */
exports.my_notifications = (req, res) => {
  Notification.find({ recipient: req.userId })
    .sort({ date: -1 })
    .populate("sender")
    .then((notifications) => {
      if (!notifications) {
        res.status(401).send({ message: "Borrows tools were not found" });
        return;
      } else {
        res.status(200).send({ notifications: notifications });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* The above code is a function that is exported to the router. It is a function that finds a tool by
its id. */
exports.tool_by_id = (req, res) => {
  Tool.findOne({ _id: req.params.id })
    .populate("owner", { username: 1, fname: 1, lname: 1, phone: 1, rank: 1 })
    .then((tool) => {
      if (!tool) {
        res.status(401).send({ message: "Tool was not found" });
        return;
      } else {
        res.status(200).send({ tool: tool });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* The above code is deleting a tool by id. */
exports.delete_by_id = (req, res) => {
  Tool.findOneAndRemove({
    _id: req.params.id,
    status: { $ne: "loaned" },
    owner: { _id: req.userId },
  })
    .then((results) => {
      if (results) {
        ToolRequest.deleteMany({ tool: results.id }).then((_) => {
          res
            .status(200)
            .send({ message: `${results.name} has been deleted sucessfully!` });
        });
      } else {
        res.status(401).send({ message: "Tool was not found" });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* The above code is updating the tool. */
exports.update_tool = (req, res) => {
  Tool.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, req.body, {
    new: true,
  })
    .populate("owner")
    .then((tool) => {
      res
        .status(200)
        .send({ message: "Tool have been updated successfully", tool: tool });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* Creating a new tool and saving it to the database. */
exports.add = (req, res) => {
  const tool = new Tool({
    name: req.body.name,
    manufacturing_date: req.body.manufacturing_date,
    status: req.body.status,
    max_time_borrow: req.body.max_time_borrow,
    categories: req.body.categories,
    producer: req.body.producer,
    owner: req.body.owner,
    description: req.body.description || "",
  });

  tool
    .save()
    .then((new_tool) => {
      res.status(200).send({ message: "Tool was added successfully!" });
      return;
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};

/* The above code is creating a new request for a tool. */
exports.request = (req, res) => {
  const now = new Date();

  const tool_request = new ToolRequest({
    content: req.body.content,
    borrow_duration: req.body.borrow_duration,
    expiration_date: new Date(req.body.expiration_date),
    date: now,
    tool: req.params.id,
    requestor: req.userId,
  });

  tool_request
    .save()
    .then((request) => {
      request
        .populate("tool")
        .populate("requestor")
        .execPopulate()
        .then((request) => {
          new Notification({
            content: `${request.requestor.username} would like to borrow a tool`,
            date: now,
            sender: req.userId,
            recipient: request.tool.owner,
            request: request,
            link: "tools/board-tool/" + req.params.id,
          })
            .save()
            .then((_) => {
              res.status(200).send({
                message: "Request has been created successfully",
                request: request,
              });
            });
        });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};

/* The above code is a function that is used to get all the requests that have been made by the users. */
exports.requests = (req, res) => {
  ToolRequest.find()
    .populate("tool")
    .populate("requestor")
    .then((requests) => {
      if (!requests) {
        res.status(401).send({ message: "Tools requests was not found" });
        return;
      } else {
        res.status(200).send({ requests: requests });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* Finding all the tool requests that have the same tool id as the tool id in the url. */
exports.tool_requests = (req, res) => {
  ToolRequest.find({ tool: req.params.id })
    .populate("tool")
    .populate("requestor")
    .then((requests) => {
      if (!requests) {
        res.status(401).send({ message: "Tools requests was not found" });
        return;
      } else {
        res.status(200).send({ requests: requests });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* The above code is deleting a request from the database. */
exports.delete_request = (req, res) => {
  ToolRequest.findOneAndRemove({
    _id: req.params.id,
    status: "pending",
    requestor: req.userId,
  })
    .then((request) => {
      if (request) {
        Notification.findOneAndRemove({
          request: request,
          sender: req.userId,
        }).then((_) => {
          res
            .status(200)
            .send({ message: "Request has been deleted sucessfully!" });
        });
      } else {
        res.status(401).send({ message: "Request was not found" });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* The above code is updating a request. */
exports.update_request = (req, res) => {
  update = {};
  filter = { _id: req.params.id, status: "pending" };
  changable_properties = ["content", "borrow_duration", "expiration_date"];

  for (elem in changable_properties) {
    if (req.body[elem] !== undefined) {
      update[elem] = req.body[elem];
    }
  }

  ToolRequest.findOneAndUpdate(filter, update, { new: true })
    .then((request) => {
      if (request) {
        res.status(200).send({
          message: "Request has been updated sucessfully!",
          request: request,
        });
      } else {
        res
          .status(401)
          .send({ message: "Request was not found", request: request });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* The above code is updating the status of a tool request. */
exports.update_request_status = (req, res) => {
  const now = new Date();
  const status = req.body.status;

  filter = { _id: req.params.id, status: { $in: ["approved", "pending"] } };
  update_tool = {
    status: status === "approved" ? "loaned" : "available",
  };
  tool_filter = {
    owner: req.userId,
    status: status === "approved" ? "available" : "loaned",
  };
  update_request = {
    status: status,
    expiration_date: req.body.expiration_date,
  };
  if (status === "approved") {
    update_request.approval_date = now;
  }

  User.findOne({ _id: req.userId })
    .then((tool_owner) => {
      ToolRequest.findOneAndUpdate(filter, update_request, {
        new: true,
      })
        .populate("requestor")
        .then((request) => {
          if (!request) {
            res
              .status(401)
              .send({ message: "Request was not found", request: request });
          } else if (status === "approved") {
            Tool.findOneAndUpdate(tool_filter, update_tool, { new: true })
              .populate("owner")
              .then((tool) => {
                if (!tool) {
                  res
                    .status(401)
                    .send({ message: "Tool was not found", request: request });
                } else {
                  new Notification({
                    date: now,
                    sender: tool.owner,
                    recipient: request.requestor,
                    link: "tools/board-tool/" + request.tool._id,
                    content: `Your request have been approved, please contact me. \nPhone: ${tool.owner.phone}\nEmail: ${tool.owner.email}`,
                  })
                    .save()
                    .then((_) => {
                      res.status(200).send({
                        message: "Request has been updated sucessfully!",
                        request: request,
                      });
                    });
                }
              });
          } else {
            // Status == 'closed'
            if (tool_owner.is_suspended == true) {
              update_tool.status = "not available";
            }

            Tool.findOneAndUpdate(tool_filter, update_tool, { new: true })
              .populate("owner")
              .then((tool) => {
                if (!tool) {
                  res
                    .status(401)
                    .send({ message: "Tool was not found", request: request });
                } else {
                  new Notification({
                    date: now,
                    sender: mongoose.Types.ObjectId(req.userId),
                    recipient: request.requestor,
                    link: "tools/board-tool/" + request.tool._id,
                    content: `Your request has been ${status}`,
                  })
                    .save()
                    .then((_) => {
                      res.status(200).send({
                        message: "Request has been updated sucessfully!",
                        request: request,
                      });
                    });
                }
              });
          }
        });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* The above code is a function that is called when a user clicks on a button to give feedback to
another user. */
exports.request_feedback = (req, res) => {
  ToolRequest.findOne({ _id: req.body.request_id })
    .populate("tool")
    .then((request) => {
      inc = req.body.feedback ? 1 : -1;
      initiator_id = req.body.id;
      if (!request) {
        res.status(401).send({ message: "Request was not found" });
      } else {
        tool_owner_id = request.tool.owner._id;
        is_owner_initiate = tool_owner_id == initiator_id;

        if (is_owner_initiate && !request.owner_feedback) {
          update_request = { owner_feedback: true };
          user_filter = { _id: request.requestor };
        } else if (!is_owner_initiate && !request.my_feedback) {
          update_request = { my_feedback: true };
          user_filter = { _id: tool_owner_id };
        } else {
          res
            .status(401)
            .send({ message: "You can update feedback one per loan" });
        }
        ToolRequest.findOneAndUpdate(request.id, update_request, {
          new: true,
        }).then((request) => {
          User.findOneAndUpdate(user_filter, { $inc: { rank: inc } }).then(
            (_) => {
              res.status(200).send({
                message: "User have been ranked successfully",
                request: request,
              });
            }
          );
        });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* A function that is called when a user makes a request to the server. */
exports.tool_history = (req, res) => {
  const tool_id = req.params.id;

  ToolRequest.find({ tool: tool_id, approval_date: { $ne: null } })
    .populate("requestor")
    .sort({ approval_date: -1 })
    .then((requests) => {
      if (!requests) {
        res.status(200).send({ message: "History was not found", history: [] });
      } else {
        res.status(200).send({
          message: "Tool history based requests has found successfully",
          history: parse_requests_to_history(requests),
        });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

/* Counting the amount of tools in the database. */
exports.tools_amount = (req, res) => {
  Tool.estimatedDocumentCount().then( amount => {
    res.status(200).send({
      amount: amount,
    });
  }).catch( err => {
    res.status(500).send({ message: err });
  });
}

/**
 * It takes an array of objects, and returns an array of objects with the same keys, but with different
 * values
 * @param requests - an array of objects, each object has the following properties: expiration_date, approval_date, requestor_name, requestor_username
 * @returns An array of objects.
 */
function parse_requests_to_history(requests) {
  let response = [];
  for (let i = 0; i < requests.length; i++) {
    response.push({
      expiration_date: date2str(requests[i].expiration_date),
      approval_date: date2str(requests[i].approval_date),
      requestor_name: `${requests[i].requestor.fname} ${requests[i].requestor.lname}`,
      requestor_username: requests[i].requestor.username,
    });
  }
  return response;
}

/**
 * It takes a date object and returns a string in the format `YYYY-MM-DD HH:MM:SS`
 * @param date - The date object to convert to a string.
 * @returns A string in the format of "MM/DD/YYYY HH:MM:SS"
 */
function date2str(date) {
  const hours = (date.getHours() < 10 ? "0" : "") + date.getHours();
  const minutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
  const seconds = (date.getSeconds() < 10 ? "0" : "") + date.getSeconds();
  return `${date.toLocaleDateString()} ${hours}:${minutes}:${seconds}`;
}
