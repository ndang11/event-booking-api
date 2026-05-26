/**
 * Standardized success response wrapper.
 * @param {import('express').Response} res
 * @param {any} data
 * @param {number} statusCode
 * @returns {import('express').Response}
 */
export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

/**
 * Standardized error response wrapper.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 * @returns {import('express').Response}
 */
export const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};