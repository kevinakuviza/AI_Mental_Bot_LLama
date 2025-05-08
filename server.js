const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const moment = require("moment-timezone");
const fs = require("fs");
const csvParser = require("csv-parser");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Load CSV at server startup
let routineData = [];
fs.createReadStream("data/detailed_activities.csv")
  .pipe(csvParser())
  .on("data", (row) => {
    routineData.push(row);
  })
  .on("end", () => {
    console.log("Routine data loaded:", routineData.length, "activities");
  });

app.post("/api/plan", async (req, res) => {
  try {
    const { timezone = "UTC", profession, energy_level } = req.body;
    if (!profession || !energy_level) {
      return res.status(400).json({ error: "Missing profession or energy_level" });
    }

    const now = moment().tz(timezone);
    const selectedActivities = new Set();
    const finalPlan = [];

    for (let day = 0; day < 10; day++) {
      const dayActivities = [];
      const currentDay = now.clone().add(day, "days");
      const isWeekend = currentDay.day() === 6 || currentDay.day() === 0;

      // Filter based on profession and energy
      let dayPool = routineData.filter((act) => {
        const professionMatch = act["Profession Tags"]?.toLowerCase().includes(profession.toLowerCase());
        const energyMatch = act["Energy Level"]?.toLowerCase() === energy_level.toLowerCase();
        return professionMatch && energyMatch;
      });

      const goalsToday = new Set();
      const slots = 7 + Math.floor(Math.random() * 2); // 7 or 8 activities

      for (let i = 0; i < slots; i++) {
        const available = dayPool.filter((a) => {
          return !selectedActivities.has(a["Activity List"]) && !goalsToday.has(a["Goals"]);
        });

        if (available.length === 0) break;

        const randomIndex = Math.floor(Math.random() * available.length);
        const selected = available[randomIndex];

        dayActivities.push(selected["Activity List"]);
        selectedActivities.add(selected["Activity List"]);
        goalsToday.add(selected["Goals"]);
      }

      finalPlan.push({
        day: day + 1,
        type: isWeekend ? "Weekend" : "Weekday",
        activities: dayActivities,
      });
    }

    return res.json({ routine_plan: finalPlan });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
