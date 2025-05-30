/**
 * TrashDrop Collector - Request Model
 * Defines the structure and validation for trash collection requests
 */

/**
 * Request Model - Defines all acceptable fields for a trash collection request
 * This model serves as both documentation and runtime validation
 */
const RequestModel = {
    // Core fields (required)
    id: {
        type: 'string',
        required: true,
        description: 'Unique identifier for the request'
    },
    user_id: {
        type: 'string',
        required: true,
        description: 'ID of the user who created the request'
    },
    status: {
        type: 'string',
        required: true,
        enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
        default: 'pending',
        description: 'Current status of the request'
    },
    type: {
        type: 'string',
        required: true,
        enum: ['recyclable', 'general', 'hazardous', 'mixed', 'organic'],
        description: 'Type of trash to be collected'
    },
    
    // Location fields (required)
    address: {
        type: 'string',
        required: true,
        description: 'Full address where trash should be collected'
    },
    coordinates: {
        type: 'object',
        required: true,
        properties: {
            lat: { type: 'number', required: true },
            lng: { type: 'number', required: true }
        },
        description: 'Geographic coordinates for the collection point'
    },
    
    // Timing fields (required)
    created_at: {
        type: 'string', // ISO date string
        required: true,
        description: 'Timestamp when the request was created'
    },
    
    // Trash details (required)
    estimated_weight: {
        type: 'number',
        required: true,
        min: 0,
        description: 'Estimated weight of trash in kilograms'
    },
    bags: {
        type: 'number',
        required: true,
        min: 1,
        description: 'Number of bags to be collected'
    },
    
    // Financial details (required)
    fee: {
        type: 'number',
        required: true,
        min: 0,
        description: 'Base fee for collection in local currency'
    },
    points: {
        type: 'number',
        required: true,
        min: 0,
        description: 'Reward points for collecting this request'
    },
    
    // User details
    name: {
        type: 'string',
        description: 'Name of the requesting user'
    },
    
    // Optional fields (enhanced data)
    description: {
        type: 'string',
        maxLength: 500,
        description: 'Additional details about the trash'
    },
    images: {
        type: 'array',
        items: { type: 'string' }, // URLs to images
        description: 'Photos of the trash to be collected'
    },
    priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        description: 'Priority level of the request'
    },
    
    // Collection scheduling
    preferred_time: {
        type: 'object',
        properties: {
            start: { type: 'string' }, // ISO time string
            end: { type: 'string' }    // ISO time string
        },
        description: 'Preferred time window for collection'
    },
    deadline: {
        type: 'string', // ISO date string
        description: 'Deadline by which the trash must be collected'
    },
    
    // Collection details
    collector_id: {
        type: 'string',
        description: 'ID of the collector assigned to this request'
    },
    accepted_at: {
        type: 'string', // ISO date string
        description: 'Timestamp when the request was accepted'
    },
    pickup_started_at: {
        type: 'string', // ISO date string
        description: 'Timestamp when pickup was started'
    },
    completed_at: {
        type: 'string', // ISO date string
        description: 'Timestamp when the request was completed'
    },
    
    // Processing details
    processing_notes: {
        type: 'string',
        description: 'Notes from processing the collected trash'
    },
    processing_facility_id: {
        type: 'string',
        description: 'ID of the facility where trash was processed'
    },
    
    // Payment and rewards
    payment_status: {
        type: 'string',
        enum: ['pending', 'processing', 'completed', 'failed'],
        description: 'Status of payment to collector'
    },
    payment_id: {
        type: 'string',
        description: 'ID of the payment transaction'
    },
    
    // Environmental impact metrics
    environmental_impact: {
        type: 'object',
        properties: {
            co2_saved: { type: 'number' }, // kg of CO2 saved
            water_saved: { type: 'number' }, // liters of water saved
            trees_saved: { type: 'number' } // equivalent trees saved
        },
        description: 'Environmental impact metrics for this collection'
    },
    
    // Sorting and recycling details
    sorted_materials: {
        type: 'object',
        properties: {
            plastic: { type: 'number' }, // kg
            paper: { type: 'number' },   // kg
            glass: { type: 'number' },   // kg
            metal: { type: 'number' },   // kg
            organic: { type: 'number' }, // kg
            other: { type: 'number' }    // kg
        },
        description: 'Breakdown of sorted materials by weight'
    },
    
    // Traceability and reporting
    qr_codes: {
        type: 'array',
        items: { type: 'string' },
        description: 'QR codes associated with this request'
    },
    chain_of_custody: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                timestamp: { type: 'string' },
                handler_id: { type: 'string' },
                handler_type: { type: 'string' },
                action: { type: 'string' },
                location: { 
                    type: 'object',
                    properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' }
                    }
                }
            }
        },
        description: 'Chain of custody records for traceability'
    },
    
    // Offline operation support
    sync_status: {
        type: 'string',
        enum: ['synced', 'pending', 'conflict'],
        default: 'synced',
        description: 'Synchronization status for offline operation'
    },
    local_id: {
        type: 'string',
        description: 'Local identifier for offline-created requests'
    },
    
    // System metadata
    version: {
        type: 'number',
        default: 1,
        description: 'Schema version for this request'
    },
    tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for categorizing requests'
    }
};

