export function parseLockerEntries(lockerNumber) {
  const text = String(lockerNumber || "").trim();

  if (!text) {
    return [];
  }

  return text.split(",").map(function (entry) {
    const trimmed = entry.trim();
    const match = trimmed.match(/^([A-Za-z0-9\-]+)(.*)$/);

    if (!match) {
      return {
        id: trimmed,
        rest: "",
      };
    }

    return {
      id: match[1],
      rest: match[2],
    };
  });
}
