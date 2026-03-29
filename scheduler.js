const cron = require('node-cron');
const axios = require('axios');

/**
 * ISP Dashboard Traffic Logger Scheduler
 * 
 * This script runs in the background and triggers the /api/mikrotik/log-traffic 
 * endpoint every hour to capture usage snapshots.
 */

const API_URL = 'http://localhost:3000/api/mikrotik/log-traffic';

console.log('--- ISP Traffic Logger Service Started ---');
console.log(`Target: ${API_URL}`);
console.log('Schedule: Every hour (0 * * * *)');

// 1. Schedule the task (0 * * * * = at the start of every hour)
cron.schedule('0 * * * *', async () => {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] Initiating traffic snapshot...`);
    
    try {
        const response = await axios.post(API_URL);
        if (response.data.success) {
            console.log(`[${timestamp}] SUCCESS: Captured ${response.data.count} active sessions.`);
        } else {
            console.warn(`[${timestamp}] WARNING: API returned success=false.`, response.data);
        }
    } catch (error) {
        console.error(`[${timestamp}] ERROR: Failed to reach logger API.`, error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('>> Hint: Ensure your Next.js server is running on port 3000.');
        }
    }
});

// 2. Initial Run (Optional: uncomment if you want a snapshot immediately on start)
// console.log('Performing initial boot snapshot...');
// axios.post(API_URL).catch(e => console.error('Initial snapshot failed:', e.message));

console.log('Logger is now idle and waiting for the next scheduled interval.');
