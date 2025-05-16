// Contact Form Script for Echoes of Today

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar elements
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarToggleContainer = document.getElementById('sidebarToggleContainer');
    const sidebarToggleIcon = sidebarToggle ? sidebarToggle.querySelector('.sidebar-toggle-icon') : null;
    
    // Section dropdowns
    const navDropdown = document.getElementById('navDropdown');
    const accountDropdown = document.getElementById('accountDropdown');
    const helpDropdown = document.getElementById('helpDropdown');
    
    // Sections
    const navSection = document.getElementById('navSection');
    const accountSection = document.getElementById('accountSection');
    const helpSection = document.getElementById('helpSection');
    
    // Form elements
    const contactForm = document.querySelector('.contact-form');
    
    // API Base URL - using the one defined in config.js
    const API_ENDPOINT = API_BASE_URL + '/api';
    
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
    
    // Initialize sidebar state and toggle icon
    function initSidebar() {
        // Check for saved sidebar state
        const sidebarHidden = localStorage.getItem('sidebarHidden') === 'true';
        
        if (sidebarHidden) {
            sidebar.classList.add('sidebar-hidden');
            mainContent.classList.add('main-content-expanded');
            sidebarToggleContainer.style.left = '0';
            updateToggleIcon(true);
        } else {
            updateToggleIcon(false);
        }
    }
    
    // Function to update the toggle icon between hamburger and X
    function updateToggleIcon(isSidebarHidden) {
        if (!sidebarToggleIcon) return;
        
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
        if (!navSection || !accountSection || !helpSection) return;
        
        // Default all sections to be visible
        [navSection, accountSection, helpSection].forEach(section => {
            section.style.maxHeight = section.scrollHeight + 'px';
            section.style.opacity = '1';
            section.style.visibility = 'visible';
            section.style.overflow = 'hidden';
            section.style.transition = 'all 0.3s ease';
        });
    }
    
    // Add event listeners for sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    if (navDropdown) {
        navDropdown.addEventListener('click', () => toggleSection(navDropdown, navSection));
    }
    
    if (accountDropdown) {
        accountDropdown.addEventListener('click', () => toggleSection(accountDropdown, accountSection));
    }
    
    if (helpDropdown) {
        helpDropdown.addEventListener('click', () => toggleSection(helpDropdown, helpSection));
    }
    
    // Form validation and submission
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const subjectSelect = document.getElementById('subject');
            const messageInput = document.getElementById('message');
            
            // Validation
            let isValid = true;
            
            if (nameInput.value.trim() === '') {
                showError(nameInput, 'Please enter your name');
                isValid = false;
            } else {
                removeError(nameInput);
            }
            
            if (emailInput.value.trim() === '') {
                showError(emailInput, 'Please enter your email');
                isValid = false;
            } else if (!isValidEmail(emailInput.value)) {
                showError(emailInput, 'Please enter a valid email address');
                isValid = false;
            } else {
                removeError(emailInput);
            }
            
            if (messageInput.value.trim() === '') {
                showError(messageInput, 'Please enter your message');
                isValid = false;
            } else {
                removeError(messageInput);
            }
            
            if (isValid) {
                // Show loading state
                const submitButton = contactForm.querySelector('.submit-button');
                const originalButtonText = submitButton.innerHTML;
                submitButton.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>';
                submitButton.disabled = true;
                
                // Simulate form submission (replace with actual AJAX call)
                setTimeout(() => {
                    // Reset form
                    contactForm.reset();
                    
                    // Show success message
                    showSuccessMessage();
                    
                    // Reset button
                    submitButton.innerHTML = originalButtonText;
                    submitButton.disabled = false;
                }, 1500);
            }
        });
    }
    
    // Function to validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Function to show error message
    function showError(input, message) {
        const formGroup = input.parentElement;
        let errorElement = formGroup.querySelector('.error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        input.classList.add('is-invalid');
    }
    
    // Function to remove error message
    function removeError(input) {
        const formGroup = input.parentElement;
        const errorElement = formGroup.querySelector('.error-message');
        
        if (errorElement) {
            formGroup.removeChild(errorElement);
        }
        
        input.classList.remove('is-invalid');
    }
    
    // Function to show success message
    function showSuccessMessage() {
        const formContainer = document.querySelector('.form-container');
        const existingMessage = document.querySelector('.success-message');
        
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create success message element
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = '<strong>Thank you!</strong> Your message has been sent successfully. We\'ll get back to you shortly.';
        
        // Insert before the form
        formContainer.insertBefore(successMessage, contactForm);
        
        // Scroll to the success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove the message after 5 seconds
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.style.opacity = '0';
                successMessage.style.transform = 'translateY(-20px)';
                successMessage.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                
                setTimeout(() => {
                    if (successMessage.parentNode) {
                        successMessage.parentNode.removeChild(successMessage);
                    }
                }, 500);
            }
        }, 5000);
    }
    
    // Add animation to elements
    function animateElements() {
        // Animate contact info cards
        const infoCards = document.querySelectorAll('.contact-info-card');
        infoCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * (index + 1));
        });
        
        // Animate form container
        const formContainer = document.querySelector('.contact-form-container');
        if (formContainer) {
            formContainer.style.opacity = '0';
            formContainer.style.transform = 'translateY(20px)';
            formContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                formContainer.style.opacity = '1';
                formContainer.style.transform = 'translateY(0)';
            }, 400);
        }
        
        // Animate FAQ items
        const faqItems = document.querySelectorAll('.accordion-item');
        faqItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 800 + (100 * index));
        });
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
    
    // Initialize the page
    initSidebar();
    initSections();
    animateElements();
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (sidebar && !sidebar.classList.contains('sidebar-hidden') && sidebarToggleContainer) {
            const sidebarWidth = getComputedStyle(sidebar).width;
            sidebarToggleContainer.style.left = sidebarWidth;
        }
    });
});