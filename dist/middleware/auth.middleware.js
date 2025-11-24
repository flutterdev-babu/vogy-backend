"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../config/prisma");
const authMiddleware = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            const auth = req.headers.authorization;
            if (!auth || !auth.startsWith("Bearer ")) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const token = auth.split(" ")[1];
            const payload = (0, jwt_1.verifyToken)(token);
            if (!payload || !payload.id || !payload.role) {
                return res.status(401).json({ success: false, message: "Invalid token" });
            }
            // fetch user by role
            const role = payload.role;
            let account = null;
            if (role === "USER")
                account = await prisma_1.prisma.user.findUnique({ where: { id: payload.id } });
            else if (role === "RIDER")
                account = await prisma_1.prisma.rider.findUnique({ where: { id: payload.id } });
            else if (role === "ADMIN")
                account = await prisma_1.prisma.admin.findUnique({ where: { id: payload.id } });
            if (!account)
                return res.status(401).json({ success: false, message: "Account not found" });
            // role check
            if (allowedRoles.length && !allowedRoles.includes(role)) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }
            req.user = { id: payload.id, role, account };
            next();
        }
        catch (err) {
            return res.status(401).json({ success: false, message: err.message || "Unauthorized" });
        }
    };
};
exports.authMiddleware = authMiddleware;
