const m = 95412;
const n = 12395;

function returnDigits(number) {
    return Array.from(String(number), Number);
}

function calculateSum(number) {
    let digits = returnDigits(number);
    let sum = 0;
    for (let i = 0; i < digits.length; sum += digits[i++]);

    return sum;
}

let sumTotal = calculateSum(m) + calculateSum(n);
if (sumTotal === 41) {
    console.log("Skaiciu suma 41");
} else {
    console.log("Skaiciu suma buvo: " + sumTotal);
}