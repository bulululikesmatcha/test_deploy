// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const toggleContainer = document.getElementById('sidebarToggleContainer');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarToggleIcon = sidebarToggle.querySelector('.sidebar-toggle-icon');
  
  // API Base URL - using the one defined in config.js
  const API_ENDPOINT = API_BASE_URL + '/api';
  
  // Load user profile information
  loadUserProfile();
  
  // Handle logout button
  const logoutButton = document.getElementById('logoutButton');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
  
  if (logoutButton) {
    logoutButton.addEventListener('click', function(e) {
      e.preventDefault();
      // Show logout modal using Bootstrap's modal API
      const logoutModal = new bootstrap.Modal(document.getElementById('logoutConfirmModal'));
      logoutModal.show();
    });
  }
  
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', function() {
      // Clear user session data
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      localStorage.removeItem('sidebarHidden');
      
      // Redirect to login page
      window.location.href = 'index.html';
    });
  }
  
  // Function to update the toggle icon between hamburger and X
  function updateToggleIcon(isSidebarHidden) {
    if (isSidebarHidden) {
      // Hamburger icon
      sidebarToggleIcon.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
      `;
    } else {
      // X icon
      sidebarToggleIcon.innerHTML = `
        <span style="transform: rotate(45deg); top: 6px;"></span>
        <span style="opacity: 0;"></span>
        <span style="transform: rotate(-45deg); top: 6px;"></span>
      `;
    }
  }
  
  // Initialize sidebar state
  function updateSidebarState() {
    const sidebarHidden = localStorage.getItem('sidebarHidden') === 'true';
    
    if (sidebarHidden || window.innerWidth <= 768) {
      sidebar.classList.add('sidebar-hidden');
      mainContent.classList.add('main-content-expanded');
      toggleContainer.style.left = '0';
      updateToggleIcon(true);
    } else {
      sidebar.classList.remove('sidebar-hidden');
      mainContent.classList.remove('main-content-expanded');
      toggleContainer.style.left = '250px';
      updateToggleIcon(false);
    }
  }
  
  // Initial setup
  updateSidebarState();
  
  // Toggle sidebar when the button is clicked
  sidebarToggle.addEventListener('click', function() {
    const isSidebarHidden = sidebar.classList.contains('sidebar-hidden');
    sidebar.classList.toggle('sidebar-hidden');
    mainContent.classList.toggle('main-content-expanded');
    
    if (sidebar.classList.contains('sidebar-hidden')) {
      toggleContainer.style.left = '0';
      updateToggleIcon(true);
    } else {
      toggleContainer.style.left = '250px';
      updateToggleIcon(false);
    }
    
    // Save sidebar state to localStorage
    localStorage.setItem('sidebarHidden', sidebar.classList.contains('sidebar-hidden'));
  });
  
  // Handle window resize events
  window.addEventListener('resize', updateSidebarState);
  
  // Section dropdown toggles
  const dropdownToggles = ['navDropdown', 'accountDropdown', 'helpDropdown'];
  const sections = ['navSection', 'accountSection', 'helpSection'];

  dropdownToggles.forEach((id, index) => {
    document.getElementById(id).addEventListener('click', function() {
      this.classList.toggle('up');
      const section = document.getElementById(sections[index]);
      section.style.display = section.style.display === 'none' ? 'block' : 'none';
    });
  });
  
  /**
   * Loads and displays the user profile information
   */
  function loadUserProfile() {
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');
    const userProfileSection = document.querySelector('.user-profile');
    
    if (!userNameElement || !userRoleElement) return;
    
    // Try to get user info from localStorage
    fetchUserInfo();
    
    // Make the profile section clickable - redirect to profile page
    if (userProfileSection) {
      userProfileSection.addEventListener('click', function() {
        window.location.href = 'profile.html';
      });
    }
    
    /**
     * Fetches user information and updates the display
     */
    function fetchUserInfo() {
      // Simulate loading delay
      userNameElement.textContent = 'Loading...';
      
      // Get user data from localStorage
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const userInfo = JSON.parse(userData).user;
          displayUserInfo(userInfo);
          fetchProfilePicture(userInfo.id);
        } catch (error) {
          console.error('Error parsing user data:', error);
          displayDefaultUserInfo();
        }
      } else {
        displayDefaultUserInfo();
      }
    }
    
    /**
     * Fetches profile picture from API or uses default
     */
    async function fetchProfilePicture(userId) {
      try {
        const response = await fetch(`${API_ENDPOINT}/profile-pictures/${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          updateProfileImage(data.imageUrl);
        } else {
          // If no profile picture found, keep the icon
          console.log('No profile picture found');
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    }
    
    /**
     * Updates the profile icon with the user's profile picture
     */
    function updateProfileImage(imageUrl) {
      if (!imageUrl) return;
      
      const profileIcon = document.querySelector('.user-profile i');
      if (profileIcon) {
        // Replace the icon with an image
        const parent = profileIcon.parentNode;
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Profile Picture';
        img.className = 'profile-image';
        
        parent.replaceChild(img, profileIcon);
      }
    }
    
    /**
     * Displays default user information when no data is available
     */
    function displayDefaultUserInfo() {
      userNameElement.textContent = 'Guest User';
      userRoleElement.textContent = 'Member';
    }
    
    /**
     * Displays user information in the sidebar profile section
     */
    function displayUserInfo(user) {
      if (userNameElement) {
        userNameElement.textContent = user.name;
      }
      
      if (userRoleElement) {
        userRoleElement.textContent = user.role || 'Member';
      }
    }
  }
});

