import ApiError from "../utils/ApiError.js";

export const verifyCsrf = (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping CSRF check in production (cross-origin)");
    return next();
  }

  const csrfTokenHeader = req.headers["x-csrf-token"];
  const csrfTokenCookie = req.cookies["csrfToken"];

  if (
    !csrfTokenHeader ||
    !csrfTokenCookie ||
    csrfTokenHeader !== csrfTokenCookie
  ) {
    return next(new ApiError(403, "Invalid CSRF token"));
  }

  next();
};
