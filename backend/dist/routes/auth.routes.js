"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_schema_1 = require("../validation/auth.schema");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_middleware_1.validate)(auth_schema_1.registerSchema), auth_controller_1.AuthController.register);
router.post('/login', (0, validate_middleware_1.validate)(auth_schema_1.loginSchema), auth_controller_1.AuthController.login);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.AuthController.me);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map