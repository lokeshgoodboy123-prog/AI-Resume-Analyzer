import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import resumesRouter from "./resumes";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/resumes", resumesRouter);
router.use("/dashboard", dashboardRouter);

export default router;
