const STATUS_OK = {
  code: 200,
  response: "OK",
};

const STATUS_CREATED = {
  code: 201,
  response: "CREATED",
};

const STATUS_BAD_REQUEST = {
  code: 400,
  response: "BAD REQUEST",
};

const STATUS_NOTFOUND = {
  code: 404,
  response: "RECORD NOT FOUND",
};

const STATUS_SERVER_ERROR = {
  code: 500,
  response: "INTERNAL SERVER ERROR",
};

export default {
  STATUS_OK,
  STATUS_CREATED,
  STATUS_BAD_REQUEST,
  STATUS_NOTFOUND,
  STATUS_SERVER_ERROR,
};
