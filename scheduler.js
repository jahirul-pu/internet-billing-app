const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

/**
 * ISP Dashboard Traffic & Uplink Logger Scheduler
 */

const SNAPSHOT_API = 'http://localhost:3000/api/mikrotik/log-traffic';
const UPLINK_API = 'http://localhost:3000/api/cron/uplink-logger';
const CRON_SECRET = process.env.CRON_SECRET || 'isp_billing_cron_2026';

console.log('--- ISP Traffic & Uplink Logger Service Started ---');
console.log(`Traffic Target (1h): ${SNAPSHOT_API}`);
console.log(`Uplink Target (15m): ${UPLINK_API}`);

// 1. User Traffic Logger (Every hour)
cron.schedule('0 * * * *', async () => {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] Initiating user traffic snapshot...`);
    try {
        const response = await axios.post(SNAPSHOT_API);
        if (response.data.success) {
            console.log(`[${timestamp}] SUCCESS: Captured ${response.data.count} active sessions.`);
        }
    } catch (error) {
        console.error(`[${timestamp}] ERROR: User Traffic Snapshot failed.`, error.message);
    }
});

// 2. Core Uplink Logger (Every 15 minutes)
cron.schedule('*/15 * * * *', async () => {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] Initiating core uplink snapshot...`);
    try {
        const response = await axios.post(UPLINK_API, {}, {
            headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
        });
        if (response.data.success) {
            console.log(`[${timestamp}] SUCCESS: Logged VLANs: ${response.data.logged.join(', ')}.`);
        }
    } catch (error) {
        console.error(`[${timestamp}] ERROR: Core Uplink Snapshot failed.`, error.message);
    }
});

// Initial runs to verify & populate immediately on start
console.log('--- Performing initial boot snapshots ---');
axios.post(SNAPSHOT_API).catch(e => console.error('Initial user snapshot failed:', e.message));
axios.post(UPLINK_API, {}, { headers: { 'Authorization': `Bearer ${CRON_SECRET}` } })
    .catch(e => console.error('Initial uplink snapshot failed:', e.message));

console.log('--- Logger is now idle and waiting for the next scheduled interval ---');
