export function formatDate(timestamp) {
  if (!timestamp) return "N/A";

  let date;
  try {
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === "number") {
      date =
        timestamp > 1000000000000
          ? new Date(timestamp)
          : new Date(timestamp * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      // Invalid date check
      throw new Error("Invalid Date object created");
    }

    const optionsDate = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata", // Set timezone to IST
    };

    const optionsTime = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // For AM/PM
      timeZone: "Asia/Kolkata", // Set timezone to IST
    };

    // Format date and time parts separately to achieve "DD Mon YYYY HH:MM:SS AM/PM"
    const formattedDate = new Intl.DateTimeFormat("en-GB", optionsDate)
      .format(date)
      .replace(/ /g, "-"); // Added replace to get DD-MMM-YYYY
    const formattedTime = new Intl.DateTimeFormat("en-US", optionsTime).format(
      date
    );

    return `${formattedDate} ${formattedTime}`;
  } catch (error) {
    console.error("Error formatting date:", error, timestamp);
    return "Invalid Date";
  }
}
