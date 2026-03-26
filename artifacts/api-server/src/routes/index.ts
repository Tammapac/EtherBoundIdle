import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import entitiesRouter from "./entities";
import functionsRouter from "./functions";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.get("/test", async (req, res) => {
  const { data, error } = await supabase.from("players").select("*");
  res.json({ data, error });
});

router.use(entitiesRouter);
router.use(functionsRouter);

export default router;
