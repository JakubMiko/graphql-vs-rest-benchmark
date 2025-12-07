#!/usr/bin/env node
// Calculate standard deviation from k6 JSON export
// Usage: node scripts/calculate-stddev.js <json-file>

const fs = require('fs');
const readline = require('readline');

// Function to calculate the population standard deviation
// Uses N (not N-1) which is standard for performance testing tools (JMeter, Gatling, etc.)
// Note: For large N (>1000), difference between population (N) and sample (N-1) is negligible
function calculateStdDev(values) {
    if (values.length === 0) return 0;

    // Calculate the mean
    const mean = values.reduce((acc, val) => acc + val, 0) / values.length;

    // Calculate the population standard deviation
    // This describes the variability in THIS specific test run
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    return Math.sqrt(variance);
}

// Format duration (milliseconds)
function formatDuration(ms) {
    if (ms < 1) {
        return `${(ms * 1000).toFixed(2)}µs`;
    } else if (ms < 1000) {
        return `${ms.toFixed(2)}ms`;
    } else {
        return `${(ms / 1000).toFixed(2)}s`;
    }
}

// Main function - now using streaming instead of loading entire file
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: node calculate-stddev.js <json-file>');
        process.exit(1);
    }

    const jsonFile = args[0];

    // Metrics to collect
    const metricsData = {
        'http_req_duration': [],
        'http_req_waiting': [],
        'http_req_blocked': [],
        'http_req_connecting': [],
        'http_req_sending': [],
        'http_req_receiving': [],
        'iteration_duration': []
    };

    // Stream the file line by line to avoid memory issues with large files
    const fileStream = fs.createReadStream(jsonFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    // Process each line
    for await (const line of rl) {
        try {
            if (line.trim()) {
                const item = JSON.parse(line.trim());

                // Extract metric values
                if (item.type === 'Point' && item.metric && metricsData[item.metric] !== undefined) {
                    metricsData[item.metric].push(item.data.value);
                }
            }
        } catch (parseError) {
            // Skip invalid lines
        }
    }

    // Calculate and print statistics
    console.log('\n=== Standard Deviation Analysis ===\n');

    Object.keys(metricsData).forEach(metricName => {
        const values = metricsData[metricName];

        if (values.length > 0) {
            const stdDev = calculateStdDev(values);
            const mean = values.reduce((acc, val) => acc + val, 0) / values.length;

            console.log(`${metricName}:`);
            console.log(`  Mean: ${formatDuration(mean)}`);
            console.log(`  Std Dev: ${formatDuration(stdDev)}`);
            console.log(`  Sample count: ${values.length}`);
            console.log('');
        }
    });
}

// Run the script
main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
