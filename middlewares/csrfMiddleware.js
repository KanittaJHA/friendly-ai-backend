import ApiError from "../utils/ApiError.js";

export const verifyCsrf = (req, res, next) => {
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
