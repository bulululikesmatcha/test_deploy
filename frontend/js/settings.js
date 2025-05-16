document.addEventListener('DOMContentLoaded', function() {
  // Sidebar elements
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarToggleContainer = document.getElementById('sidebarToggleContainer');
  const sidebarToggleIcon = sidebarToggle.querySelector('.sidebar-toggle-icon');
  
  // API Base URL - using the one defined in config.js
  const API_ENDPOINT = API_BASE_URL + '/api';
  
  // Check for saved sidebar state
  const sidebarHidden = localStorage.getItem('sidebarHidden') === 'true';
  
  // Initialize sidebar state based on saved preference
  if (sidebarHidden) {
    sidebar.classList.add('sidebar-hidden');
    mainContent.classList.add('main-content-expanded');
    sidebarToggleContainer.style.left = '0';
    updateToggleIcon(true);
  } else {
    updateToggleIcon(false);
  }
  
  // Function to update toggle icon appearance
  function updateToggleIcon(isHidden) {
    if (isHidden) {
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
  
  // Toggle sidebar state
  sidebarToggle.addEventListener('click', function() {
    const isSidebarHidden = sidebar.classList.contains('sidebar-hidden');
    sidebar.classList.toggle('sidebar-hidden');
    mainContent.classList.toggle('main-content-expanded');
    
    // Update toggle button position
    if (sidebar.classList.contains('sidebar-hidden')) {
      sidebarToggleContainer.style.left = '0';
    } else {
      sidebarToggleContainer.style.left = '250px';
    }
    
    // Save sidebar state to localStorage
    localStorage.setItem('sidebarHidden', sidebar.classList.contains('sidebar-hidden'));
    
    // Update toggle icon
    updateToggleIcon(!isSidebarHidden);
  });
  
  // Load user profile info
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

  // Dropdown functionality
  const dropdowns = document.querySelectorAll('.dropdown-icon');
  dropdowns.forEach(function(dropdown) {
    dropdown.addEventListener('click', function() {
      this.classList.toggle('up');
      const sectionId = this.id.replace('Dropdown', 'Section');
      const section = document.getElementById(sectionId);
      section.style.display = section.style.display === 'none' ? 'block' : 'none';
    });
  });

  // Form submission handlers
  const accountInfoForm = document.getElementById('accountInfoForm');
  accountInfoForm.addEventListener('submit', function(e) {
    e.preventDefault();
    // Simulate saving account info
    showNotification('Account information updated successfully!');
  });

  const passwordForm = document.getElementById('passwordForm');
  passwordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate input fields
    if (!currentPassword) {
      showNotification('Current password is required', 'error');
      return;
    }
    
    if (!newPassword) {
      showNotification('New password is required', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      showNotification('New password must be at least 6 characters', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match!', 'error');
      return;
    }
    
    // Get user info from localStorage
    const userData = localStorage.getItem('userData');
    if (!userData) {
      showNotification('User not logged in. Please log in again.', 'error');
      return;
    }
    
    const userInfo = JSON.parse(userData);
    const userId = userInfo.user.id;
    
    // Show loading state
    const submitBtn = passwordForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Updating...';
    submitBtn.disabled = true;
    
    // Update password in the database via API
    console.log(`Updating password for user ${userId}`);
    
    fetch(`${API_ENDPOINT}/users/${userId}/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Current password is incorrect');
        }
        return response.json().then(data => {
          throw new Error(data.message || 'Failed to update password');
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Password updated successfully:', data);
      
      // Clear the password fields
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
      
      // Show success message
      showNotification('Password updated successfully!');
    })
    .catch(error => {
      console.error('Error updating password:', error);
      showNotification(error.message || 'An error occurred. Please try again.', 'error');
    })
    .finally(() => {
      // Reset form button state
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    });
  });

  const preferencesForm = document.getElementById('preferencesForm');
  preferencesForm.addEventListener('submit', function(e) {
    e.preventDefault();
    // Simulate saving preferences
    showNotification('Preferences saved successfully!');
  });

  // Dark mode toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  darkModeToggle.addEventListener('change', function() {
    document.body.classList.toggle('dark-mode', this.checked);
    localStorage.setItem('darkMode', this.checked);
  });

  // Load user settings from localStorage
  function loadUserSettings() {
    // Check for dark mode preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    darkModeToggle.checked = isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    // Set privacy level
    const privacyLevel = document.getElementById('privacyLevel');
    if (privacyLevel) {
      privacyLevel.value = localStorage.getItem('privacyLevel') || 'private';
    }
    
    // Set email notifications
    const emailNotifications = document.getElementById('emailNotifications');
    if (emailNotifications) {
      emailNotifications.checked = localStorage.getItem('emailNotifications') === 'true';
    }
  }

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

  // Helper function to show notifications
  function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification`;
    notification.textContent = message;
    
    // Append to body
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }

  // Initialize
  loadUserSettings();
});