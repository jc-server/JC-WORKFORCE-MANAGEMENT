export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validateRequired(value) {
    return value !== null && value !== undefined && value.trim() !== '';
}

export function validateNumber(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

export function validateName(name) {
    return validateRequired(name) && name.length >= 2 && name.length <= 100;
}

export function validateDailyRate(rate) {
    return validateNumber(rate, 0, 10000);
}