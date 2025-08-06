import { format, isValid } from "date-fns";

export function safeFormat(dateValue, pattern = "MMM d, HH:mm") {
  const date = new Date(dateValue);
  return isValid(date) ? format(date, pattern) : "Invalid date";
}
