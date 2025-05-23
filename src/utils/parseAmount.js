// utils/parseAmount.js

function parseAmount(input, maxAmount) {
    if (!input || typeof input !== "string") return 0;
  
    const str = input.trim().toLowerCase();
  
    if (str === "all") return parseInt(maxAmount);
    if (str === "half") return Math.floor(maxAmount / 2);
  
    if (str.endsWith("%")) {
      const percent = parseFloat(str.slice(0, -1));
      if (isNaN(percent) || percent <= 0 || percent > 100) return 0;
      return Math.floor((percent / 100) * maxAmount);
    }
  
    // Handle shorthand like 1.5k, 2m, 3b
    const match = str.match(/^([\d.,]+)([kmbt])?$/);
    if (!match) return 0;
  
    let [_, numberStr, suffix] = match;
    let num = parseFloat(numberStr.replace(/,/g, ""));
    if (isNaN(num)) return 0;
  
    switch ((suffix || "").toLowerCase()) {
      case "k": num *= 1e3; break;
      case "m": num *= 1e6; break;
      case "b": num *= 1e9; break;
      case "t": num *= 1e12; break;
    }
  
    return Math.floor(num);
  }
  
  function isValidAmount(amount, maxAmount) {
    return Number.isFinite(amount) && amount > 0 && amount <= maxAmount;
  }
  
  function abbreviateNumber(number) {
    return number >= 1e12
      ? `${(number / 1e12).toFixed(2)}T`
      : number >= 1e9
      ? `${(number / 1e9).toFixed(2)}B`
      : number >= 1e6
      ? `${(number / 1e6).toFixed(2)}M`
      : number >= 1e3
      ? `${(number / 1e3).toFixed(2)}K`
      : number.toString();
  }
  
  module.exports = {
    parseAmount,
    isValidAmount,
    abbreviateNumber,
  };
  