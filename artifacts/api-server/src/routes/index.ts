import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import entitiesRouter from "./entities";
import functionsRouter from "./functions";

const router = Router();

router.use(entitiesRouter);
router.use(healthRouter);
router.use(authRouter);
router.use(functionsRouter);

export default router;
