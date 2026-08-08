export function flattenObject(obj, prefix = '', result = {}) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (value === null || value === undefined) {
                result[newKey] = value;
            } else if (Array.isArray(value)) {
                // Handle arrays
                value.forEach((item, index) => {
                    const arrayKey = `${newKey}[${index}]`;
                    if (typeof item === 'object' && item !== null) {
                        flattenObject(item, arrayKey, result);
                    } else {
                        result[arrayKey] = item;
                    }
                });
            } else if (typeof value === 'object') {
                // Recursively flatten nested objects
                flattenObject(value, newKey, result);
            } else {
                // Primitive values
                result[newKey] = value;
            }
        }
    }

    return result;
}