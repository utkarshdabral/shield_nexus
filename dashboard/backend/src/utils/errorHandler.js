/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // Validation errors
    if (err.name === 'ValidationError' || err.isJoi) {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: err.details || null
        });
    }

    // Python execution errors
    if (err.code === 'PYTHON_ERROR') {
        return res.status(500).json({
            error: 'Analysis Error',
            message: err.message,
            details: err.stderr || null
        });
    }

    // Database errors
    if (err.code === 'SQLITE_ERROR' || err.code?.startsWith('SQLITE_')) {
        return res.status(500).json({
            error: 'Database Error',
            message: 'An error occurred while accessing the database'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'An unexpected error occurred'
    });
}

/**
 * Async route wrapper to catch errors
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Create a custom error
 */
export function createError(message, code, status = 500) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
}