/**
 * Validate a request object against the model
 * @param {Object} request - Request object to validate
 * @param {Boolean} strict - Whether to require all required fields
 * @returns {Object} - Validation result {valid: boolean, errors: array}
 */
function validateRequest(request, strict = false) {
    const errors = [];
    
    // Check required fields when in strict mode
    if (strict) {
        for (const [field, schema] of Object.entries(RequestModel)) {
            if (schema.required && (request[field] === undefined || request[field] === null)) {
                errors.push(`Missing required field: ${field}`);
            }
        }
    }
    
    // Validate provided fields match expected types and constraints
    for (const [field, value] of Object.entries(request)) {
        const schema = RequestModel[field];
        
        // Skip validation for fields not in the model (allowing extra fields)
        if (!schema) continue;
        
        // Validate field type
        if (schema.type === 'string' && typeof value !== 'string') {
            errors.push(`Field ${field} should be a string`);
        }
        else if (schema.type === 'number' && typeof value !== 'number') {
            errors.push(`Field ${field} should be a number`);
        }
        else if (schema.type === 'boolean' && typeof value !== 'boolean') {
            errors.push(`Field ${field} should be a boolean`);
        }
        else if (schema.type === 'array' && !Array.isArray(value)) {
            errors.push(`Field ${field} should be an array`);
        }
        else if (schema.type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
            errors.push(`Field ${field} should be an object`);
        }
        
        // Validate enum values
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`Field ${field} should be one of: ${schema.enum.join(', ')}`);
        }
        
        // Validate string constraints
        if (schema.type === 'string' && typeof value === 'string') {
            if (schema.maxLength && value.length > schema.maxLength) {
                errors.push(`Field ${field} exceeds maximum length of ${schema.maxLength}`);
            }
        }
        
        // Validate number constraints
        if (schema.type === 'number' && typeof value === 'number') {
            if (schema.min !== undefined && value < schema.min) {
                errors.push(`Field ${field} should be at least ${schema.min}`);
            }
            if (schema.max !== undefined && value > schema.max) {
                errors.push(`Field ${field} should be at most ${schema.max}`);
            }
        }
        
        // Validate nested objects (basic support)
        if (schema.type === 'object' && schema.properties && typeof value === 'object') {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                if (propSchema.required && (value[propName] === undefined || value[propName] === null)) {
                    errors.push(`Missing required nested field: ${field}.${propName}`);
                }
            }
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Create a new request with default values for missing fields
 * @param {Object} requestData - Partial request data
 * @returns {Object} - Complete request object with defaults
 */
function createRequest(requestData) {
    const request = { ...requestData };
    
    // Add defaults for missing required fields
    if (!request.id) {
        request.id = 'req-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
    
    if (!request.created_at) {
        request.created_at = new Date().toISOString();
    }
    
    if (!request.status) {
        request.status = 'pending';
    }
    
    if (!request.sync_status) {
        request.sync_status = 'synced';
    }
    
    if (!request.version) {
        request.version = 1;
    }
    
    // Validation (non-strict to allow partial data)
    const validation = validateRequest(request, false);
    
    // Log validation errors but still return the object
    if (!validation.valid) {
        console.warn('Request validation warnings:', validation.errors);
    }
    
    return request;
}

/**
 * Convert a legacy request object to the new model format
 * @param {Object} legacyRequest - Legacy request object
 * @returns {Object} - Request object in new model format
 */
function convertLegacyRequest(legacyRequest) {
    // Start with a copy of the legacy request
    const request = { ...legacyRequest };
    
    // Map legacy fields to new model fields if names differ
    // Example: if old model used 'lat' and 'lng' as direct properties
    if (request.lat !== undefined && request.lng !== undefined) {
        request.coordinates = {
            lat: request.lat,
            lng: request.lng
        };
        // Remove old fields to avoid duplication
        delete request.lat;
        delete request.lng;
    }
    
    // Add missing required fields with reasonable defaults
    if (!request.user_id && request.name) {
        // Create a deterministic user_id from name if missing
        request.user_id = 'legacy-user-' + request.name.replace(/\s+/g, '-').toLowerCase();
    }
    
    if (!request.estimated_weight && request.bags) {
        // Estimate weight based on bags (assuming average 5kg per bag)
        request.estimated_weight = request.bags * 5;
    }
    
    if (!request.type) {
        request.type = 'general'; // Default trash type
    }
    
    // Add timestamps if missing
    if (!request.created_at && request.timestamp) {
        request.created_at = request.timestamp;
    } else if (!request.created_at) {
        request.created_at = new Date().toISOString();
    }
    
    // Convert to the new format using createRequest to add other defaults
    return createRequest(request);
}

// Export the model and functions
window.RequestModel = RequestModel;
window.validateRequest = validateRequest;
window.createRequest = createRequest;
window.convertLegacyRequest = convertLegacyRequest;
