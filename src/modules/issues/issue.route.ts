import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";
import { Role } from "../../enums/role.enum";

const router = Router();

router.post(
  "/",
  auth(Role.CONTRIBUTOR, Role.MAINTAINER),
  issueController.createIssue,
);

export const issueRoute = router;
