import { Request, Response } from "express";
import * as peakHourService from "../../services/admin/peakHour.service";

export const createPeakHourCharge = async (req: Request, res: Response) => {
  try {
    const peakHourCharge = await peakHourService.createPeakHourCharge(req.body);
    res.status(201).json({
      status: "success",
      data: peakHourCharge,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getAllPeakHourCharges = async (req: Request, res: Response) => {
  try {
    const { vehicleTypeId, cityCodeId, isActive } = req.query;
    const filters = {
      vehicleTypeId: vehicleTypeId as string,
      cityCodeId: cityCodeId as string,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    };
    const charges = await peakHourService.getAllPeakHourCharges(filters);
    res.status(200).json({
      status: "success",
      data: charges,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getPeakHourChargeById = async (req: Request, res: Response) => {
  try {
    const charge = await peakHourService.getPeakHourChargeById(req.params.id);
    res.status(200).json({
      status: "success",
      data: charge,
    });
  } catch (error: any) {
    res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
};

export const updatePeakHourCharge = async (req: Request, res: Response) => {
  try {
    const charge = await peakHourService.updatePeakHourCharge(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      data: charge,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

export const deletePeakHourCharge = async (req: Request, res: Response) => {
  try {
    const result = await peakHourService.deletePeakHourCharge(req.params.id);
    res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

export default {
  createPeakHourCharge,
  getAllPeakHourCharges,
  getPeakHourChargeById,
  updatePeakHourCharge,
  deletePeakHourCharge,
};
