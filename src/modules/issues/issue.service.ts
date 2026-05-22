import { pool } from "../../db";
import type { TGetIssuesQuery } from "../../types/issuequery";
import { title } from "node:process";
import type { ICreateIssue } from "./issue.interface";

const createIssueIntoDB = async (
  payload: ICreateIssue,
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

const getAllIssuesFromDB = async (payload: TGetIssuesQuery) => {
  const { sort, type, status } = payload;

  let query = `SELECT * FROM issues`;

  //* sql values
  const values: string[] = [];

  //* type
  if (type) {
    query += ` WHERE type=$1`;
    values.push(type);
  }

  //* status
  if (status) {
    //* if type already exists
    if (type) {
      query += ` AND status=$2`;
    } else {
      query += ` WHERE status=$1`;
    }

    values.push(status);
  }

  //* sorting
  if (sort === "oldest") {
    query += ` ORDER BY created_at ASC`;
  } else {
    //* default newest
    query += ` ORDER BY created_at DESC`;
  }

  //* get all issues
  const issuesResult = await pool.query(query, values);

  const issues = issuesResult.rows;

  const formattedIssues = [];

  //* loop issues
  for (const issue of issues) {
    //* get reporter info
    const reporterResult = await pool.query(
      `
      SELECT id, name, role FROM users WHERE id=$1
      `,
      [issue.reporter_id],
    );

    const reporter = reporterResult.rows[0];

    formattedIssues.push({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporter,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    });
  }

  return formattedIssues;
};

const getSingleIssueFromDB = async (id: number) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id],
  );

  //* issue not found check
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

  //* get reporter info
  const reporterResult = await pool.query(
    `
    SELECT id, name, role FROM users WHERE id=$1
    `,
    [issue.reporter_id],
  );

  const reporter = reporterResult.rows[0];

  const formattedIssues = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };

  return formattedIssues;
};

const updateIssueIntoDB = async(payload: ICreateIssue) => {

}

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB
};
