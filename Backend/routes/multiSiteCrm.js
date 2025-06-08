const express = require('express');
const axios = require('axios');
const router = express.Router();

const WEBSITES_CONFIG = [
  {
    id: 'easyflightsbook',
    name: 'EasyFlightsBook',
    baseUrl: 'https://api.easyflightsbook.com/api',
    endpoints: {
      getUserDetails: '/bookFlight/userDetails',
      deleteBooking: '/bookFlight'
    },
    active: true
  },
  {
    id: 'airticketspot',
    name: 'AirticketSpot',
    baseUrl: 'https://api.airticketspot.com/api',
    endpoints: {
      getUserDetails: '/bookFlight/userDetails',
      deleteBooking: '/bookFlight'
    },
    active: true
  },
  {
    id: 'easyflightnow',
    name: 'EasyFlightNow',
    baseUrl: 'https://api.easyflightnow.com/api',
    endpoints: {
      getUserDetails: '/bookFlight/userDetails',
      deleteBooking: '/bookFlight'
    },
    active: true
  },
];

// Helper function to fetch data from a single website
const fetchWebsiteData = async (website) => {
  try {
    const url = `${website.baseUrl}${website.endpoints.getUserDetails}`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    let data = response.data?.data || response.data || [];
    
    if (!Array.isArray(data)) {
      data = [];
    }

    const usersWithSource = data.map(user => ({
      ...user,
      websiteSource: {
        id: website.id,
        name: website.name,
        baseUrl: website.baseUrl
      }
    }));

    return {
      success: true,
      website: website.name,
      websiteId: website.id,
      count: usersWithSource.length,
      data: usersWithSource
    };

  } catch (error) {
    console.error(`Error fetching data from ${website.name}:`, error.message);
    
    return {
      success: false,
      website: website.name,
      websiteId: website.id,
      count: 0,
      data: [],
      error: error.message,
      status: error.response?.status || 'Connection Error'
    };
  }
};

// Route to get all flight users from all websites
router.get('/flight-users/all', async (req, res) => {
  try {
    const activeWebsites = WEBSITES_CONFIG.filter(site => site.active);
        
    // Fetch data from all websites concurrently
    const promises = activeWebsites.map(website => fetchWebsiteData(website));
    const results = await Promise.allSettled(promises);
    
    // Process results
    const websiteResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          website: activeWebsites[index].name,
          websiteId: activeWebsites[index].id,
          count: 0,
          data: [],
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // Combine all successful data
    const allUsers = [];
    const websiteSummary = [];
    
    websiteResults.forEach(result => {
      websiteSummary.push({
        website: result.website,
        websiteId: result.websiteId,
        success: result.success,
        count: result.count,
        error: result.error || null,
        status: result.status || null
      });
      
      if (result.success && result.data) {
        allUsers.push(...result.data);
      }
    });

    // Sort all users by creation date (newest first)
    allUsers.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

    res.json({
      success: true,
      totalUsers: allUsers.length,
      totalWebsites: activeWebsites.length,
      successfulWebsites: websiteSummary.filter(w => w.success).length,
      failedWebsites: websiteSummary.filter(w => !w.success).length,
      websiteSummary,
      data: allUsers,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /flight-users/all:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flight users from all websites',
      error: error.message
    });
  }
});

// Route to get flight users from a specific website
router.get('/flight-users/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const website = WEBSITES_CONFIG.find(site => site.id === websiteId && site.active);
    
    if (!website) {
      return res.status(404).json({
        success: false,
        message: `Website with ID '${websiteId}' not found or inactive`
      });
    }

    const result = await fetchWebsiteData(website);
    
    if (result.success) {
      res.json({
        success: true,
        website: result.website,
        websiteId: result.websiteId,
        count: result.count,
        data: result.data,
        fetchedAt: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        website: result.website,
        websiteId: result.websiteId,
        message: `Failed to fetch data from ${result.website}`,
        error: result.error,
        status: result.status
      });
    }

  } catch (error) {
    console.error(`Error fetching from specific website:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Route to delete a booking (requires websiteId and bookingId)
router.delete('/flight-users/:websiteId/:bookingId', async (req, res) => {
  try {
    const { websiteId, bookingId } = req.params;
    const website = WEBSITES_CONFIG.find(site => site.id === websiteId && site.active);
    
    if (!website) {
      return res.status(404).json({
        success: false,
        message: `Website with ID '${websiteId}' not found or inactive`
      });
    }

    const deleteUrl = `${website.baseUrl}${website.endpoints.deleteBooking}/${bookingId}`;
    console.log(`Deleting booking from ${website.name}: ${deleteUrl}`);

    await axios.delete(deleteUrl, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      }
    });

    res.json({
      success: true,
      message: `Booking deleted successfully from ${website.name}`,
      website: website.name,
      websiteId: website.id,
      bookingId: bookingId
    });

  } catch (error) {
    console.error('Error deleting booking:', error.message);
    
    const website = WEBSITES_CONFIG.find(site => site.id === req.params.websiteId);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: `Failed to delete booking from ${website?.name || 'website'}`,
      website: website?.name || 'Unknown',
      websiteId: req.params.websiteId,
      bookingId: req.params.bookingId,
      error: error.message,
      status: error.response?.status || 'Connection Error'
    });
  }
});

// Route to get available websites configuration
router.get('/websites/config', (req, res) => {
  const websitesInfo = WEBSITES_CONFIG.map(site => ({
    id: site.id,
    name: site.name,
    baseUrl: site.baseUrl,
    active: site.active
  }));

  res.json({
    success: true,
    totalWebsites: WEBSITES_CONFIG.length,
    activeWebsites: WEBSITES_CONFIG.filter(site => site.active).length,
    websites: websitesInfo
  });
});

// Route to update website status (activate/deactivate)
router.patch('/websites/:websiteId/status', (req, res) => {
  try {
    const { websiteId } = req.params;
    const { active } = req.body;
    
    const websiteIndex = WEBSITES_CONFIG.findIndex(site => site.id === websiteId);
    
    if (websiteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Website with ID '${websiteId}' not found`
      });
    }

    WEBSITES_CONFIG[websiteIndex].active = active;

    res.json({
      success: true,
      message: `Website ${WEBSITES_CONFIG[websiteIndex].name} ${active ? 'activated' : 'deactivated'}`,
      website: {
        id: WEBSITES_CONFIG[websiteIndex].id,
        name: WEBSITES_CONFIG[websiteIndex].name,
        active: WEBSITES_CONFIG[websiteIndex].active
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update website status',
      error: error.message
    });
  }
});

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Multi-site CRM API is running',
    timestamp: new Date().toISOString(),
    activeWebsites: WEBSITES_CONFIG.filter(site => site.active).length,
    totalWebsites: WEBSITES_CONFIG.length
  });
});

module.exports = router;