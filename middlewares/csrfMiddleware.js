import ApiError from "../utils/ApiError.js";

export const verifyCsrf = (req, res, next) => {
  const csrfTokenHeader = req.headers["x-csrf-token"];
  const csrfTokenCookie = req.cookies["csrfToken"];

  console.log("=== CSRF Check ===");
  console.log("CSRF Cookie:", csrfTokenCookie);
  console.log("CSRF Header:", csrfTokenHeader);

  if (!csrfTokenHeader || !csrfTokenCookie) {
    console.warn("CSRF token missing in request");
    return next(new ApiError(403, "CSRF token missing"));
  }

  if (csrfTokenHeader !== csrfTokenCookie) {
    console.warn("CSRF token mismatch");
    return next(new ApiError(403, "Invalid CSRF token"));
  }

  next();
};
