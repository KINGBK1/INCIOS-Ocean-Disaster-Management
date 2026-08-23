// services/incoisScraper.js
import axios from "axios";
import * as cheerio from "cheerio";

const HWA_URL = "https://incois.gov.in/site/services/hwa.jsp";

export const fetchHWAData = async () => {
  try {
    const { data } = await axios.get(HWA_URL, { timeout: 15000 });
    const $ = cheerio.load(data);
    const threats = [];

    // Assume alerts are within <p> tags with "High Wave"
    $("p").each((_, elem) => {
      const text = $(elem).text().trim();
      if (text.includes("High Wave")) {
        threats.push(text);
      }
    });

    return threats;
  } catch (err) {
    console.error("Error scraping HWA:", err.message);
    return [];
  }
};
