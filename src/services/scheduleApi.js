import {
  getEasternDateKey,
} from "../utils/dateTime";

const API_URL =
  process.env
    .EXPO_PUBLIC_SCHEDULE_API_URL;

export async function fetchSchedule(
  days = 7
) {
  if (!API_URL) {
    throw new Error(
      "EXPO_PUBLIC_SCHEDULE_API_URL is missing. Create a .env file in the project root and add your Apps Script web app URL."
    );
  }

  const start =
    getEasternDateKey(
      new Date()
    );

  const separator =
    API_URL.includes("?")
      ? "&"
      : "?";

  const url =
    `${API_URL}` +
    `${separator}` +
    `start=${encodeURIComponent(
      start
    )}` +
    `&days=${days}`;

  const response =
    await fetch(
      url,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Schedule API returned HTTP ${response.status}.`
    );
  }

  const payload =
    await response.json();

  if (
    !payload.ok
  ) {
    throw new Error(
      payload.error ||
        "The schedule API returned an error."
    );
  }

  return payload;
}