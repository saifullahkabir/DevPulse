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
router.get("/", issueController.getAllIssues);
router.get("/:id", issueController.getSingleIssue);
router.patch(
  "/:id",
  auth(Role.CONTRIBUTOR, Role.MAINTAINER),
  issueController.updateIssue,
);
router.delete("/:id", auth(Role.MAINTAINER), issueController.deleteIssue)

export const issueRoute = router;
