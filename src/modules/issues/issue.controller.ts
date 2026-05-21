import type { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
  const reporter_id = req.user?.id;
  try {
    const result = await issueService.createIssueIntoDB(req.body, reporter_id);

    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      error: error,
    });
  }
};

export const issueController = {
  createIssue,
};
