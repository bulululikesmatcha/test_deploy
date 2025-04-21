document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarToggleContainer = document.getElementById('sidebarToggleContainer');
  const sidebarToggleIcon = sidebarToggle.querySelector('.sidebar-toggle-icon');
  
  // Section dropdowns
  const navDropdown = document.getElementById('navDropdown');
  const accountDropdown = document.getElementById('accountDropdown');
  const helpDropdown = document.getElementById('helpDropdown');
  
  // Sections
  const navSection = document.getElementById('navSection');
  const accountSection = document.getElementById('accountSection');
  const helpSection = document.getElementById('helpSection');
  
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
  
  // Toggle sidebar function
  function toggleSidebar() {
    const isSidebarHidden = sidebar.classList.contains('sidebar-hidden');
    sidebar.classList.toggle('sidebar-hidden');
    mainContent.classList.toggle('main-content-expanded');
    
    // Update toggle button position
    if (sidebar.classList.contains('sidebar-hidden')) {
      sidebarToggleContainer.style.left = '0';
      localStorage.setItem('sidebarHidden', 'true');
      updateToggleIcon(true);
    } else {
      // Use actual sidebar width for responsive layouts
      const sidebarWidth = getComputedStyle(sidebar).width;
      sidebarToggleContainer.style.left = sidebarWidth;
      localStorage.setItem('sidebarHidden', 'false');
      updateToggleIcon(false);
    }
  }
  
  // Toggle sections function
  function toggleSection(dropdown, section) {
    dropdown.classList.toggle('up');
    
    // Use slideUp/slideDown effect
    if (dropdown.classList.contains('up')) {
      section.style.maxHeight = section.scrollHeight + 'px';
      section.style.opacity = '1';
      section.style.visibility = 'visible';
    } else {
      section.style.maxHeight = '0';
      section.style.opacity = '0';
      section.style.visibility = 'hidden';
    }
  }
  
  // Set initial section states
  function initSections() {
    // Default all sections to be visible
    [navSection, accountSection, helpSection].forEach(section => {
      section.style.maxHeight = section.scrollHeight + 'px';
      section.style.opacity = '1';
      section.style.visibility = 'visible';
      section.style.overflow = 'hidden';
      section.style.transition = 'all 0.3s ease';
    });
  }
  
  // Add event listeners
  sidebarToggle.addEventListener('click', toggleSidebar);
  
  navDropdown.addEventListener('click', () => toggleSection(navDropdown, navSection));
  accountDropdown.addEventListener('click', () => toggleSection(accountDropdown, accountSection));
  helpDropdown.addEventListener('click', () => toggleSection(helpDropdown, helpSection));
  
  // Logout button functionality
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to log out?')) {
        // Redirect to login page or perform logout
        window.location.href = 'login.html';
      }
    });
  }
  
  // Initialize sections
  initSections();
  
  // Handle window resize
  window.addEventListener('resize', function() {
    if (!sidebar.classList.contains('sidebar-hidden')) {
      const sidebarWidth = getComputedStyle(sidebar).width;
      sidebarToggleContainer.style.left = sidebarWidth;
    }
  });
});