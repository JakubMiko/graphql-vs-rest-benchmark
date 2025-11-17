// k6/summary.js
// Custom summary handler to include http_req_waiting metric

export function handleSummary(data) {
  // Build custom summary including http_req_waiting
  let customSummary = '\n';
  customSummary += '  █ THRESHOLDS \n\n';

  // Show threshold results
  for (const name in data.metrics) {
    const metric = data.metrics[name];
    if (metric.thresholds) {
      customSummary += `    ${name}\n`;
      for (const thresholdName in metric.thresholds) {
        const threshold = metric.thresholds[thresholdName];
        const symbol = threshold.ok ? '✓' : '✗';
        customSummary += `    ${symbol} '${thresholdName}' ${name}=${formatValue(metric, thresholdName)}\n`;
      }
      customSummary += '\n';
    }
  }

  customSummary += '\n  █ TOTAL RESULTS \n\n';

  // Checks
  if (data.metrics.checks) {
    const checks = data.metrics.checks;
    customSummary += `    checks_total.......................: ${checks.values.passes + checks.values.fails}   ${(checks.values.passes + checks.values.fails) / (data.state.testRunDurationMs / 1000)}/s\n`;
    customSummary += `    checks_succeeded...................: ${((checks.values.passes / (checks.values.passes + checks.values.fails)) * 100).toFixed(2)}% ${checks.values.passes} out of ${checks.values.passes + checks.values.fails}\n`;
    customSummary += `    checks_failed......................: ${((checks.values.fails / (checks.values.passes + checks.values.fails)) * 100).toFixed(2)}% ${checks.values.fails} out of ${checks.values.passes + checks.values.fails}\n\n`;
  }

  // List individual checks
  for (const name in data.metrics) {
    if (name.startsWith('✓ ') || name.startsWith('✗ ')) {
      customSummary += `    ${name}\n`;
    }
  }

  customSummary += '\n    HTTP\n';

  // http_req_duration
  if (data.metrics.http_req_duration) {
    const metric = data.metrics.http_req_duration;
    customSummary += `    http_req_duration.......................................................: `;
    customSummary += `avg=${formatDuration(metric.values.avg)} `;
    customSummary += `min=${formatDuration(metric.values.min)} `;
    customSummary += `med=${formatDuration(metric.values.med)} `;
    customSummary += `max=${formatDuration(metric.values.max)} `;
    customSummary += `p(90)=${formatDuration(metric.values['p(90)'])} `;
    customSummary += `p(95)=${formatDuration(metric.values['p(95)'])}\n`;
  }

  // HTTP Request Timing Breakdown
  customSummary += '\n    HTTP Request Timing Breakdown:\n';

  // http_req_blocked - Time waiting for available connection
  if (data.metrics.http_req_blocked) {
    const metric = data.metrics.http_req_blocked;
    customSummary += `    http_req_blocked (waiting for connection)...............................: `;
    customSummary += `avg=${formatDuration(metric.values.avg)} `;
    customSummary += `min=${formatDuration(metric.values.min)} `;
    customSummary += `med=${formatDuration(metric.values.med)} `;
    customSummary += `max=${formatDuration(metric.values.max)} `;
    customSummary += `p(90)=${formatDuration(metric.values['p(90)'])} `;
    customSummary += `p(95)=${formatDuration(metric.values['p(95)'])}\n`;
  }

  // http_req_connecting - TCP connection establishment
  if (data.metrics.http_req_connecting) {
    const metric = data.metrics.http_req_connecting;
    customSummary += `    http_req_connecting (TCP handshake).....................................: `;
    customSummary += `avg=${formatDuration(metric.values.avg)} `;
    customSummary += `min=${formatDuration(metric.values.min)} `;
    customSummary += `med=${formatDuration(metric.values.med)} `;
    customSummary += `max=${formatDuration(metric.values.max)} `;
    customSummary += `p(90)=${formatDuration(metric.values['p(90)'])} `;
    customSummary += `p(95)=${formatDuration(metric.values['p(95)'])}\n`;
  }

  // http_req_sending - Time sending HTTP request
  if (data.metrics.http_req_sending) {
    const metric = data.metrics.http_req_sending;
    customSummary += `    http_req_sending (request upload).......................................: `;
    customSummary += `avg=${formatDuration(metric.values.avg)} `;
    customSummary += `min=${formatDuration(metric.values.min)} `;
    customSummary += `med=${formatDuration(metric.values.med)} `;
    customSummary += `max=${formatDuration(metric.values.max)} `;
    customSummary += `p(90)=${formatDuration(metric.values['p(90)'])} `;
    customSummary += `p(95)=${formatDuration(metric.values['p(95)'])}\n`;
  }

  // http_req_waiting - Server processing time
  if (data.metrics.http_req_waiting) {
    const metric = data.metrics.http_req_waiting;
    customSummary += `    http_req_waiting (server processing)....................................: `;
    customSummary += `avg=${formatDuration(metric.values.avg)} `;
    customSummary += `min=${formatDuration(metric.values.min)} `;
    customSummary += `med=${formatDuration(metric.values.med)} `;
    customSummary += `max=${formatDuration(metric.values.max)} `;
    customSummary += `p(90)=${formatDuration(metric.values['p(90)'])} `;
    customSummary += `p(95)=${formatDuration(metric.values['p(95)'])}\n`;
  }

  // http_req_receiving - Time receiving HTTP response
  if (data.metrics.http_req_receiving) {
    const metric = data.metrics.http_req_receiving;
    customSummary += `    http_req_receiving (response download)..................................: `;
    customSummary += `avg=${formatDuration(metric.values.avg)} `;
    customSummary += `min=${formatDuration(metric.values.min)} `;
    customSummary += `med=${formatDuration(metric.values.med)} `;
    customSummary += `max=${formatDuration(metric.values.max)} `;
    customSummary += `p(90)=${formatDuration(metric.values['p(90)'])} `;
    customSummary += `p(95)=${formatDuration(metric.values['p(95)'])}\n`;
  }

  customSummary += '\n    HTTP Summary:\n';

  // http_req_failed
  if (data.metrics.http_req_failed) {
    const metric = data.metrics.http_req_failed;
    const totalReqs = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
    const failedReqs = Math.round(metric.values.rate * totalReqs);
    customSummary += `    http_req_failed.........................................................: ${(metric.values.rate * 100).toFixed(2)}%  ${failedReqs} out of ${totalReqs}\n`;
  }

  // http_reqs
  if (data.metrics.http_reqs) {
    const metric = data.metrics.http_reqs;
    customSummary += `    http_reqs...............................................................: ${metric.values.count}  ${(metric.values.count / (data.state.testRunDurationMs / 1000)).toFixed(6)}/s\n`;
  }

  customSummary += '\n    EXECUTION\n';

  // iteration_duration
  if (data.metrics.iteration_duration) {
    const metric = data.metrics.iteration_duration;
    customSummary += `    iteration_duration......................................................: `;
    customSummary += `avg=${formatDuration(metric.values.avg)} `;
    customSummary += `min=${formatDuration(metric.values.min)} `;
    customSummary += `med=${formatDuration(metric.values.med)} `;
    customSummary += `max=${formatDuration(metric.values.max)} `;
    customSummary += `p(90)=${formatDuration(metric.values['p(90)'])} `;
    customSummary += `p(95)=${formatDuration(metric.values['p(95)'])}\n`;
  }

  // iterations
  if (data.metrics.iterations) {
    const metric = data.metrics.iterations;
    customSummary += `    iterations..............................................................: ${metric.values.count}  ${(metric.values.count / (data.state.testRunDurationMs / 1000)).toFixed(6)}/s\n`;
  }

  // vus
  if (data.metrics.vus) {
    const metric = data.metrics.vus;
    customSummary += `    vus.....................................................................: ${metric.values.value}      min=${metric.values.min}          max=${metric.values.max}\n`;
  }

  // vus_max
  if (data.metrics.vus_max) {
    const metric = data.metrics.vus_max;
    customSummary += `    vus_max.................................................................: ${metric.values.value}     min=${metric.values.min}         max=${metric.values.max}\n`;
  }

  customSummary += '\n    NETWORK\n';

  // data_received
  if (data.metrics.data_received) {
    const metric = data.metrics.data_received;
    customSummary += `    data_received...........................................................: ${formatBytes(metric.values.count)} ${formatBytes(metric.values.rate)}/s\n`;
  }

  // data_sent
  if (data.metrics.data_sent) {
    const metric = data.metrics.data_sent;
    customSummary += `    data_sent...............................................................: ${formatBytes(metric.values.count)} ${formatBytes(metric.values.rate)}/s\n`;
  }

  customSummary += '\n\n';

  // Note: k6 will show the "running..." and "scenario ✓" lines automatically
  // so we don't include them here to avoid duplication

  customSummary += '============================================\n';
  customSummary += 'Test completed!\n';
  customSummary += '============================================\n';

  // Return our custom summary
  // k6 will show its default end-of-test status line first, then our custom summary
  return {
    'stdout': customSummary,
  };
}

// Helper functions
function formatDuration(ms) {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}µs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes.toFixed(0)} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} kB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

function formatValue(metric, thresholdName) {
  // Extract the metric name from threshold (e.g., "p(95)<500" -> use p(95) value)
  if (thresholdName.includes('p(95)')) {
    return formatDuration(metric.values['p(95)']);
  } else if (thresholdName.includes('rate')) {
    return `${(metric.values.rate * 100).toFixed(2)}%`;
  }
  return metric.values.value || metric.values.rate || '';
}
