import { followUpWording, formatDate, formatDateTime, money, shortMoney } from "./format";

describe("money", () => {
  it("shows whole dollars with a symbol and commas", () => {
    expect(money(12500)).toBe("$12,500");
    expect(money(0)).toBe("$0");
    expect(money(342675.5)).toBe("$342,676");
  });
  it("shortens big figures", () => {
    expect(shortMoney(1_200_000)).toBe("$1.2M");
    expect(shortMoney(765_200)).toBe("$765K");
    expect(shortMoney(12_500)).toBe("$13K");
    expect(shortMoney(4_500)).toBe("$4.5K");
    expect(shortMoney(950)).toBe("$950");
    expect(shortMoney(2_000_000)).toBe("$2M");
  });
});

describe("dates", () => {
  it("formats a date", () => {
    expect(formatDate("2026-03-04")).toBe("Mar 4, 2026");
    expect(formatDate(null)).toBe("");
  });
  it("formats a date and time", () => {
    expect(formatDateTime("2026-03-04T14:15:00")).toBe("Mar 4, 2026, 2:15 PM");
    expect(formatDateTime("2026-03-04T09:05:00")).toBe("Mar 4, 2026, 9:05 AM");
  });
});

describe("follow-up wording", () => {
  const today = new Date(2026, 5, 15, 14, 30);
  it("says Today", () => expect(followUpWording("2026-06-15", today)).toBe("Today"));
  it("says how far ahead", () => {
    expect(followUpWording("2026-06-18", today)).toBe("in 3 days");
    expect(followUpWording("2026-06-16", today)).toBe("in 1 day");
  });
  it("says how overdue", () => {
    expect(followUpWording("2026-06-10", today)).toBe("5 days overdue");
    expect(followUpWording("2026-06-14", today)).toBe("1 day overdue");
  });
});
