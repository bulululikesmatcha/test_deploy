document.addEventListener('DOMContentLoaded', function() {
    // API Base URL - using the one defined in config.js
    const API_ENDPOINT = API_BASE_URL + '/api';
    
    // Utility function to get creation date from MongoDB ObjectId or createdAt
    function getCreationDate(item) {
        // First try to use createdAt if it exists
        if (item.createdAt) {
            const date = new Date(item.createdAt);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Fall back to extracting timestamp from MongoDB ObjectId
        if (item._id && item._id.toString) {
            const objectId = item._id.toString();
            
            if (objectId.length >= 24) {
                // Extract timestamp from ObjectId hexadecimal string
                const timestampHex = objectId.substring(0, 8);
                const timestamp = parseInt(timestampHex, 16) * 1000; // Convert to milliseconds
                const objectIdDate = new Date(timestamp);
                
                if (!isNaN(objectIdDate.getTime())) {
                    return objectIdDate;
                }
            }
        }
        
        // If all else fails, use current date as a last resort
        return new Date();
    }
    
    // Check if user is logged in and is an admin
    function checkAdminAuth() {
        // Use localStorage for user data
        const userData = localStorage.getItem('userData');
        const sessionType = localStorage.getItem('currentSessionType');
        
        if (!userData) {
            // Redirect to login if not logged in
            window.location.href = 'login.html';
            return false;
        }
        
        try {
            const data = JSON.parse(userData);
            const user = data.user;
            
            // Special check for session type to avoid conflicts
            if (sessionType !== 'admin' || !user || (!user.isAdmin && user.role !== 'admin')) {
                // Redirect to home if not an admin
                alert('Access denied. Admin privileges required.');
                window.location.href = 'home.html';
                return false;
            }
            
            // Set admin name
            const adminName = document.getElementById('admin-name');
            if (adminName) {
                adminName.textContent = user.name || 'Administrator';
            }
            
            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            // Handle corrupted user data
            localStorage.removeItem('userData');
            localStorage.removeItem('currentSessionType');
            window.location.href = 'login.html';
            return false;
        }
    }
    
    // Handle tab cleanup on unload
    window.addEventListener('beforeunload', function() {
        // Get the tab ID from localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const data = JSON.parse(userData);
                if (data.tabId) {
                    // Remove tracking info for this tab from localStorage
                    localStorage.removeItem(`activeTab_${data.tabId}`);
                }
            } catch (error) {
                console.error('Error cleaning up tab data:', error);
            }
        }
    });
    
    // Listen for storage events to handle changes in other tabs
    window.addEventListener('storage', function(event) {
        if (event.key === 'userData' || event.key === 'currentSessionType') {
            const currentSessionType = localStorage.getItem('currentSessionType');
            
            // If session type changed to user or user data removed
            if (!event.newValue || currentSessionType !== 'admin') {
                console.log('Admin session ended or changed in another tab');
                
                // Redirect to appropriate page
                if (currentSessionType === 'user') {
                    alert('Your admin session has ended. Redirecting to user home.');
                    window.location.href = 'home.html';
                } else {
                    window.location.href = 'login.html';
                }
            }
        }
    });
    
    // Verify admin access on page load
    if (!checkAdminAuth()) return;
    
    // Menu item click handlers
    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    const sectionTitle = document.getElementById('section-title');

    // Show active section and update title
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active menu item
            menuItems.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            
            // Show active section
            const sectionId = this.getAttribute('data-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${sectionId}-section`).classList.add('active');
            
            // Update section title
            sectionTitle.textContent = this.querySelector('span').textContent;
            
            // Load data for the section
            if (sectionId === 'users') {
                loadUsers();
            } else if (sectionId === 'journals') {
                loadJournals();
            } else if (sectionId === 'dashboard') {
                loadDashboardStats();
            }
        });
    });

    // Load dashboard statistics
    async function loadDashboardStats() {
        try {
            // Fetch stats from the server
            document.getElementById('total-users').textContent = 'Loading...';
            document.getElementById('total-journals').textContent = 'Loading...';
            document.getElementById('user-reports').textContent = 'Loading...';
            
            // Fetch users count
            const usersResponse = await fetch(`${API_ENDPOINT}/users`);
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                document.getElementById('total-users').textContent = users.length;
                
                // Display recent users (last 5)
                const recentUsersList = document.getElementById('recent-users-list');
                if (recentUsersList) {
                    recentUsersList.innerHTML = '';
                    
                    // Sort users by join date (newest first) using our utility function
                    const sortedUsers = [...users].sort((a, b) => {
                        const dateA = getCreationDate(a);
                        const dateB = getCreationDate(b);
                        
                        if (dateA && dateB) {
                            return dateB.getTime() - dateA.getTime();
                        }
                        
                        if (dateA) return -1;
                        if (dateB) return 1;
                        
                        return 0;
                    });
                    
                    // Take only the first 5 users
                    const recentUsers = sortedUsers.slice(0, 5);
                    
                    if (recentUsers.length === 0) {
                        recentUsersList.innerHTML = '<tr><td colspan="4" class="text-center">No users found</td></tr>';
                    } else {
                        recentUsers.forEach(user => {
                            // Get the most accurate join date for this user
                            updateUserJoinDateForDashboard(user).then(joinDateDisplay => {
                                const row = document.createElement('tr');
                                
                                row.innerHTML = `
                                    <td>${user.name || 'Unnamed User'}</td>
                                    <td>${user.email || 'No Email'}</td>
                                    <td>${user.role || 'Member'}</td>
                                    <td>${joinDateDisplay}</td>
                                `;
                                recentUsersList.appendChild(row);
                            });
                        });
                    }
                }
            }
            
            // Fetch journals count
            const journalsResponse = await fetch(`${API_ENDPOINT}/admin/journals`);
            if (journalsResponse.ok) {
                const journals = await journalsResponse.json();
                document.getElementById('total-journals').textContent = journals.length;
                
                // Display recent journals (last 5)
                const recentJournalsList = document.getElementById('recent-journals-list');
                if (recentJournalsList) {
                    recentJournalsList.innerHTML = '';
                    
                    // Sort journals by date (newest first) using our utility function
                    const sortedJournals = [...journals].sort((a, b) => {
                        const dateA = getCreationDate(a);
                        const dateB = getCreationDate(b);
                        
                        if (dateA && dateB) {
                            return dateB.getTime() - dateA.getTime();
                        }
                        
                        if (dateA) return -1;
                        if (dateB) return 1;
                        
                        return 0;
                    });
                    
                    // Take only the first 5 journals
                    const recentJournals = sortedJournals.slice(0, 5);
                    
                    if (recentJournals.length === 0) {
                        recentJournalsList.innerHTML = '<tr><td colspan="3" class="text-center">No journals found</td></tr>';
                    } else {
                        recentJournals.forEach(journal => {
                            const row = document.createElement('tr');
                            
                            // Format date properly using our utility function
                            let dateDisplay = 'Not available';
                            const creationDate = getCreationDate(journal);
                            if (creationDate) {
                                dateDisplay = creationDate.toLocaleDateString();
                            }
                            
                            const author = journal.userId?.name || 'Unknown Author';
                            
                            row.innerHTML = `
                                <td>${journal.title || 'Untitled'}</td>
                                <td>${author}</td>
                                <td>${dateDisplay}</td>
                            `;
                            recentJournalsList.appendChild(row);
                        });
                    }
                }
            }
            
            // Fetch reports count - placeholder for now
            // In a real implementation, you would fetch actual reports from the server
            try {
                const statsResponse = await fetch(`${API_ENDPOINT}/admin/stats`);
                if (statsResponse.ok) {
                    const stats = await statsResponse.json();
                    document.getElementById('user-reports').textContent = stats.totalReports || '0 new reports';
                } else {
                    document.getElementById('user-reports').textContent = '0 new reports';
                }
            } catch (error) {
                console.error('Error fetching reports:', error);
                document.getElementById('user-reports').textContent = '0 new reports';
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            document.getElementById('total-users').textContent = 'Error';
            document.getElementById('total-journals').textContent = 'Error';
            document.getElementById('user-reports').textContent = 'Error';
        }
    }

    // Helper function for dashboard to get accurate join dates
    async function updateUserJoinDateForDashboard(user) {
        try {
            // First try to get the earliest journal date
            const earliestJournalDate = await getEarliestJournalDate(user._id);
            
            if (earliestJournalDate) {
                return earliestJournalDate.toLocaleDateString();
            }
            
            // Fall back to creation date from user object
            const creationDate = getCreationDate(user);
            if (creationDate) {
                return creationDate.toLocaleDateString();
            }
            
            // Last resort
            return 'Not available';
        } catch (error) {
            console.error('Error getting join date for dashboard:', error);
            return 'Not available';
        }
    }

    // Load users from API
    async function loadUsers() {
        const usersList = document.getElementById('users-list');
        if (!usersList) return;
        
        // Clear existing users
        usersList.innerHTML = '<tr><td colspan="5" class="text-center">Loading users...</td></tr>';
        
        try {
            const response = await fetch(`${API_ENDPOINT}/users`);
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            const users = await response.json();
            
            // Clear loading message
            usersList.innerHTML = '';
            
            if (users.length === 0) {
                usersList.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
                return;
            }
            
            // Populate users table
            users.forEach(user => {
                const row = document.createElement('tr');
                
                // Format the join date properly from the actual creation timestamp
                let joinDateDisplay = 'Not available';
                
                // Use our utility function to get the creation date
                const creationDate = getCreationDate(user);
                if (creationDate) {
                    joinDateDisplay = creationDate.toLocaleDateString();
                }
                
                row.innerHTML = `
                    <td>${user.name || 'Unnamed User'}</td>
                    <td>${user.email || 'No Email'}</td>
                    <td>${user.role || 'Member'}</td>
                    <td>${joinDateDisplay}</td>
                    <td>
                        <button class="action-btn view-btn" data-user-id="${user._id}"><i class="fas fa-eye"></i></button>
                        <button class="action-btn edit-btn" data-user-id="${user._id}" data-bs-toggle="modal" data-bs-target="#userFormModal"><i class="fas fa-pencil-alt"></i></button>
                        <button class="action-btn delete-btn" data-user-id="${user._id}" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
                
                // Store the original user object in the row's dataset 
                // so we can access it easily without another API call
                row.setAttribute('data-user-id', user._id);
                row.setAttribute('data-join-date', joinDateDisplay);
                
                usersList.appendChild(row);
            });
            
            // Add event listeners to action buttons
            addUserActionEventListeners();
            
            // Update join dates with more accurate data (from journals) where possible
            users.forEach(user => {
                const userRow = document.querySelector(`tr[data-user-id="${user._id}"]`);
                if (userRow) {
                    updateUserJoinDate(user._id, userRow).then(updated => {
                        if (updated) {
                            console.log(`Updated join date for user ${user._id}`);
                        }
                    });
                }
            });
            
            // Initialize sorting and filtering for users
            setupUserSortingAndFiltering();
            
        } catch (error) {
            console.error('Error loading users:', error);
            usersList.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading users. Please try again.</td></tr>';
        }
    }
    
    // Add event listeners to user action buttons
    function addUserActionEventListeners() {
        // View user details
        document.querySelectorAll('.view-btn[data-user-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                viewUserDetails(userId);
            });
        });
        
        // Edit user
        document.querySelectorAll('.edit-btn[data-user-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                editUser(userId);
            });
        });
        
        // Delete user
        document.querySelectorAll('.delete-btn[data-user-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const userName = this.closest('tr').cells[0].textContent;
                
                // Set up delete confirmation
                const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
                confirmDeleteBtn.setAttribute('data-type', 'user');
                confirmDeleteBtn.setAttribute('data-id', userId);
                
                // Update modal content
                const modalTitle = document.querySelector('#deleteConfirmModal .modal-title');
                const modalBody = document.querySelector('#deleteConfirmModal .modal-body h5');
                modalTitle.textContent = 'Delete User';
                modalBody.textContent = `Are you sure you want to delete user "${userName}"?`;
            });
        });
    }
    
    // View user details
    async function viewUserDetails(userId) {
        try {
            console.log('Viewing user details for ID:', userId);
            
            // Find the user row to get basic info
            const userRow = document.querySelector(`.view-btn[data-user-id="${userId}"]`).closest('tr');
            if (!userRow) {
                throw new Error('User row not found');
            }
            
            // Extract basic info from the row
            const userName = userRow.cells[0].textContent;
            const userEmail = userRow.cells[1].textContent;
            const userRole = userRow.cells[2].textContent;
            const joinDate = userRow.cells[3].textContent;
            
            // Set basic info in the modal
            document.getElementById('userDetailName').textContent = userName;
            document.getElementById('userDetailEmail').innerHTML = `<i class="fas fa-envelope me-2"></i>${userEmail}`;
            document.getElementById('userDetailRole').textContent = userRole;
            document.getElementById('userDetailJoinDate').textContent = joinDate;
            
            // Show the modal first so user sees something is happening
            const modal = new bootstrap.Modal(document.getElementById('userDetailModal'));
            modal.show();
            
            // Initialize the user detail edit button
            const userDetailEditBtn = document.getElementById('userDetailEditBtn');
            userDetailEditBtn.setAttribute('data-user-id', userId);
            
            // Remove any existing event listeners 
            userDetailEditBtn.replaceWith(userDetailEditBtn.cloneNode(true));
            
            // Get the fresh reference and add event listener
            document.getElementById('userDetailEditBtn').addEventListener('click', function() {
                // Close user detail modal
                const userDetailModal = bootstrap.Modal.getInstance(document.getElementById('userDetailModal'));
                userDetailModal.hide();
                
                // Open edit user modal with this user
                editUser(userId);
            });
            
            // Reset activity and journal count
            document.getElementById('userDetailActivity').innerHTML = `
                <div class="list-group-item text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-muted mt-2 mb-0">Loading user activity...</p>
                </div>
            `;
            document.getElementById('userDetailJournalCount').textContent = '...';
            
            // We don't have a specific endpoint to get user by ID, so we'll use the data from the table row
            // and create a user object that has the basic info we need
            const userData = {
                _id: userId,
                name: userName,
                email: userEmail,
                role: userRole
            };
            
            // Try to fetch user bio from the users API
            fetchUserBio(userId);
            
            // Fetch user's profile picture
            fetchUserProfilePicture(userId);
            
            // Fetch user's journals
            fetchUserJournals(userId);
            
            // Fetch user's activity
            fetchUserActivity(userId);
            
        } catch (error) {
            console.error('Error viewing user details:', error);
            alert(`Error loading user details: ${error.message}. Please try again.`);
        }
    }
    
    // Fetch user's bio information
    async function fetchUserBio(userId) {
        try {
            // First try getting user info from the users endpoint
            const response = await fetch(`${API_ENDPOINT}/users/${userId}`);
            if (response.ok) {
                const userData = await response.json();
                // Update bio information if available
                if (userData && userData.bio) {
                    document.getElementById('userDetailBio').textContent = userData.bio;
                } else {
                    // Check localStorage for user data
                    const storedUserData = localStorage.getItem('userData');
                    if (storedUserData) {
                        try {
                            const parsedData = JSON.parse(storedUserData);
                            if (parsedData.user && parsedData.user.id === userId && parsedData.user.bio) {
                                document.getElementById('userDetailBio').textContent = parsedData.user.bio;
                                return;
                            }
                        } catch (e) {
                            console.error('Error parsing stored user data:', e);
                        }
                    }
                    
                    // If no bio found in any source
                    document.getElementById('userDetailBio').textContent = 'No bio available.';
                }
            } else {
                // Try getting bio from profiles endpoint as fallback
                const profileResponse = await fetch(`${API_ENDPOINT}/profiles/${userId}`);
                if (profileResponse.ok) {
                    try {
                        const profileData = await profileResponse.json();
                        if (profileData && profileData.bio) {
                            document.getElementById('userDetailBio').textContent = profileData.bio;
                            return;
                        }
                    } catch (e) {
                        console.error('Error parsing profile data:', e);
                    }
                }
                document.getElementById('userDetailBio').textContent = 'Bio information not available.';
            }
        } catch (error) {
            console.error('Error fetching user bio:', error);
            document.getElementById('userDetailBio').textContent = 'Bio information not available.';
        }
    }
    
    // Fetch user's profile picture
    async function fetchUserProfilePicture(userId) {
        try {
            console.log('Fetching profile picture for user ID:', userId);
            const response = await fetch(`${API_ENDPOINT}/profile-pictures/${userId}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.imageUrl) {
                    document.getElementById('userDetailImage').src = data.imageUrl;
                    console.log('Profile picture loaded successfully');
                } else {
                    console.log('Profile picture data invalid or empty');
                    // Keep placeholder image
                }
            } else {
                console.log('No profile picture found, status:', response.status);
                // Keep placeholder image when no picture exists
            }
        } catch (error) {
            console.error('Error fetching profile picture:', error);
            // Keep placeholder image on error
        }
    }
    
    // Fetch user's journals
    async function fetchUserJournals(userId) {
        try {
            console.log('Fetching journals for user ID:', userId);
            const response = await fetch(`${API_ENDPOINT}/admin/journals/user/${userId}`);
            
            if (response.ok) {
                const journals = await response.json();
                console.log(`Found ${journals.length} journals for user`);
                
                // Update journal count
                document.getElementById('userDetailJournalCount').textContent = journals.length;
            } else {
                console.log('Error fetching journals, status:', response.status);
                document.getElementById('userDetailJournalCount').textContent = '0';
            }
        } catch (error) {
            console.error('Error fetching user journals:', error);
            document.getElementById('userDetailJournalCount').textContent = 'Error';
        }
    }
    
    // Fetch user's activity
    async function fetchUserActivity(userId) {
        try {
            console.log('Fetching activity for user ID:', userId);
            
            const activityContainer = document.getElementById('userDetailActivity');
            
            // Use the journals endpoint directly since the profile endpoint is returning HTML
            const journalsResponse = await fetch(`${API_ENDPOINT}/admin/journals/user/${userId}`);
            
            if (!journalsResponse.ok) {
                console.log('Failed to fetch journals, status:', journalsResponse.status);
                activityContainer.innerHTML = `
                    <div class="list-group-item text-center py-2">
                        <p class="text-muted mb-0">Could not load journal entries</p>
                    </div>
                `;
                return;
            }
            
            const journals = await journalsResponse.json();
            console.log('Journals fetched:', journals.length);
            
            if (journals.length > 0) {
                activityContainer.innerHTML = '';
                
                // Sort journals by creation date (newest first)
                journals.sort((a, b) => {
                    const dateA = getCreationDate(a);
                    const dateB = getCreationDate(b);
                    
                    if (dateA && dateB) {
                        return dateB.getTime() - dateA.getTime();
                    }
                    
                    return 0;
                });
                
                // Display only the 5 most recent journals
                const recentJournals = journals.slice(0, 5);
                
                recentJournals.forEach(journal => {
                    const date = getCreationDate(journal);
                    const formattedDate = date ? date.toLocaleDateString() : 'Unknown date';
                    const formattedTime = date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    
                    const activityItem = document.createElement('div');
                    activityItem.className = 'list-group-item py-2';
                    
                    activityItem.innerHTML = `
                        <div class="d-flex w-100 justify-content-between">
                            <small class="mb-0"><strong>Journal:</strong> "${journal.title || 'Untitled'}"</small>
                            <small class="text-muted">${formattedDate} ${formattedTime ? 'at ' + formattedTime : ''}</small>
                        </div>
                    `;
                    
                    activityContainer.appendChild(activityItem);
                });
            } else {
                activityContainer.innerHTML = `
                    <div class="list-group-item text-center py-2">
                        <p class="text-muted mb-0">No journal entries found</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error fetching user activity:', error);
            const activityContainer = document.getElementById('userDetailActivity');
            activityContainer.innerHTML = `
                <div class="list-group-item text-center py-2">
                    <p class="text-muted mb-0">Error loading activity: ${error.message}</p>
                </div>
            `;
        }
    }
    
    // Edit user
    async function editUser(userId) {
        try {
            // First, find the user in our existing data to avoid an extra API call
            const userRow = document.querySelector(`.edit-btn[data-user-id="${userId}"]`).closest('tr');
            if (!userRow) {
                throw new Error('User row not found');
            }
            
            const userData = {
                _id: userId,
                name: userRow.cells[0].textContent,
                email: userRow.cells[1].textContent,
                role: userRow.cells[2].textContent
            };
            
            // Update the form fields with the user data
            document.getElementById('userId').value = userData._id;
            document.getElementById('userName').value = userData.name;
            document.getElementById('userEmail').value = userData.email;
            document.getElementById('userRole').value = userData.role.toLowerCase();
            document.getElementById('userPassword').value = '';
            document.getElementById('userConfirmPassword').value = '';
            
            // Update modal title
            document.getElementById('userFormTitle').textContent = 'Edit User';
            
            // Show optional password field and confirm password field
            document.getElementById('passwordField').classList.remove('d-none');
            document.getElementById('confirmPasswordField').classList.remove('d-none');
            
            const passwordNote = document.querySelector('#passwordField small');
            passwordNote.textContent = 'Leave blank to keep current password';
            passwordNote.classList.remove('d-none');
            
            // Set the form mode to edit
            document.getElementById('userForm').setAttribute('data-mode', 'edit');
            
            // Show the modal if not already being shown
            const formModal = document.getElementById('userFormModal');
            const bsModal = bootstrap.Modal.getInstance(formModal);
            if (!bsModal) {
                const newModal = new bootstrap.Modal(formModal);
                newModal.show();
            }
            
        } catch (error) {
            console.error('Error setting up edit user form:', error);
            alert('Error preparing the edit form. Please try again.');
        }
    }
    
    // Check password match
    function checkPasswordMatch() {
        const password = document.getElementById('userPassword').value;
        const confirmPassword = document.getElementById('userConfirmPassword').value;
        
        if (password === '' && confirmPassword === '') {
            document.getElementById('confirmPasswordField').classList.remove('was-validated');
            return true;
        }
        
        if (password === confirmPassword) {
            document.getElementById('userConfirmPassword').classList.remove('is-invalid');
            document.getElementById('userConfirmPassword').classList.add('is-valid');
            return true;
        } else {
            document.getElementById('userConfirmPassword').classList.remove('is-valid');
            document.getElementById('userConfirmPassword').classList.add('is-invalid');
            return false;
        }
    }
    
    // Add event listeners for password fields
    document.getElementById('userPassword').addEventListener('input', checkPasswordMatch);
    document.getElementById('userConfirmPassword').addEventListener('input', checkPasswordMatch);
    
    // Add new user
    function addNewUser() {
        // Clear the form fields
        document.getElementById('userId').value = '';
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userRole').value = 'user';
        document.getElementById('userPassword').value = '';
        document.getElementById('userConfirmPassword').value = '';
        
        // Update modal title
        document.getElementById('userFormTitle').textContent = 'Add New User';
        
        // Show required password field and confirm password field
        document.getElementById('passwordField').classList.remove('d-none');
        document.getElementById('confirmPasswordField').classList.remove('d-none');
        
        const passwordNote = document.querySelector('#passwordField small');
        passwordNote.textContent = 'Password is required for new users';
        passwordNote.classList.remove('d-none');
        
        // Set the form mode to add
        document.getElementById('userForm').setAttribute('data-mode', 'add');
    }
    
    // Save user (create or update)
    async function saveUser() {
        const formMode = document.getElementById('userForm').getAttribute('data-mode');
        const userId = document.getElementById('userId').value;
        
        // Validate the password match first
        if (!checkPasswordMatch()) {
            alert('Passwords do not match. Please check and try again.');
            return;
        }
        
        // Validate form based on mode
        if (formMode === 'add' && !document.getElementById('userPassword').value) {
            alert('Password is required for new users');
            return;
        }
        
        // Create user data object based on form values
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            role: document.getElementById('userRole').value
        };
        
        const password = document.getElementById('userPassword').value;
        
        try {
            let response;
            let actionText = '';
            
            if (formMode === 'edit' && userId) {
                // Update existing user - handle with or without password change
                actionText = 'updating';
                
                if (password) {
                    // If password is provided, use the specific password update endpoint
                    response = await fetch(`${API_ENDPOINT}/users/${userId}/update-password`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            // Use a dummy current password that will be accepted by the backend
                            // Note: In a real application, this would be more secure
                            currentPassword: 'admin-override',
                            newPassword: password
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to update password');
                    }
                    
                    // If password update succeeds, update the other user information
                    response = await fetch(`${API_ENDPOINT}/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(userData)
                    });
                } else {
                    // Regular update without password change
                    response = await fetch(`${API_ENDPOINT}/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(userData)
                    });
                }
            } else {
                // Create new user - this endpoint expects a password
                if (!password) {
                    alert('Password is required for new users');
                    return;
                }
                
                actionText = 'creating';
                userData.password = password;
                
                // For creating a user, use the user API endpoint
                response = await fetch(`${API_ENDPOINT}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${actionText} user`);
            }
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('userFormModal'));
            modal.hide();
            
            // Show success message
            const successMessage = formMode === 'edit' ? 'User updated successfully!' : 'New user created successfully!';
            alert(successMessage);
            
            // Reload the users list
            loadUsers();
            // Refresh dashboard stats
            loadDashboardStats();
            
        } catch (error) {
            console.error('Error saving user:', error);
            alert(`Error ${formMode === 'edit' ? 'updating' : 'creating'} user: ${error.message}`);
        }
    }
    
    // Add User button click event
    document.getElementById('add-user-btn').addEventListener('click', function() {
        addNewUser();
        const modal = new bootstrap.Modal(document.getElementById('userFormModal'));
        modal.show();
    });
    
    // Save User button click event
    document.getElementById('saveUserBtn').addEventListener('click', function() {
        saveUser().then(() => {
            // Update dashboard after adding/editing a user
            loadDashboardStats();
        });
    });

    // Load journals from API
    async function loadJournals() {
        const journalsList = document.getElementById('journals-list');
        if (!journalsList) return;
        
        // Clear existing journals
        journalsList.innerHTML = '<tr><td colspan="5" class="text-center">Loading journals...</td></tr>';
        
        try {
            const response = await fetch(`${API_ENDPOINT}/admin/journals`);
            if (!response.ok) {
                throw new Error('Failed to fetch journals');
            }
            
            const journals = await response.json();
            
            // Clear loading message
            journalsList.innerHTML = '';
            
            if (journals.length === 0) {
                journalsList.innerHTML = '<tr><td colspan="5" class="text-center">No journals found</td></tr>';
                return;
            }
            
            // Populate journals table
            journals.forEach(journal => {
                const row = document.createElement('tr');
                
                // Format the date properly from the actual creation timestamp
                let dateDisplay = 'Not available';
                
                // Use our utility function to get the creation date
                const creationDate = getCreationDate(journal);
                if (creationDate) {
                    dateDisplay = creationDate.toLocaleDateString();
                }
                
                const author = journal.userId?.name || 'Unknown Author';
                
                row.innerHTML = `
                    <td>${journal.title || 'Untitled'}</td>
                    <td>${author}</td>
                    <td>${dateDisplay}</td>
                    <td><span class="badge bg-success">Published</span></td>
                    <td>
                        <button class="action-btn view-btn" data-journal-id="${journal._id}" data-bs-toggle="modal" data-bs-target="#journal-modal"><i class="fas fa-eye"></i></button>
                        <button class="action-btn delete-btn" data-journal-id="${journal._id}" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
                
                // Add data attributes for filtering
                row.setAttribute('data-journal-id', journal._id);
                row.setAttribute('data-journal-date', dateDisplay);
                
                // Check if journal has images
                const hasImages = journal.images && journal.images.length > 0;
                row.setAttribute('data-has-images', hasImages);
                
                journalsList.appendChild(row);
            });
            
            // Add event listeners to view and delete buttons
            addJournalActionEventListeners(journals);
            
            // Initialize sorting and filtering for journals
            setupJournalSortingAndFiltering();
            
        } catch (error) {
            console.error('Error loading journals:', error);
            journalsList.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading journals. Please try again.</td></tr>';
        }
    }
    
    // Add event listeners to journal action buttons
    function addJournalActionEventListeners(journals) {
        // View journal details
        document.querySelectorAll('.view-btn[data-journal-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const journalId = this.getAttribute('data-journal-id');
                const journal = journals.find(j => j._id === journalId);
                
                if (journal) {
                    document.getElementById('modal-title').textContent = journal.title || 'Untitled';
                    document.getElementById('modal-author').textContent = `By ${journal.userId?.name || 'Unknown Author'} • ${new Date(journal.createdAt).toLocaleDateString()}`;
                    document.getElementById('modal-content').innerHTML = `<p>${journal.content || 'No content'}</p>`;
                    
                    // Clear previous images
                    const imageContainer = document.getElementById('modal-images');
                    if (imageContainer) {
                        imageContainer.innerHTML = '<p>Loading images...</p>';
                    }
                    
                    // Fetch journal images
                    fetchJournalImages(journalId);
                }
            });
        });
        
        // Delete journal
        document.querySelectorAll('.delete-btn[data-journal-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const journalId = this.getAttribute('data-journal-id');
                const journalTitle = this.closest('tr').cells[0].textContent;
                
                // Set up delete confirmation
                const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
                confirmDeleteBtn.setAttribute('data-type', 'journal');
                confirmDeleteBtn.setAttribute('data-id', journalId);
                
                // Update modal content
                const modalTitle = document.querySelector('#deleteConfirmModal .modal-title');
                const modalBody = document.querySelector('#deleteConfirmModal .modal-body h5');
                modalTitle.textContent = 'Delete Journal';
                modalBody.textContent = `Are you sure you want to delete journal "${journalTitle}"?`;
            });
        });
    }
    
    // Fetch images for a journal
    async function fetchJournalImages(journalId) {
        try {
            const response = await fetch(`${API_ENDPOINT}/journal-images/journal/${journalId}?userId=admin`);
            
            const imageContainer = document.getElementById('modal-images');
            if (!imageContainer) return;
            
            if (response.ok) {
                const images = await response.json();
                
                if (images.length > 0) {
                    // Create image gallery
                    let imagesHTML = '<div class="journal-images-container">';
                    
                    images.forEach(image => {
                        imagesHTML += `
                            <div class="journal-image">
                                <img src="${image.imageUrl}" alt="${image.caption || 'Journal image'}" class="img-fluid">
                                ${image.caption ? `<p class="image-caption">${image.caption}</p>` : ''}
                            </div>
                        `;
                    });
                    
                    imagesHTML += '</div>';
                    imageContainer.innerHTML = imagesHTML;
                } else {
                    imageContainer.innerHTML = '<p>No images attached to this journal.</p>';
                }
            } else {
                // Handle error
                imageContainer.innerHTML = '<p>Unable to load journal images.</p>';
            }
        } catch (error) {
            console.error('Error fetching journal images:', error);
            const imageContainer = document.getElementById('modal-images');
            if (imageContainer) {
                imageContainer.innerHTML = '<p>Error loading images.</p>';
            }
        }
    }
    
    // Handle delete confirmation
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async function() {
            const type = this.getAttribute('data-type');
            const id = this.getAttribute('data-id');
            
            if (!type || !id) {
                alert('Error: Missing data for delete operation');
                return;
            }
            
            try {
                // Show loading state
                confirmDeleteBtn.disabled = true;
                confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                
                let endpoint = '';
                if (type === 'user') {
                    // Use the regular user endpoint for deletion
                    endpoint = `${API_ENDPOINT}/users/${id}`;
                } else if (type === 'journal') {
                    endpoint = `${API_ENDPOINT}/admin/journals/${id}`;
                }
                
                const response = await fetch(endpoint, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to delete ${type}`);
                }
                
                // Close modal and refresh data
                const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
                deleteModal.hide();
                
                // Refresh appropriate data
                if (type === 'user') {
                    loadUsers();
                } else if (type === 'journal') {
                    loadJournals();
                }
                
                // Refresh dashboard stats
                loadDashboardStats();
                
                // Show success message
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
                
            } catch (error) {
                console.error(`Error deleting ${type}:`, error);
                alert(`Error deleting ${type}: ${error.message}`);
            } finally {
                // Reset button state
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.innerHTML = '<i class="fas fa-trash-alt me-1"></i> Delete';
            }
        });
    }

    // User section search functionality
    const usersSectionSearch = document.getElementById('users-section-search');
    if (usersSectionSearch) {
        usersSectionSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#users-list tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Journal search functionality
    const journalsSectionSearch = document.getElementById('journals-section-search');
    if (journalsSectionSearch) {
        journalsSectionSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#journals-list tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Refresh Data button functionality
    const refreshDataBtn = document.getElementById('refreshData');
    if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Refresh all data
            loadDashboardStats();
            
            // If on users section, reload users
            if (document.getElementById('users-section').classList.contains('active')) {
                loadUsers();
            }
            
            // If on journals section, reload journals
            if (document.getElementById('journals-section').classList.contains('active')) {
                loadJournals();
            }
            
            // Show notification
            alert('Data refreshed successfully!');
        });
    }

    // Export Data button functionality
    const exportDataBtn = document.getElementById('exportData');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show export options modal
            showExportOptionsModal();
        });
    }
    
    // Logout button functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show confirmation
            if (confirm('Are you sure you want to logout?')) {
                // Get the tab ID from localStorage
                const userData = localStorage.getItem('userData');
                if (userData) {
                    try {
                        const data = JSON.parse(userData);
                        if (data.tabId) {
                            // Remove tracking info for this tab from localStorage
                            localStorage.removeItem(`activeTab_${data.tabId}`);
                        }
                    } catch (error) {
                        console.error('Error cleaning up tab data on logout:', error);
                    }
                }
                
                // Clear localStorage
                localStorage.removeItem('userData');
                localStorage.removeItem('currentSessionType');
                
                // Redirect to login page
                window.location.href = 'login.html';
            }
        });
    }
    
    // Add password toggle functionality
    document.querySelectorAll('.password-toggle').forEach(toggleBtn => {
        toggleBtn.addEventListener('click', function() {
            const passwordInput = this.closest('.input-group').querySelector('input');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                // Show password, display eye without slash
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                // Hide password, display eye with slash
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    });
    
    // Helper function to get the earliest journal date for a user
    async function getEarliestJournalDate(userId) {
        try {
            const response = await fetch(`${API_ENDPOINT}/admin/journals/user/${userId}`);
            if (!response.ok) {
                return null;
            }
            
            const journals = await response.json();
            if (!journals || journals.length === 0) {
                return null;
            }
            
            // Find the earliest journal date
            let earliestDate = null;
            journals.forEach(journal => {
                const journalDate = getCreationDate(journal);
                if (journalDate && (!earliestDate || journalDate < earliestDate)) {
                    earliestDate = journalDate;
                }
            });
            
            return earliestDate;
        } catch (error) {
            console.error('Error fetching earliest journal date:', error);
            return null;
        }
    }
    
    // Update user row with more accurate join date based on journal data
    async function updateUserJoinDate(userId, rowElement) {
        try {
            // First try to get the earliest journal date
            const earliestJournalDate = await getEarliestJournalDate(userId);
            
            if (earliestJournalDate) {
                const dateCell = rowElement.cells[3]; // The join date cell
                const newJoinDate = earliestJournalDate.toLocaleDateString();
                dateCell.textContent = newJoinDate;
                rowElement.setAttribute('data-join-date', newJoinDate);
                return true;
            } else {
                // If no journals, ensure there's still a date from ObjectId
                const dateCell = rowElement.cells[3]; // The join date cell
                if (dateCell.textContent === 'Not available') {
                    // Use a timestamp from the user's ID if available
                    const date = new Date();
                    const newJoinDate = date.toLocaleDateString();
                    dateCell.textContent = newJoinDate;
                    rowElement.setAttribute('data-join-date', newJoinDate);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error updating join date:', error);
            return false;
        }
    }
    
    // Function to show export options modal
    function showExportOptionsModal() {
        // Create the modal if it doesn't exist
        if (!document.getElementById('exportOptionsModal')) {
            const modalHTML = `
                <div class="modal fade" id="exportOptionsModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header py-2">
                                <h5 class="modal-title">Export Data</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body py-3">
                                <p class="text-muted small mb-3">Select the data you want to export:</p>
                                <div class="d-grid gap-2">
                                    <button id="exportUsersBtn" class="btn btn-outline-primary">
                                        <i class="fas fa-users me-2"></i>Export Users Data
                                    </button>
                                    <button id="exportJournalsBtn" class="btn btn-outline-primary">
                                        <i class="fas fa-book me-2"></i>Export Journals Data
                                    </button>
                                    <button id="exportAllBtn" class="btn btn-outline-primary">
                                        <i class="fas fa-download me-2"></i>Export All Data
                                    </button>
                                </div>
                            </div>
                            <div class="modal-footer py-2">
                                <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listeners to export buttons
            document.getElementById('exportUsersBtn').addEventListener('click', function() {
                exportData('users');
            });
            
            document.getElementById('exportJournalsBtn').addEventListener('click', function() {
                exportData('journals');
            });
            
            document.getElementById('exportAllBtn').addEventListener('click', function() {
                exportData('all');
            });
        }
        
        // Show the modal
        const exportModal = new bootstrap.Modal(document.getElementById('exportOptionsModal'));
        exportModal.show();
    }

    // Function to export data
    async function exportData(format = 'json', type = 'all') {
        try {
            console.log(`Exporting ${type} data in ${format} format...`);
            
            let allUsersData = [];
            let allJournalsData = [];
            
            // Get data based on type
            if (type === 'users' || type === 'all') {
                const usersResponseData = await fetch(`${API_ENDPOINT}/users`);
                if (!usersResponseData.ok) throw new Error('Failed to fetch users data');
                const users = await usersResponseData.json();
                allUsersData = users;
            }
            
            if (type === 'journals' || type === 'all') {
                const journalsResponseData = await fetch(`${API_ENDPOINT}/admin/journals`);
                if (!journalsResponseData.ok) throw new Error('Failed to fetch journals data');
                const journals = await journalsResponseData.json();
                allJournalsData = journals;
            }
            
            let filename = '';
            let data = [];
            
            if (type === 'users' || type === 'all') {
                data.users = allUsersData;
                filename = `echoes_users_export_${formatDateForFilename(new Date())}.json`;
            }
            
            if (type === 'journals' || type === 'all') {
                data.journals = allJournalsData;
                filename = `echoes_journals_export_${formatDateForFilename(new Date())}.json`;
            }
            
            if (type === 'all') {
                data.users = allUsersData;
                data.journals = allJournalsData;
                filename = `echoes_complete_export_${formatDateForFilename(new Date())}.json`;
            }
            
            // Convert data to JSON
            const jsonData = JSON.stringify(data, null, 2);
            
            // Create and download file
            downloadFile(jsonData, filename, 'application/json');
            
            // Close the modal
            const exportModal = bootstrap.Modal.getInstance(document.getElementById('exportOptionsModal'));
            exportModal.hide();
            
            // Show success notification
            alert(`Data exported successfully as ${filename}`);
            
        } catch (error) {
            console.error('Error exporting data:', error);
            alert(`Error exporting data: ${error.message}`);
        }
    }

    // Helper function to format date for filename
    function formatDateForFilename(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // Helper function to download file
    function downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // Add sorting and filtering functionality for user management
    function setupUserSortingAndFiltering() {
        // Cache DOM elements
        const userTable = document.getElementById('users-table');
        const usersList = document.getElementById('users-list');
        const sortableHeaders = userTable.querySelectorAll('th.sortable');
        const sortDropdownItems = document.querySelectorAll('.sort-users');
        const userFilterAll = document.getElementById('userFilterAll');
        const userFilterAdmin = document.getElementById('userFilterAdmin');
        const userFilterRegular = document.getElementById('userFilterRegular');
        const userJoinDateFilter = document.getElementById('userJoinDateFilter');
        const clearUserDateFilter = document.getElementById('clearUserDateFilter');
        
        // Current sort state
        let currentSort = {
            column: null,
            direction: null
        };
        
        // Active filters
        let activeFilters = {
            role: null,
            joinDate: null
        };
        
        // Add event listeners to sortable headers
        sortableHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const column = this.dataset.sort;
                const direction = currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc';
                
                // Update sort icons
                sortableHeaders.forEach(h => {
                    h.querySelector('i').className = 'fas fa-sort ms-1 text-muted small';
                });
                
                this.querySelector('i').className = `fas fa-sort-${direction === 'asc' ? 'up' : 'down'} ms-1 text-primary small active`;
                
                // Sort the table
                sortUserTable(column, direction);
                
                // Update current sort state
                currentSort.column = column;
                currentSort.direction = direction;
            });
        });
        
        // Add event listeners to sort dropdown items
        sortDropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                const sortInfo = this.dataset.sort.split('-');
                const column = sortInfo[0];
                const direction = sortInfo[1];
                
                // Update current sort state
                currentSort.column = column;
                currentSort.direction = direction;
                
                // Sort the table
                sortUserTable(column, direction);
                
                // Update the dropdown button text
                document.getElementById('userSortDropdown').innerHTML = `<i class="fas fa-sort me-1"></i>Sorted by ${this.textContent}`;
            });
        });
        
        // Role filter buttons
        userFilterAll.addEventListener('click', function() {
            this.classList.add('filter-active');
            userFilterAdmin.classList.remove('filter-active');
            userFilterRegular.classList.remove('filter-active');
            activeFilters.role = null;
            applyUserFilters();
        });
        
        userFilterAdmin.addEventListener('click', function() {
            this.classList.add('filter-active');
            userFilterAll.classList.remove('filter-active');
            userFilterRegular.classList.remove('filter-active');
            activeFilters.role = 'admin';
            applyUserFilters();
        });
        
        userFilterRegular.addEventListener('click', function() {
            this.classList.add('filter-active');
            userFilterAll.classList.remove('filter-active');
            userFilterAdmin.classList.remove('filter-active');
            activeFilters.role = 'user';
            applyUserFilters();
        });
        
        // Date filter
        userJoinDateFilter.addEventListener('change', function() {
            activeFilters.joinDate = this.value ? new Date(this.value) : null;
            applyUserFilters();
        });
        
        clearUserDateFilter.addEventListener('click', function() {
            userJoinDateFilter.value = '';
            activeFilters.joinDate = null;
            applyUserFilters();
        });
        
        // Set default active filter
        userFilterAll.classList.add('filter-active');
        
        // Function to sort user table
        function sortUserTable(column, direction) {
            const rows = Array.from(usersList.querySelectorAll('tr'));
            
            // Sort rows based on column and direction
            const sortedRows = rows.sort((a, b) => {
                let aValue, bValue;
                
                if (column === 'name') {
                    aValue = a.cells[0].textContent.trim().toLowerCase();
                    bValue = b.cells[0].textContent.trim().toLowerCase();
                } else if (column === 'email') {
                    aValue = a.cells[1].textContent.trim().toLowerCase();
                    bValue = b.cells[1].textContent.trim().toLowerCase();
                } else if (column === 'role') {
                    aValue = a.cells[2].textContent.trim().toLowerCase();
                    bValue = b.cells[2].textContent.trim().toLowerCase();
                } else if (column === 'joindate') {
                    // Use the data attribute which contains the formatted date
                    aValue = a.getAttribute('data-join-date');
                    bValue = b.getAttribute('data-join-date');
                    
                    // Try to convert to date objects for comparison
                    try {
                        aValue = new Date(aValue);
                        bValue = new Date(bValue);
                    } catch (e) {
                        console.error('Error parsing dates:', e);
                    }
                }
                
                // Compare the values
                if (direction === 'asc') {
                    if (aValue < bValue) return -1;
                    if (aValue > bValue) return 1;
                    return 0;
                } else {
                    if (aValue > bValue) return -1;
                    if (aValue < bValue) return 1;
                    return 0;
                }
            });
            
            // Reappend rows in sorted order
            usersList.innerHTML = '';
            sortedRows.forEach(row => {
                if (!row.classList.contains('filtered-out')) {
                    usersList.appendChild(row);
                }
            });
        }
        
        // Function to apply filters
        function applyUserFilters() {
            const rows = Array.from(usersList.querySelectorAll('tr'));
            
            rows.forEach(row => {
                let showRow = true;
                
                // Apply role filter
                if (activeFilters.role) {
                    const roleCell = row.cells[2];
                    const roleText = roleCell.textContent.trim().toLowerCase();
                    
                    if (roleText !== activeFilters.role) {
                        showRow = false;
                    }
                }
                
                // Apply date filter
                if (activeFilters.joinDate && showRow) {
                    const joinDateStr = row.getAttribute('data-join-date');
                    
                    try {
                        const joinDate = new Date(joinDateStr);
                        const filterDate = new Date(activeFilters.joinDate);
                        
                        // Set time to midnight for comparison
                        joinDate.setHours(0, 0, 0, 0);
                        filterDate.setHours(0, 0, 0, 0);
                        
                        if (joinDate.getTime() !== filterDate.getTime()) {
                            showRow = false;
                        }
                    } catch (e) {
                        console.error('Error parsing date for filtering:', e);
                    }
                }
                
                // Show or hide row
                if (showRow) {
                    row.classList.remove('filtered-out');
                    row.style.display = '';
                } else {
                    row.classList.add('filtered-out');
                    row.style.display = 'none';
                }
            });
            
            // Apply current sort
            if (currentSort.column) {
                sortUserTable(currentSort.column, currentSort.direction);
            }
        }
    }
    
    // Add sorting and filtering functionality for journal management
    function setupJournalSortingAndFiltering() {
        // Cache DOM elements
        const journalTable = document.getElementById('journals-table');
        const journalsList = document.getElementById('journals-list');
        const sortableHeaders = journalTable.querySelectorAll('th.sortable');
        const sortDropdownItems = document.querySelectorAll('.sort-journals');
        const journalFilterAll = document.getElementById('journalFilterAll');
        const journalFilterImages = document.getElementById('journalFilterImages');
        const journalFilterRecent = document.getElementById('journalFilterRecent');
        const journalDateFilter = document.getElementById('journalDateFilter');
        const clearJournalDateFilter = document.getElementById('clearJournalDateFilter');
        
        // Current sort state
        let currentSort = {
            column: null,
            direction: null
        };
        
        // Active filters
        let activeFilters = {
            type: null,
            date: null
        };
        
        // Add event listeners to sortable headers
        sortableHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const column = this.dataset.sort;
                const direction = currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc';
                
                // Update sort icons
                sortableHeaders.forEach(h => {
                    h.querySelector('i').className = 'fas fa-sort ms-1 text-muted small';
                });
                
                this.querySelector('i').className = `fas fa-sort-${direction === 'asc' ? 'up' : 'down'} ms-1 text-primary small active`;
                
                // Sort the table
                sortJournalTable(column, direction);
                
                // Update current sort state
                currentSort.column = column;
                currentSort.direction = direction;
            });
        });
        
        // Add event listeners to sort dropdown items
        sortDropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                const sortInfo = this.dataset.sort.split('-');
                const column = sortInfo[0];
                const direction = sortInfo[1];
                
                // Update current sort state
                currentSort.column = column;
                currentSort.direction = direction;
                
                // Sort the table
                sortJournalTable(column, direction);
                
                // Update the dropdown button text
                document.getElementById('journalSortDropdown').innerHTML = `<i class="fas fa-sort me-1"></i>Sorted by ${this.textContent}`;
            });
        });
        
        // Filter buttons
        journalFilterAll.addEventListener('click', function() {
            this.classList.add('filter-active');
            journalFilterImages.classList.remove('filter-active');
            journalFilterRecent.classList.remove('filter-active');
            activeFilters.type = null;
            applyJournalFilters();
        });
        
        journalFilterImages.addEventListener('click', function() {
            this.classList.add('filter-active');
            journalFilterAll.classList.remove('filter-active');
            journalFilterRecent.classList.remove('filter-active');
            activeFilters.type = 'images';
            applyJournalFilters();
        });
        
        journalFilterRecent.addEventListener('click', function() {
            this.classList.add('filter-active');
            journalFilterAll.classList.remove('filter-active');
            journalFilterImages.classList.remove('filter-active');
            activeFilters.type = 'recent';
            applyJournalFilters();
        });
        
        // Date filter
        journalDateFilter.addEventListener('change', function() {
            activeFilters.date = this.value ? new Date(this.value) : null;
            applyJournalFilters();
        });
        
        clearJournalDateFilter.addEventListener('click', function() {
            journalDateFilter.value = '';
            activeFilters.date = null;
            applyJournalFilters();
        });
        
        // Set default active filter
        journalFilterAll.classList.add('filter-active');
        
        // Function to sort journal table
        function sortJournalTable(column, direction) {
            const rows = Array.from(journalsList.querySelectorAll('tr'));
            
            // Sort rows based on column and direction
            const sortedRows = rows.sort((a, b) => {
                let aValue, bValue;
                
                if (column === 'title') {
                    aValue = a.cells[0].textContent.trim().toLowerCase();
                    bValue = b.cells[0].textContent.trim().toLowerCase();
                } else if (column === 'author') {
                    aValue = a.cells[1].textContent.trim().toLowerCase();
                    bValue = b.cells[1].textContent.trim().toLowerCase();
                } else if (column === 'date') {
                    // Try to convert displayed dates to date objects
                    try {
                        aValue = new Date(a.cells[2].textContent.trim());
                        bValue = new Date(b.cells[2].textContent.trim());
                    } catch (e) {
                        console.error('Error parsing dates:', e);
                        aValue = a.cells[2].textContent.trim();
                        bValue = b.cells[2].textContent.trim();
                    }
                }
                
                // Compare the values
                if (direction === 'asc') {
                    if (aValue < bValue) return -1;
                    if (aValue > bValue) return 1;
                    return 0;
                } else {
                    if (aValue > bValue) return -1;
                    if (aValue < bValue) return 1;
                    return 0;
                }
            });
            
            // Reappend rows in sorted order
            journalsList.innerHTML = '';
            sortedRows.forEach(row => {
                if (!row.classList.contains('filtered-out')) {
                    journalsList.appendChild(row);
                }
            });
        }
        
        // Function to apply filters
        function applyJournalFilters() {
            const rows = Array.from(journalsList.querySelectorAll('tr'));
            
            rows.forEach(row => {
                let showRow = true;
                
                // Apply type filter
                if (activeFilters.type) {
                    if (activeFilters.type === 'images') {
                        // Check if this journal has images (will need a data attribute or other indicator)
                        const hasImages = row.hasAttribute('data-has-images') && row.getAttribute('data-has-images') === 'true';
                        if (!hasImages) {
                            showRow = false;
                        }
                    } else if (activeFilters.type === 'recent') {
                        // Check if journal is within the last 7 days
                        try {
                            const dateStr = row.cells[2].textContent.trim();
                            const journalDate = new Date(dateStr);
                            const oneWeekAgo = new Date();
                            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                            
                            if (journalDate < oneWeekAgo) {
                                showRow = false;
                            }
                        } catch (e) {
                            console.error('Error checking recent date:', e);
                        }
                    }
                }
                
                // Apply date filter
                if (activeFilters.date && showRow) {
                    try {
                        const dateStr = row.cells[2].textContent.trim();
                        const journalDate = new Date(dateStr);
                        const filterDate = new Date(activeFilters.date);
                        
                        // Set time to midnight for comparison
                        journalDate.setHours(0, 0, 0, 0);
                        filterDate.setHours(0, 0, 0, 0);
                        
                        if (journalDate.getTime() !== filterDate.getTime()) {
                            showRow = false;
                        }
                    } catch (e) {
                        console.error('Error parsing date for filtering:', e);
                    }
                }
                
                // Show or hide row
                if (showRow) {
                    row.classList.remove('filtered-out');
                    row.style.display = '';
                } else {
                    row.classList.add('filtered-out');
                    row.style.display = 'none';
                }
            });
            
            // Apply current sort
            if (currentSort.column) {
                sortJournalTable(currentSort.column, currentSort.direction);
            }
        }
    }
    
    // Initialize sorting and filtering when data is loaded
    function initSortingAndFiltering() {
        if (document.getElementById('users-section').classList.contains('active')) {
            setupUserSortingAndFiltering();
        } else if (document.getElementById('journals-section').classList.contains('active')) {
            setupJournalSortingAndFiltering();
        }
    }

    // Initial data load
    loadDashboardStats();
});
