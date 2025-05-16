// Configuration file for API endpoints
const config = {
  // Get the base API URL based on environment
  getApiUrl: function() {
    // Check if we're on production (Render) or localhost
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    } else {
      // For production deployment, use relative URLs (same origin)
      return window.location.origin;
    }
  }
};

// Export a single API_BASE_URL constant
const API_BASE_URL = config.getApiUrl(); 