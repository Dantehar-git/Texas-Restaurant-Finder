export function formatCuisine(cuisine) {
  if (!cuisine) return "";

  return cuisine
    .replace(/[_-]/g, " ") // replace _ and - with spaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
