const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    function toSeconds(timeStr) {
        timeStr = timeStr.trim();
        let parts = timeStr.split(" ");
        let time = parts[0];
        let period = parts[1];
        let timeParts = time.split(":");
        let h = parseInt(timeParts[0]);
        let m = parseInt(timeParts[1]);
        let s = parseInt(timeParts[2]);

        if (period === "pm" && h !== 12) h += 12;
        if (period === "am" && h === 12) h = 0;

        return h * 3600 + m * 60 + s;
    }

    let start = toSeconds(startTime);
    let end = toSeconds(endTime);
    let diff = end - start;
    let hours = Math.floor(diff / 3600);
    let minutes = Math.floor((diff % 3600) / 60);
    let seconds = diff % 60;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;
    return hours + ":" + minutes + ":" + seconds;
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    function toSeconds(timeStr) {
        timeStr = timeStr.trim();
        let parts = timeStr.split(" ");
        let time = parts[0];
        let period = parts[1];
        let t = time.split(":");
        let h = parseInt(t[0]);
        let m = parseInt(t[1]);
        let s = parseInt(t[2]);
        if (period === "pm" && h !== 12) h += 12;
        if (period === "am" && h === 12) h = 0;
        return h * 3600 + m * 60 + s;
    }

    let deliveryStart = toSeconds("8:00:00 am");
    let deliveryEnd = toSeconds("10:00:00 pm");
    let start = toSeconds(startTime);
    let end = toSeconds(endTime);
    let idleBefore = Math.max(0, deliveryStart - start);
    let idleAfter = Math.max(0, end - deliveryEnd);
    let totalIdle = idleBefore + idleAfter;
    let hours = Math.floor(totalIdle / 3600);
    let minutes = Math.floor((totalIdle % 3600) / 60);
    let seconds = totalIdle % 60;

    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;

    return hours + ":" + minutes + ":" + seconds;
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {

    function toSeconds(timeStr) {
        let t = timeStr.split(":");
        let h = parseInt(t[0]);
        let m = parseInt(t[1]);
        let s = parseInt(t[2]);
        return h * 3600 + m * 60 + s;
    }

    function toHMS(seconds) {
        let h = Math.floor(seconds / 3600);
        let m = Math.floor((seconds % 3600) / 60);
        let s = seconds % 60;

        if (m < 10) m = "0" + m;
        if (s < 10) s = "0" + s;

        return h + ":" + m + ":" + s;
    }

    let shiftSec = toSeconds(shiftDuration);
    let idleSec = toSeconds(idleTime);
    let activeSec = shiftSec - idleSec;


    if (activeSec < 0) activeSec = 0;

    return toHMS(activeSec);
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {


    function toSeconds(timeStr) {
        let t = timeStr.split(":");
        let h = parseInt(t[0]);
        let m = parseInt(t[1]);
        let s = parseInt(t[2]);
        return h * 3600 + m * 60 + s;
    }

    let activeSec = toSeconds(activeTime);


    let eidStart = new Date("2025-04-10");
    let eidEnd = new Date("2025-04-30");
    let currDate = new Date(date);

    let quotaSec;

    if (currDate >= eidStart && currDate <= eidEnd) {
        quotaSec = 6 * 3600;
    } else {
        quotaSec = 8 * 3600 + 24 * 60;
    }

    return activeSec >= quotaSec;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    const fs = require("fs");
    let content = fs.readFileSync(textFile, "utf8").trim();
    let lines = [];
    if (content !== "") {
        lines = content.split("\n");
    }


    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(",");
        let existingID = parts[0].trim();
        let existingDate = parts[2].trim();
        if (existingID === shiftObj.driverID.trim() && existingDate === shiftObj.date.trim()) {
            return {};
        }
    }

    let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration, idleTime);
    let quotaMet = metQuota(shiftObj.date, activeTime);
    let hasBonus = false;

    let newObj = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: quotaMet,
        hasBonus: hasBonus
    };

    let newLine = [
        newObj.driverID,
        newObj.driverName,
        newObj.date,
        newObj.startTime,
        newObj.endTime,
        newObj.shiftDuration,
        newObj.idleTime,
        newObj.activeTime,
        newObj.metQuota,
        newObj.hasBonus
    ].join(",");
    let inserted = false;
    for (let i = lines.length - 1; i >= 0; i--) {
        let parts = lines[i].split(",");
        if (parts[0].trim() === shiftObj.driverID.trim()) {
            lines.splice(i + 1, 0, newLine);
            inserted = true;
            break;
        }
    }

    if (inserted === false) {
        lines.push(newLine);
    }
    fs.writeFileSync(textFile, lines.join("\n"), "utf8");
    return newObj;
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    const fs = require("fs");
    let content = fs.readFileSync(textFile, "utf8").trim();
    let lines = [];
    if (content !== "") {
        lines = content.split("\n");
    }
    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(",");
        if (parts[0].trim() === driverID.trim() && parts[2].trim() === date.trim()) {
            parts[9] = newValue;
            lines[i] = parts.join(",");
            break;
        }
    }
    fs.writeFileSync(textFile, lines.join("\n"), "utf8");
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    const fs = require("fs");
    let content = fs.readFileSync(textFile, "utf8").trim();
    if (content === "") return -1;
    let lines = content.split("\n");
    let count = 0;
    let driverExists = false;
    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(",");
        let id = parts[0].trim();
        let date = parts[2].trim();
        let bonus = parts[9].trim() === "true";
        if (id === driverID.trim()) {
            driverExists = true;
            let lineMonth = parseInt(date.split("-")[1], 10);
            if (lineMonth === parseInt(month, 10) && bonus === true) {
                count++;
            }
        }
    }
    if (driverExists === false) return -1;
    return count;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    const fs = require("fs");

    function toSeconds(timeStr) {
        let t = timeStr.split(":");
        let h = parseInt(t[0], 10);
        let m = parseInt(t[1], 10);
        let s = parseInt(t[2], 10);
        return h * 3600 + m * 60 + s;
    }

    function toHMS(seconds) {
        let h = Math.floor(seconds / 3600);
        let m = Math.floor((seconds % 3600) / 60);
        let s = seconds % 60;
        if (m < 10) m = "0" + m;
        if (s < 10) s = "0" + s;
        return h + ":" + m + ":" + s;
    }

    let content = fs.readFileSync(textFile, "utf8").trim();
    if (content === "") return "0:00:00";

    let lines = content.split("\n");
    let totalSec = 0;

    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(",");
        let id = parts[0].trim();
        let date = parts[2].trim();
        let active = parts[7].trim();

        if (id === driverID.trim()) {
            let lineMonth = parseInt(date.split("-")[1], 10);
            if (lineMonth === month) {
                totalSec += toSeconds(active);
            }
        }
    }

    return toHMS(totalSec);
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    const fs = require("fs");

    function toHMS(seconds) {
        let h = Math.floor(seconds / 3600);
        let m = Math.floor((seconds % 3600) / 60);
        let s = seconds % 60;
        if (m < 10) m = "0" + m;
        if (s < 10) s = "0" + s;
        return h + ":" + m + ":" + s;
    }

    let shiftsContent = fs.readFileSync(textFile, "utf8").trim();
    if (shiftsContent === "") return "0:00:00";
    let shifts = shiftsContent.split("\n");

    let ratesContent = fs.readFileSync(rateFile, "utf8").trim();
    let rates = ratesContent.split("\n");
    let dayOff = "";
    for (let i = 0; i < rates.length; i++) {
        let parts = rates[i].split(",");
        if (parts[0].trim() === driverID.trim()) {
            dayOff = parts[1].trim();
            break;
        }
    }

    let totalSeconds = 0;
    for (let i = 0; i < shifts.length; i++) {
        let parts = shifts[i].split(",");
        let id = parts[0].trim();
        let date = parts[2].trim();
        if (id !== driverID.trim()) continue;

        let lineMonth = parseInt(date.split("-")[1], 10);
        if (lineMonth !== month) continue;

        let dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
        if (dayName === dayOff) continue;

        let quota = 8 * 3600 + 24 * 60; 
        let checkDate = new Date(date);
        let eidStart = new Date("2025-04-10");
        let eidEnd = new Date("2025-04-30");
        if (checkDate >= eidStart && checkDate <= eidEnd) {
            quota = 6 * 3600;
        }

        totalSeconds += quota;
    }

    totalSeconds -= bonusCount * 2 * 3600;
    if (totalSeconds < 0) totalSeconds = 0;

    return toHMS(totalSeconds);
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    const fs = require("fs");

    function toSeconds(timeStr) {
        let t = timeStr.split(":");
        let h = parseInt(t[0], 10);
        let m = parseInt(t[1], 10);
        let s = parseInt(t[2], 10);
        return h * 3600 + m * 60 + s;
    }

    let ratesContent = fs.readFileSync(rateFile, "utf8").trim();
    let rates = ratesContent.split("\n");
    let basePay = 0;
    let tier = 4;

    for (let i = 0; i < rates.length; i++) {
        let parts = rates[i].split(",");
        if (parts[0].trim() === driverID.trim()) {
            basePay = parseInt(parts[2], 10);
            tier = parseInt(parts[3], 10);
            break;
        }
    }

    let allowedMissing = 0;
    if (tier === 1) allowedMissing = 50;
    if (tier === 2) allowedMissing = 20;
    if (tier === 3) allowedMissing = 10;
    if (tier === 4) allowedMissing = 3;

    let actualSec = toSeconds(actualHours);
    let requiredSec = toSeconds(requiredHours);
    let missingSec = requiredSec - actualSec;
    if (missingSec <= 0) return basePay;

    let missingHours = Math.floor(missingSec / 3600) - allowedMissing;
    if (missingHours <= 0) return basePay;

    let deductionRate = Math.floor(basePay / 185);
    let salaryDeduction = missingHours * deductionRate;

    let netPay = basePay - salaryDeduction;
    return netPay;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
