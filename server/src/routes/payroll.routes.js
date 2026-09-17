import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as payrollController from "../controllers/payroll.controller.js";

const payrollRouter = Router();

payrollRouter.post("/founders/:founderId/payroll/generate", requireAuth, asyncHandler(payrollController.generatePayroll));
payrollRouter.get("/founders/:founderId/payroll", requireAuth, asyncHandler(payrollController.getPayroll));
payrollRouter.post("/payroll/:recordId/mark-paid", requireAuth, asyncHandler(payrollController.markPayrollPaid));
payrollRouter.post("/payroll/:recordId/pay-with-paystack", requireAuth, asyncHandler(payrollController.payWithPaystack));
payrollRouter.get("/payroll/banks", requireAuth, asyncHandler(payrollController.getBanks));

export default payrollRouter;
