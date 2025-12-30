import Joi from 'joi';

/**
 * Validation schemas for API requests
 */

export const cctvAnalyzeSchema = Joi.object({
    videoPath: Joi.string().required(),
    videoId: Joi.string().optional(),
    metadata: Joi.object().optional()
});

export const cctvQuerySchema = Joi.object({
    videoId: Joi.string().optional(),
    issueId: Joi.number().integer().min(1).optional(),
    startTime: Joi.string().isoDate().optional(),
    endTime: Joi.string().isoDate().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    offset: Joi.number().integer().min(0).default(0)
});

export const sentimentAnalyzeSchema = Joi.object({
    texts: Joi.array().items(
        Joi.object({
            id: Joi.string().optional(),
            text: Joi.string().required(),
            source: Joi.string().optional(),
            timestamp: Joi.string().isoDate().optional(),
            location: Joi.string().optional()
        })
    ).min(1).required()
});

export const sentimentBatchSchema = Joi.object({
    csvPath: Joi.string().optional(),
    textColumn: Joi.string().default('text'),
    timestampColumn: Joi.string().default('timestamp')
});

export const sentimentQuerySchema = Joi.object({
    sourceType: Joi.string().optional(),
    riskLevel: Joi.string().valid('Low', 'Medium', 'High').optional(),
    startTime: Joi.string().isoDate().optional(),
    endTime: Joi.string().isoDate().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    offset: Joi.number().integer().min(0).default(0)
});

export const riskQuerySchema = Joi.object({
    startTime: Joi.string().isoDate().optional(),
    endTime: Joi.string().isoDate().optional(),
    granularity: Joi.string().valid('minute', 'hour', 'day').default('minute'),
    limit: Joi.number().integer().min(1).max(1000).default(100)
});

export const configUpdateSchema = Joi.object({
    value: Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.object()
    ).required()
});

/**
 * Validation middleware factory
 */
export function validate(schema, property = 'body') {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            error.isJoi = true;
            return next(error);
        }

        req[property] = value;
        next();
    };
}
