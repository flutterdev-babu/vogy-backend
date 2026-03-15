"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const partnerAuthService = __importStar(require("../../services/auth/partner.auth.service"));
const partnerService = __importStar(require("../../services/partner/partner.service"));
const adminService = __importStar(require("../../services/admin/admin.service"));
exports.default = {
    /* ============================================
        AUTH ENDPOINTS
    ============================================ */
    async register(req, res) {
        try {
            const partner = await partnerAuthService.registerPartner(req.body);
            res.status(201).json({ success: true, data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async login(req, res) {
        try {
            const { phone, password, otp } = req.body;
            if (!phone || (!password && !otp)) {
                return res.status(400).json({ success: false, message: "Phone and either password or otp are required" });
            }
            const result = await partnerAuthService.loginPartner(phone, password, otp);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(401).json({ success: false, message: err.message });
        }
    },
    async getProfile(req, res) {
        try {
            const partner = await partnerAuthService.getPartnerProfile(req.user.id);
            res.json({ success: true, data: partner });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async updateProfile(req, res) {
        try {
            const partner = await partnerAuthService.updatePartnerProfile(req.user.id, req.body);
            res.json({ success: true, data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async updateLocation(req, res) {
        try {
            const { lat, lng } = req.body;
            if (lat === undefined || lng === undefined) {
                return res.status(400).json({ success: false, message: "lat and lng are required" });
            }
            const partner = await partnerAuthService.updatePartnerLocation(req.user.id, lat, lng);
            res.json({ success: true, data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async toggleOnlineStatus(req, res) {
        try {
            const { isOnline } = req.body;
            if (isOnline === undefined) {
                return res.status(400).json({ success: false, message: "isOnline is required" });
            }
            const partner = await partnerAuthService.togglePartnerOnline(req.user.id, isOnline);
            res.json({ success: true, data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        PARTNER MANAGEMENT (Admin endpoints)
    ============================================ */
    async getAllPartners(req, res) {
        try {
            const { vendorId, status, verificationStatus, search, includeDeleted, cityCodeId } = req.query;
            const partners = await partnerService.getAllPartners({
                vendorId: vendorId,
                status: status ? status.toUpperCase() : undefined,
                verificationStatus: verificationStatus ? verificationStatus.toUpperCase() : undefined,
                search: search,
                includeDeleted: includeDeleted === "true",
                cityCodeId: cityCodeId,
            });
            res.json({ success: true, data: partners });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getPartnerById(req, res) {
        try {
            const partner = await partnerService.getPartnerById(req.params.id);
            res.json({ success: true, data: partner });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async updatePartnerStatus(req, res) {
        try {
            const { status } = req.body;
            const adminId = req.user?.id;
            if (!status) {
                return res.status(400).json({ success: false, message: "Status is required" });
            }
            const partner = await partnerService.updatePartnerStatus(req.params.id, status, adminId);
            res.json({ success: true, data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async updatePartnerVerification(req, res) {
        try {
            const { status } = req.body;
            const adminId = req.user?.id;
            if (!status) {
                return res.status(400).json({ success: false, message: "Verification status is required" });
            }
            const partner = await partnerService.updatePartnerVerification(req.params.id, status, adminId);
            res.json({ success: true, data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async updatePartnerByAdmin(req, res) {
        try {
            const partner = await partnerService.updatePartnerByAdmin(req.params.id, req.body);
            res.json({ success: true, data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async assignPartnerToVehicle(req, res) {
        try {
            const { vehicleId } = req.body;
            if (!vehicleId) {
                return res.status(400).json({ success: false, message: "vehicleId is required" });
            }
            const partner = await partnerService.assignPartnerToVehicle(req.params.id, vehicleId);
            res.json({ success: true, data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async unassignPartnerFromVehicle(req, res) {
        try {
            const partner = await partnerService.unassignPartnerFromVehicle(req.params.id);
            res.json({ success: true, data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getPartnerRides(req, res) {
        try {
            const partnerId = req.params.id || req.user.id;
            const { status, startDate, endDate } = req.query;
            const rides = await partnerService.getPartnerRides(partnerId, {
                status: status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });
            res.json({ success: true, data: rides });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getPartnerAnalytics(req, res) {
        try {
            const partnerId = req.params.id || req.user.id;
            const analytics = await partnerService.getPartnerAnalytics(partnerId);
            res.json({ success: true, data: analytics });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getAvailablePartners(req, res) {
        try {
            const { vehicleTypeId } = req.query;
            const partners = await partnerService.getAvailablePartners(vehicleTypeId);
            res.json({ success: true, data: partners });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async deletePartner(req, res) {
        try {
            const adminId = req.user?.id;
            const result = await partnerService.deletePartner(req.params.id, adminId);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async createAttachment(req, res) {
        try {
            const { fileType, fileUrl, uploadedBy } = req.body;
            const adminId = req.user?.id;
            const attachment = await adminService.createAttachment({
                referenceType: "PARTNER",
                referenceId: req.user.id,
                fileType,
                fileUrl,
                uploadedBy: uploadedBy || "PARTNER",
                adminId
            });
            res.status(201).json({ success: true, data: attachment });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        PARTNER DASHBOARD ENDPOINTS
    ============================================ */
    async getDashboard(req, res) {
        try {
            const dashboard = await partnerService.getPartnerDashboard(req.user.id);
            res.json({ success: true, data: dashboard });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getVehicleInfo(req, res) {
        try {
            const vehicleInfo = await partnerService.getPartnerVehicleInfo(req.user.id);
            res.json({ success: true, data: vehicleInfo });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getPartnerRideDetail(req, res) {
        try {
            const ride = await partnerService.getPartnerRideById(req.user.id, req.params.id);
            res.json({ success: true, data: ride });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async getPartnerEarningsSummary(req, res) {
        try {
            const earnings = await partnerService.getPartnerEarnings(req.user.id);
            res.json({ success: true, data: earnings });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
};
