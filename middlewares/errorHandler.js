const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
    message = err.message;
  }

  res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
