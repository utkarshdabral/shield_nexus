import { getConfig, setConfig } from '../services/storage.service.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * Configuration Controller
 */

/**
 * GET /api/config
 * Get all configuration values
 */
export const getAllConfig = asyncHandler(async (req, res) => {
    const config = getConfig();

    res.json({
        success: true,
        data: config
    });
});

/**
 * GET /api/config/:key
 * Get specific configuration value
 */
export const getConfigValue = asyncHandler(async (req, res) => {
    const { key } = req.params;

    const value = getConfig(key);

    if (value === null) {
        return res.status(404).json({
            success: false,
            message: `Configuration key '${key}' not found`
        });
    }

    res.json({
        success: true,
        key,
        value
    });
});

/**
 * PUT /api/config/:key
 * Update configuration value
 */
export const updateConfig = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    setConfig(key, value);

    res.json({
        success: true,
        message: `Configuration '${key}' updated`,
        key,
        value
    });
});

/**
 * POST /api/config/batch
 * Update multiple configuration values
 */
export const batchUpdateConfig = asyncHandler(async (req, res) => {
    const { configs } = req.body;

    if (!configs || typeof configs !== 'object') {
        return res.status(400).json({
            success: false,
            message: 'Please provide configs object'
        });
    }

    for (const [key, value] of Object.entries(configs)) {
        setConfig(key, value);
    }

    res.json({
        success: true,
        message: 'Configuration updated',
        updated: Object.keys(configs)
    });
});
