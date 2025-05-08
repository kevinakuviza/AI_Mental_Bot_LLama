const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');

const results = [];

fs.createReadStream('detailed_activities.csv') // Make sure the filename is correct
  .pipe(csv())
  .on('data', (row) => {
    try {
      const routine = {
        activity: row['Activity List'] || '',
        bgColor: row['bgColor'] || '',
        goals: row['Goals']?.split(',').map(g => g.trim()) || [],
        timeOfDay: row['Time_of_Day'] || '',
        title: row['Title'] || '',
        description: row['Description'] || '',
        profession_tags: row['Profession Tags']?.split(',').map(tag => tag.trim()) || [],
        adhd_effectiveness_score: parseInt(row['ADHD_Effectiveness_Score']) || 0,
        recommendation: row['Recommendation'] || '',
        difficulty_level: row['Difficulty_Level'] || '',
        recommended_day_range: row['Recommended Day Range'] || '',
        energy_level: row['Energy Level'] || ''
      };

      results.push(routine);
    } catch (err) {
      console.error('❌ Error parsing row:', err.message);
    }
  })
  .on('end', async () => {
    console.log(`✅ Parsed ${results.length} routines. Beginning upload...`);

    for (const routine of results) {
      try {
        const res = await axios.post('http://localhost:3000/api/routine', routine);
        console.log(`✅ Uploaded:
