
function getParisDate() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
}

const now = getParisDate();
console.log("Paris Time:", now.toString());
console.log("Hours:", now.getHours());
console.log("Minutes:", now.getMinutes());

const currentHour = now.getHours();
const currentMinutes = now.getMinutes();

const minutesUntilNext = 60 - currentMinutes;
const msUntilNext = (minutesUntilNext * 60 * 1000) - (now.getSeconds() * 1000) - now.getMilliseconds();

console.log("Minutes until next:", minutesUntilNext);
console.log("MS until next:", msUntilNext);
