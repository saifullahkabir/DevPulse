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

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      data: result,
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

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    //* if issue id not exists
    if (!id) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Invalid issue id",
      });
    }

    const result = await issueService.getSingleIssueFromDB(id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      data: result,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode:
        error instanceof Error && error.message === "Issue not found"
          ? StatusCodes.NOT_FOUND
          : StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      error: error,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.updateIssueIntoDB(req.body);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      data: result,
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
  getAllIssues,
  getSingleIssue,
  updateIssue,
};
