const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const ncepTarget = 'https://opengeo.ncep.noaa.gov';
  const alertsTarget = 'https://api.weather.gov';

  const ncepProxyOptions = {
    target: ncepTarget,
    changeOrigin: true,
    secure: false,
    logLevel: 'info', // Added for cleaner, yet informative, logs
    pathRewrite: (path, req) => {
      const rewrittenPath = '/geoserver' + path;
      // Corrected log to use ncepProxyOptions.target
      console.log(`[HPM] PathRewrite: Original path (post-context) '${path}' to '${rewrittenPath}' for target '${ncepProxyOptions.target}'`);
      return rewrittenPath;
    },
    onProxyReq: (proxyReq, req, res) => {
      // Corrected log to use ncepProxyOptions.target
      console.log(`[HPM] PROXY REQ: Sending ${req.method} to ${ncepProxyOptions.target}${proxyReq.path} (Original URL: ${req.originalUrl || req.url})`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Corrected log to use ncepProxyOptions.target
      console.log(`[HPM] PROXY RES: Received ${proxyRes.statusCode} response from ${ncepProxyOptions.target}${proxyRes.req.path} (for ${req.originalUrl || req.url})`);
    },
    // Replaced onError for better error logging and client response
    onError: (err, req, res, target) => {
      const currentTarget = (target && target.href) ? target.href : (typeof target === 'string' ? target : ncepProxyOptions.target);
      console.error(`[HPM] PROXY ERROR: ${err.message} for ${req.originalUrl || req.url} targeting ${currentTarget}`);
      
      if (res && typeof res.writeHead === 'function' && !res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Proxy Error: Could not connect to target service.', 
          error: err.message 
        }));
      } else if (res && typeof res.end === 'function' && !res.writableEnded) {
        res.end(); // Fallback if headers already sent or cannot write a proper response
      }
    }
  };

  app.use(
    '/geoserver',
    createProxyMiddleware(ncepProxyOptions)
  );

  // Proxy for NWS Alerts API
  app.use(
    '/alerts_api', // For requests to fetch weather alerts
    createProxyMiddleware({
      target: alertsTarget, // Alerts API target
      changeOrigin: true,
      pathRewrite: {
        '^/alerts_api': '', // Remove /alerts_api prefix when forwarding
      },
      onProxyReq: (proxyReq, req, res) => {
        // If User-Agent was needed for alerts, it could be set here.
        // For now, only Accept header is being explicitly set.
        proxyReq.setHeader('Accept', 'application/geo+json');
      },
      // logLevel: 'debug', // Keep this off to use custom logger
      secure: false, // Adding secure: false for HTTPS targets if issues arise, though generally not needed for well-configured servers
    })
  );
};
