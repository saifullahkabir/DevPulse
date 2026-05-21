import { pool } from "../../db";
import type { TCreateIssue } from "./issue.interface";

const createIssueIntoDB = async (
  payload: TCreateIssue,
  reporter_id: number,
) => {
  const { title, description, type } = payload;

  if (description.length < 20) {
    throw new Error("Description must be at least 20 characters");
  }

  if (title.length > 150) {
    throw new Error("Title cannot exceed 150 characters");
  }

  const result = await pool.query(
    `
    INSERT INTO issues(title, description, type, reporter_id) VALUES($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, type, reporter_id],
  );

  return result;
};

export const issueService = {
  createIssueIntoDB,
};
