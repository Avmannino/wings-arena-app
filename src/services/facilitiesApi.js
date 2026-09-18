const API_URL =
  process.env
    .EXPO_PUBLIC_SCHEDULE_API_URL;

const API_KEY =
  process.env
    .EXPO_PUBLIC_FACILITIES_KEY ||
  "";

function assertConfigured() {
  if (!API_URL) {
    throw new Error(
      "EXPO_PUBLIC_SCHEDULE_API_URL is missing."
    );
  }
}

async function readData(
  response
) {
  if (!response.ok) {
    throw new Error(
      `Facilities API returned HTTP ${response.status}.`
    );
  }

  const payload =
    await response.json();

  if (!payload.ok) {
    throw new Error(
      payload.error ||
        "The facilities API returned an error."
    );
  }

  if (
    !Array.isArray(
      payload.items
    )
  ) {
    throw new Error(
      "The facilities API is not set up yet."
    );
  }

  return {
    items:
      payload.items,

    inventory:
      payload.inventory ||
      {},
  };
}

export const SYNC_ENABLED =
  process.env
    .EXPO_PUBLIC_FACILITIES_SYNC ===
  "true";

export async function fetchFacilities() {
  assertConfigured();

  const separator =
    API_URL.includes("?")
      ? "&"
      : "?";

  const response =
    await fetch(
      `${API_URL}${separator}action=facilities&key=${encodeURIComponent(
        API_KEY
      )}`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
      }
    );

  return readData(
    response
  );
}

export async function sendFacilitiesOp(
  op
) {
  assertConfigured();

  const response =
    await fetch(
      API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "text/plain;charset=utf-8",
        },
        body: JSON.stringify(
          {
            ...op,
            key: API_KEY,
          }
        ),
      }
    );

  return readData(
    response
  );
}
