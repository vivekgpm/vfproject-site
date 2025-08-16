export function formatIndianPrice(num) {
  if (!num) return "0";
  const val = Math.round(num);
  const result = val.toString().split(".");
  const lastThree = result[0].substring(result[0].length - 3);
  const otherNumbers = result[0].substring(0, result[0].length - 3);
  const finalResult =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
    (otherNumbers ? "," : "") +
    lastThree;
  return finalResult;
}
