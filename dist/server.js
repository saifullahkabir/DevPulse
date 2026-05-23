
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: Number(process.env.PORT),
  connection_string: process.env.CONNECTION_STRING,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(20) DEFAULT 'contributor' 
            CHECK (role IN ('contributor', 'maintainer')),

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )    
            `);
    await pool.query(`
            CREATE TABLE IF NOT EXISTS issues(
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            description TEXT NOT NULL,
            
            type VARCHAR(20) NOT NULL
            CHECK(type IN ('bug', 'feature_request')),

            status VARCHAR(20) DEFAULT 'open'
            CHECK(status IN ('open', 'in_progress', 'resolved')),

            reporter_id INT NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    console.log("Database connected successfully");
  } catch (error) {
    console.error(error);
  }
};

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role) VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
    RETURNING *
    `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Password not match!");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const accessToken = jwt.sign(jwtpayload, config_default.jwt_access_secret, {
    expiresIn: "7d"
  });
  delete user.password;
  return {
    token: accessToken,
    user
  };
};
var authService = {
  registerUserIntoDB,
  loginUserIntoDB
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  return res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
import { StatusCodes } from "http-status-codes";
var registerUser = async (req, res) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    return sendResponse_default(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      error
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    return sendResponse_default(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      error
    });
  }
};
var authController = {
  registerUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issue.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issue.controller.ts
import { StatusCodes as StatusCodes2 } from "http-status-codes";

// src/modules/issues/issue.service.ts
var createIssueIntoDB = async (payload, reporter_id) => {
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
    [title, description, type, reporter_id]
  );
  return result;
};
var getAllIssuesFromDB = async (payload) => {
  const { sort, type, status } = payload;
  let query = `SELECT * FROM issues`;
  const values = [];
  if (type) {
    query += ` WHERE type=$1`;
    values.push(type);
  }
  if (status) {
    if (type) {
      query += ` AND status=$2`;
    } else {
      query += ` WHERE status=$1`;
    }
    values.push(status);
  }
  if (sort === "oldest") {
    query += ` ORDER BY created_at ASC`;
  } else {
    query += ` ORDER BY created_at DESC`;
  }
  const issuesResult = await pool.query(query, values);
  const issues = issuesResult.rows;
  const formattedIssues = [];
  for (const issue of issues) {
    const reporterResult = await pool.query(
      `
      SELECT id, name, role FROM users WHERE id=$1
      `,
      [issue.reporter_id]
    );
    const reporter = reporterResult.rows[0];
    formattedIssues.push({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    });
  }
  return formattedIssues;
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  const reporterResult = await pool.query(
    `
    SELECT id, name, role FROM users WHERE id=$1
    `,
    [issue.reporter_id]
  );
  const reporter = reporterResult.rows[0];
  const formattedIssues = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
  return formattedIssues;
};
var updateIssueIntoDB = async (id, payload, user) => {
  const { title, description, type, status } = payload;
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("You cannot update this issue");
    }
    if (issue.status !== "open") {
      throw new Error("You can only update open issues");
    }
    if (status) {
      throw new Error("You cannot update issue status");
    }
  }
  if (description && description.length < 20) {
    throw new Error("Description must be at least 20 characters");
  }
  if (title && title.length > 150) {
    throw new Error("Title cannot exceed 150 characters");
  }
  const result = await pool.query(
    `
    UPDATE issues SET
    title = COALESCE($1, title),
    description = COALESCE($2, description),
    type = COALESCE($3, type),
    status = COALESCE($4, status),
    updated_at = NOW()

    WHERE id=$5 RETURNING *
    `,
    [title, description, type, status, id]
  );
  return result;
};
var deleteIssueIntoDB = async (id) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1
    `,
    [id]
  );
  return result;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueIntoDB
};

// src/modules/issues/issue.controller.ts
var createIssue = async (req, res) => {
  const reporter_id = req.user?.id;
  try {
    const result = await issueService.createIssueIntoDB(
      req.body,
      reporter_id
    );
    return sendResponse_default(res, {
      statusCode: StatusCodes2.CREATED,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);
    return sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return sendResponse_default(res, {
        statusCode: StatusCodes2.BAD_REQUEST,
        success: false,
        message: "Invalid issue id"
      });
    }
    const result = await issueService.getSingleIssueFromDB(id);
    return sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: error instanceof Error && error.message === "Issue not found" ? StatusCodes2.NOT_FOUND : StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      error
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return sendResponse_default(res, {
        statusCode: StatusCodes2.BAD_REQUEST,
        success: false,
        message: "Invalid issue id"
      });
    }
    const user = req.user;
    const result = await issueService.updateIssueIntoDB(id, req.body, user);
    return sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issue updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: error instanceof Error && error.message === "Issue not found" ? StatusCodes2.NOT_FOUND : StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      error
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return sendResponse_default(res, {
        statusCode: StatusCodes2.BAD_REQUEST,
        success: false,
        message: "Invalid issue id"
      });
    }
    const result = await issueService.deleteIssueIntoDB(id);
    return sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: error instanceof Error && error.message === "Issue not found" ? StatusCodes2.NOT_FOUND : StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      error
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
import { StatusCodes as StatusCodes3 } from "http-status-codes";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse_default(res, {
          statusCode: StatusCodes3.UNAUTHORIZED,
          success: false,
          message: "Unauthorized access!"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.jwt_access_secret
      );
      const userData = await pool.query(
        `
        SELECT id, name, role FROM users WHERE id=$1
        `,
        [decoded.id]
      );
      if (userData.rows.length === 0) {
        return sendResponse_default(res, {
          statusCode: StatusCodes3.NOT_FOUND,
          success: false,
          message: "User not found!"
        });
      }
      const user = userData.rows[0];
      if (roles.length && !roles.includes(user.role)) {
        return sendResponse_default(res, {
          statusCode: StatusCodes3.FORBIDDEN,
          success: false,
          message: "Forbidden access"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt2.JsonWebTokenError) {
        return sendResponse_default(res, {
          statusCode: StatusCodes3.UNAUTHORIZED,
          success: false,
          message: "Invalid token!",
          error
        });
      }
      if (error instanceof jwt2.TokenExpiredError) {
        return sendResponse_default(res, {
          statusCode: StatusCodes3.UNAUTHORIZED,
          success: false,
          message: "Token expired!",
          error
        });
      }
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/issues/issue.route.ts
var router2 = Router2();
router2.post(
  "/",
  auth_default("contributor" /* CONTRIBUTOR */, "maintainer" /* MAINTAINER */),
  issueController.createIssue
);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch(
  "/:id",
  auth_default("contributor" /* CONTRIBUTOR */, "maintainer" /* MAINTAINER */),
  issueController.updateIssue
);
router2.delete("/:id", auth_default("maintainer" /* MAINTAINER */), issueController.deleteIssue);
var issueRoute = router2;

// src/app.ts
import cors from "cors";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  const message = err instanceof Error ? err.message : "Internal Server Error";
  res.status(500).json({
    success: false,
    message
  });
};

// src/middleware/notFoundHandler.ts
var notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
};

// src/app.ts
var app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "DevPulse server..."
  });
});
app.use(globalErrorHandler);
app.use(notFoundHandler);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Server is running on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map