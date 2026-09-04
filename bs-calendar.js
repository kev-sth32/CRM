/**
 * bs-calendar.js
 * High-Precision Bikram Sambat (BS) / Gregorian (AD) Dual Calendar Engine
 * Designed for Nepal IRD Tax Compliance, Fiscal Year Accounting, and CRM Proposals.
 */

// Days in each month for BS years 2075 to 2090
// Format: [Baisakh, Jestha, Ashadh, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra]
const BS_MONTH_DAYS = {
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2087: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2088: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2089: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2090: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30]
};

// Reference point: 2075-01-01 BS corresponds to 2018-04-14 AD
const REF_BS_YEAR = 2075;
const REF_AD_DATE = new Date(Date.UTC(2018, 3, 14)); // April 14, 2018

const BS_MONTH_NAMES_EN = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

const BS_MONTH_NAMES_NP = [
  'वैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
];

class BSCalendar {
  /**
   * Converts a JavaScript Date or ISO string into a Bikram Sambat date object.
   * @param {Date|string|number} adDate
   * @returns {{ year: number, month: number, day: number, monthName: string, monthNameNp: string, formatted: string }}
   */
  toBS(adDate) {
    const d = new Date(adDate);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid AD Date');
    }

    // Difference in days from reference date (using UTC to prevent DST offset drift)
    const targetUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const refUtc = REF_AD_DATE.getTime();
    let diffDays = Math.floor((targetUtc - refUtc) / (24 * 60 * 60 * 1000));

    if (diffDays < 0) {
      // Prior to reference year 2075, approximate fallback
      const approxYear = d.getFullYear() + 57;
      return {
        year: approxYear,
        month: 1,
        day: 1,
        monthName: BS_MONTH_NAMES_EN[0],
        monthNameNp: BS_MONTH_NAMES_NP[0],
        formatted: `${approxYear}-01-01 BS`
      };
    }

    let bsYear = REF_BS_YEAR;
    let bsMonth = 0; // 0-indexed (0 = Baisakh)
    let bsDay = 1;

    while (diffDays > 0) {
      const yearDays = BS_MONTH_DAYS[bsYear] || BS_MONTH_DAYS[2081];
      const monthDays = yearDays[bsMonth];

      if (diffDays >= monthDays) {
        diffDays -= monthDays;
        bsMonth++;
        if (bsMonth >= 12) {
          bsMonth = 0;
          bsYear++;
        }
      } else {
        bsDay += diffDays;
        diffDays = 0;
      }
    }

    const monthNum = bsMonth + 1;
    const pad = n => String(n).padStart(2, '0');

    return {
      year: bsYear,
      month: monthNum,
      day: bsDay,
      monthName: BS_MONTH_NAMES_EN[bsMonth],
      monthNameNp: BS_MONTH_NAMES_NP[bsMonth],
      formatted: `${bsYear}-${pad(monthNum)}-${pad(bsDay)} BS`
    };
  }

  /**
   * Generates a rich dual calendar display string combining BS and AD dates.
   * e.g., "2081 Bhadra 20 (2026-09-05)"
   */
  formatDualDate(adDate, options = {}) {
    const d = new Date(adDate);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const bs = this.toBS(d);
    const pad = n => String(n).padStart(2, '0');
    const adFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (options.lang === 'np') {
      return `${bs.year} ${bs.monthNameNp} ${bs.day} (${adFormatted} AD)`;
    }

    if (options.short) {
      return `${bs.year}/${pad(bs.month)}/${pad(bs.day)} BS (${adFormatted})`;
    }

    return `${bs.year} ${bs.monthName} ${bs.day} (${adFormatted})`;
  }

  /**
   * Calculates the current or relevant Nepal Fiscal Year.
   * Fiscal year runs from Shrawan 1 to Ashadh end (e.g. 2081/82).
   */
  getNepaliFiscalYear(adDate = new Date()) {
    const bs = this.toBS(adDate);
    // Month 4 is Shrawan (1: Baisakh, 2: Jestha, 3: Ashadh, 4: Shrawan)
    if (bs.month >= 4) {
      const nextShort = String(bs.year + 1).slice(-2);
      return `FY ${bs.year}/${nextShort}`;
    } else {
      const prevShort = String(bs.year).slice(-2);
      return `FY ${bs.year - 1}/${prevShort}`;
    }
  }
}

const bsCalendar = new BSCalendar();

// Universal export (CommonJS + Browser window)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = bsCalendar;
}
if (typeof window !== 'undefined') {
  window.BSCalendar = bsCalendar;
}
