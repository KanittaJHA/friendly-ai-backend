import logger from "../config/logger.js";
import { NODE_ENV } from "../config/config.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal Server Error";

  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    route: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message,
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
