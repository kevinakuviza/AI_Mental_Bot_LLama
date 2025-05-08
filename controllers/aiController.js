// app.js
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Load CSV data
let activityData = [];

function loadCSVData(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const cleaned = {};
        for (const key in data) {
          cleaned[key.trim()] = data[key]?.trim(); // trim whitespace in both keys and values
        }
        results.push(cleaned);
      })      
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

// Load data and start server
loadCSVData('detailed_activities.csv')
  .then(data => {
    activityData = data;
    console.log('CSV loaded successfully.');

    // Start server after data is loaded
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to load CSV:', err);
  });

// Endpoint to handle user queries
app.post('/query', async (req, res) => {
  const userQuery = req.body.query;

  const prompt = `SYSTEM: You are an AI assistant that suggests ADHD-friendly productivity activities based on a user's needs.\nUSER: Suggest an ADHD-friendly activity from the following list based on the query: "${userQuery}".\n\n` +
    activityData.map((item, i) => `Activity ${i + 1}: ${item["Activity List"]} — ${item.Description}`).join("\n") +
    `\n\nRespond in JSON format with fields: suggested_activity, description, reasoning.`;
console.log(prompt);
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3",
      prompt,
      stream: false,
    });

    const output = response.data.response;
    const jsonStart = output.indexOf('{');
    const jsonString = output.slice(jsonStart);
    const parsed = JSON.parse(jsonString);
    res.json(parsed);
  } catch (error) {
    console.error('LLaMA API call failed:', error.message);
    res.status(500).json({ error: 'LLaMA API call failed', details: error.message });
  }
});