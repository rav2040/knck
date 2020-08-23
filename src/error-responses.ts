import { STATUS_CODES } from 'http';

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

export const badRequestResponse = {
  status: HTTP_STATUS_BAD_REQUEST,
  text: STATUS_CODES[HTTP_STATUS_BAD_REQUEST],
};

export const notFoundResponse = {
  status: HTTP_STATUS_NOT_FOUND,
  text: STATUS_CODES[HTTP_STATUS_NOT_FOUND],
};

export const serverErrorResponse = {
  status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
  text: STATUS_CODES[HTTP_STATUS_INTERNAL_SERVER_ERROR],
};