// Simulate community data (this would typically come from an API or a database)
const communities = [
  { 
    name: 'Nature Lovers', 
    description: 'A community for people who enjoy exploring nature and sharing their outdoor experiences.', 
    rules: 'Be respectful, keep it peaceful, no inappropriate content.',
    members: 243
  },
  { 
    name: 'Tech Enthusiasts', 
    description: 'For those who are passionate about technology and want to discuss the latest innovations.', 
    rules: 'No spamming, stay on topic, be respectful of others\' opinions.',
    members: 187
  },
  { 
    name: 'Book Club', 
    description: 'A space for avid readers to discuss books, share recommendations, and analyze literary works.', 
    rules: 'No spoilers without warning, be kind to others, respect diverse opinions.',
    members: 112
  },
  {
    name: 'Mindful Journaling',
    description: 'A community focused on reflective and mindful journaling practices for personal growth.',
    rules: 'Be supportive, respect privacy, focus on constructive feedback.',
    members: 78
  }
];

// Function to display the community list
function displayCommunities() {
  const communityList = document.getElementById('communityList');
  communityList.innerHTML = '';

  communities.forEach(community => {
    const card = document.createElement('div');
    card.classList.add('community-card', 'col-lg-4', 'col-md-6', 'col-sm-12');
    card.innerHTML = `
      <h4>${community.name}</h4>
      <p>${community.description}</p>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <small>${community.members} members</small>
      </div>
      <button class="btn btn-primary" onclick="joinCommunity('${community.name}')">Join</button>
    `;
    communityList.appendChild(card);
  });
}

// Function to handle joining a community
function joinCommunity(name) {
  alert(`You have joined the ${name} community!`);
  // In a real app, you would send a request to the server here
}

// Handle the creation of a new community
document.addEventListener('DOMContentLoaded', function() {
  // Display initial communities
  displayCommunities();
  
  // Set up form submission handler
  document.getElementById('createCommunityForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const communityName = document.getElementById('communityName').value;
    const communityDescription = document.getElementById('communityDescription').value;
    const communityRules = document.getElementById('communityRules').value;

    if (communityName && communityDescription && communityRules) {
      const newCommunity = {
        name: communityName,
        description: communityDescription,
        rules: communityRules,
        members: 1 // Starting with yourself as the first member
      };

      // Simulate saving the new community (you would save this data to the server)
      communities.push(newCommunity);
      displayCommunities(); // Re-render the community list with the new community
      
      // Show success message
      alert('Community created successfully!');
      
      // Reset form fields
      document.getElementById('createCommunityForm').reset();
    } else {
      alert('Please fill in all fields to create a community!');
    }
  });
});

// Logout functionality removed - now handled by logout.js
