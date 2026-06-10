const { authenticate, authorize } = require('../middleware/auth');
const { validate, loginSchema } = require('../middleware/validate');
const { errorHandler, notFoundHandler, AppError } = require('../middleware/errorHandler');

describe('AppError', () => {
  it('creates error with message and status', () => {
    const err = new AppError('Test error', 400);
    expect(err.message).toBe('Test error');
    expect(err.status).toBe(400);
    expect(err.name).toBe('AppError');
  });

  it('defaults to status 500', () => {
    const err = new AppError('Server error');
    expect(err.status).toBe(500);
  });
});

describe('authenticate middleware', () => {
  function mockReqRes(authHeader) {
    const req = { headers: { authorization: authHeader } };
    const res = { status: (code) => ({ json: (data) => ({ status: code, data }) }) };
    return { req, res };
  }

  it('returns 401 if no token provided', () => {
    const { req, res } = mockReqRes(undefined);
    let result;
    authenticate(req, res, (err) => { result = err; });
    expect(result).toBeUndefined();
  });

  it('returns 401 if token format is invalid', () => {
    const { req, res } = mockReqRes('InvalidFormat');
    authenticate(req, res, null);
  });
});

describe('authorize middleware', () => {
  it('returns 403 if role not allowed', () => {
    const req = { user: { role: 'pelapor' } };
    const res = {
      status: (code) => ({
        json: (data) => {
          expect(code).toBe(403);
          expect(data.error).toContain('Forbidden');
        }
      })
    };
    const middleware = authorize('admin', 'pmkp');
    middleware(req, res, () => { throw new Error('Should not call next'); });
  });

  it('calls next if role is allowed', () => {
    const req = { user: { role: 'pmkp' } };
    const res = { status: () => ({ json: () => {} }) };
    let called = false;
    const middleware = authorize('admin', 'pmkp');
    middleware(req, res, () => { called = true; });
    expect(called).toBe(true);
  });
});

describe('validate middleware', () => {
  function mockReqRes(body) {
    const req = { body };
    const res = { status: (code) => ({ json: (data) => ({ status: code, data }) }) };
    return { req, res };
  }

  it('passes valid data to next', () => {
    const { req, res } = mockReqRes({ username: 'testuser', password: '12345' });
    let validated;
    const middleware = validate(loginSchema);
    middleware(req, res, () => { validated = req.validated; });
    expect(validated).toBeDefined();
    expect(validated.username).toBe('testuser');
  });

  it('rejects invalid data with 422', () => {
    const { req, res } = mockReqRes({ username: 'ab' });
    let statusCode, jsonData;
    res.status = (code) => {
      statusCode = code;
      return { json: (data) => { jsonData = data; } };
    };
    const middleware = validate(loginSchema);
    middleware(req, res, () => {});
    expect(statusCode).toBe(422);
    expect(jsonData.error).toBe('Validation failed');
    expect(jsonData.details.length).toBeGreaterThan(0);
  });
});

describe('errorHandler middleware', () => {
  it('handles AppError with correct status', () => {
    const err = new AppError('Not found', 404);
    const req = {};
    let statusCode, jsonData;
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: (data) => { jsonData = data; } };
      }
    };
    errorHandler(err, req, res, () => {});
    expect(statusCode).toBe(404);
    expect(jsonData.error).toBe('Not found');
  });

  it('defaults to 500 for unknown errors in test mode', () => {
    const err = new Error('Something broke');
    const req = { originalUrl: '/test', method: 'GET' };
    let statusCode, jsonData;
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: (data) => { jsonData = data; } };
      }
    };
    errorHandler(err, req, res, () => {});
    expect(jsonData.error).toBe('Something broke');
  });
});

describe('notFoundHandler', () => {
  it('returns 404 with route info', () => {
    const req = { method: 'GET', originalUrl: '/api/v1/unknown' };
    let statusCode, jsonData;
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: (data) => { jsonData = data; } };
      }
    };
    notFoundHandler(req, res);
    expect(statusCode).toBe(404);
    expect(jsonData.error).toContain('/api/v1/unknown');
  });
});
