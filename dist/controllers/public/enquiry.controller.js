"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auditLog_service_1 = require("../../services/audit/auditLog.service");
const client_1 = require("@prisma/client");
exports.default = {
    async submitEnquiry(req, res) {
        try {
            const { name, phone, pickup, drop, rideType, vehicleType, pickupDateTime, passengers, message } = req.body;
            if (!name || !phone || !pickup) {
                return res.status(400).json({
                    success: false,
                    message: "Name, phone, and pickup location are required",
                });
            }
            const description = `New Enquiry received from ${name} (${phone}) for ${rideType || 'LOCAL'} ride. Vehicle: ${vehicleType || 'Any'}. Date: ${pickupDateTime || 'Not specified'}. Passengers: ${passengers || 'Not specified'}. Pickup: ${pickup}. Drop: ${drop || 'Not provided'}. ${message ? `Message: ${message}` : ''}`;
            // Log the enquiry asynchronously in the audit logs
            await (0, auditLog_service_1.createAuditLog)({
                action: client_1.AuditAction.CREATE,
                module: "ENQUIRY",
                description,
                newData: { name, phone, pickup, drop, rideType, vehicleType, pickupDateTime, passengers, message },
            });
            res.status(200).json({
                success: true,
                message: "Enquiry submitted successfully",
            });
        }
        catch (error) {
            console.error("Error submitting enquiry:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error submitting enquiry",
            });
        }
    },
};
