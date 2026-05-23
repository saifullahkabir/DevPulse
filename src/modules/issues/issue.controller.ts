import type { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { issueService } from "./issue.service";
import type { TAuthUser } from "../../types/authUser";

const createIssue = async (req: Request, res: Response) => {
  const reporter_id = req.user?.id;
  try {
    const result = await issueService.createIssueIntoDB(
      req.body,
      reporter_id as number,
    );

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
      message: "Issues retrived successfully",
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

    //* validate id
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
      message: "Issue retrived successfully",
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
    const id = Number(req.params.id);

    //* validate id
    if (!id) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Invalid issue id",
      });
    }

    //* logged in user (jwt)
    const user = req.user as TAuthUser;

    const result = await issueService.updateIssueIntoDB(id, req.body, user);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue updated successfully",
      data: result.rows[0],
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

const deleteIssue = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    //* validate id
    if (!id) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Invalid issue id",
      });
    }

    const result = await issueService.deleteIssueIntoDB(id);

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue deleted successfully",
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

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
