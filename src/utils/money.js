export function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { 
        maximumFractionDigits: 0,
        minimumFractionDigits: 0 
    });
}

export function parseCurrency(str) {
    const cleaned = str.replace(/[₹,]/g, '').trim();
    return parseFloat(cleaned) || 0;
}

export function validateAmount(amount) {
    return typeof amount === 'number' && amount >= 0 && !isNaN(amount);
}