import {
  formatVietnamDateTime,
  formatVietnamFileTimestamp,
  generatePhotoLabelName,
} from "../src/utils/dateHelper";

describe("Vietnam Date Formatting & Photo Label Name Generator", () => {
  it("formats date to Vietnam display format (DD/MM/YYYY HH:mm:ss)", () => {
    // 2026-07-23T13:48:00.000Z in UTC is 2026-07-23T20:48:00+07:00 in Vietnam
    const utcDate = new Date("2026-07-23T13:48:00.000Z");
    const formatted = formatVietnamDateTime(utcDate);
    expect(formatted).toBe("23/07/2026 20:48:00");
  });

  it("formats date to Vietnam timestamp string for filenames (YYYYMMDD_HHmmss)", () => {
    const utcDate = new Date("2026-07-23T13:48:09.000Z");
    const formatted = formatVietnamFileTimestamp(utcDate);
    expect(formatted).toBe("20260723_204809");
  });

  it("generates photo label name based on cropType_growthStage_timestampVN_index", () => {
    const utcDate = new Date("2026-07-23T13:48:09.000Z");
    const label = generatePhotoLabelName("Cà chua", "flowering", 1, utcDate);
    expect(label).toBe("Cachua_flowering_20260723_204809_1.jpg");
  });

  it("handles Vietnamese diacritics in crop name cleanly for filenames", () => {
    const utcDate = new Date("2026-07-23T13:48:09.000Z");
    const label = generatePhotoLabelName(
      "Dưa leo / Bắp cải",
      "vegetative",
      2,
      utcDate,
    );
    expect(label).toBe("DualeoBapcai_vegetative_20260723_204809_2.jpg");
  });
});
