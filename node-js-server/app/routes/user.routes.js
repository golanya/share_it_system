const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/test/all", controller.allAccess);

  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  app.post("/api/test/organization_code",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.setOrganizationCode
  );

  app.get(
    "/api/test/users",
    [authJwt.verifyToken],
    controller.users
  );

  app.post(
    "/api/test/users-by-filter",
    [authJwt.verifyToken],
    controller.users_by_filter
  );

  app.get(
    "/api/test/users-amount",
    [authJwt.verifyToken],
    controller.users_amount
  );

  app.get(
    "/api/test/user",
    [authJwt.verifyToken],
    controller.user
  );

  app.post(
    "/api/test/user/update-user",
    [authJwt.verifyToken],
    controller.update_user
  );

  app.post(
    "/api/test/user/suspend/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.suspend_user
  );

  app.post(
    "/api/test/user/restore/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.restore_user
  );

  app.post(
    "/api/test/user/elevated/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.elevated_user
  );

  app.post(
    "/api/test/user/delete/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.delete_user
  );
};
