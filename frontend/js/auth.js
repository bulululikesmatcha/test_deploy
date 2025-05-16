// auth.js

document.addEventListener("DOMContentLoaded", () => {
  // API Base URL - using the one defined in config.js
  const API_ENDPOINT = API_BASE_URL + '/api';

  // Check for login errors
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('error')) {
    const errorType = urlParams.get('error');
    if (errorType === 'authentication') {
      const form = document.getElementById('loginForm') || document.getElementById('signupForm');
      if (form) {
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mb-3';
        errorAlert.role = 'alert';
        errorAlert.textContent = "Authentication failed. Please try again.";
        form.insertBefore(errorAlert, form.firstChild);
      }
    }
  }

  // Login form handling
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Clear any previous error states
      clearErrorStates(loginForm);

      // Show loading state
      const submitButton = loginForm.querySelector("button[type='submit']");
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = "Logging in...";

      const usernameOrEmail = loginForm.querySelector("input[placeholder='Username or Email']").value;
      const password = loginForm.querySelector("input[placeholder='Password']").value;

      try {
        const response = await fetch(`${API_ENDPOINT}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernameOrEmail, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Store session type flag for proper isolation
          const isAdmin = data.user && (data.user.role === 'admin' || data.user.isAdmin === true);
          
          // Add session type explicitly to help with isolation
          data.user.sessionType = isAdmin ? 'admin' : 'user';
          
          // Store user data in localStorage
          localStorage.setItem('userData', JSON.stringify(data));
          
          // Also store session type separately for easy checking
          localStorage.setItem('currentSessionType', isAdmin ? 'admin' : 'user');
          
          console.log("Login successful, user data stored with session type:", data.user.sessionType);
          
          // Redirect based on user role or admin status
          if (isAdmin) {
            window.location.href = "admin-dashboard.html";
          } else {
            window.location.href = "home.html";
          }
        } else {
          // Display error message and highlight input fields
          const errorMessage = data.message || "Login failed. Please try again.";
          const errorType = data.errorType;
          
          // Apply error styling based on the error type
          if (errorType === 'user_not_found') {
            // Highlight just the username/email field
            const usernameInput = loginForm.querySelector("input[placeholder='Username or Email']");
            usernameInput.classList.add('is-invalid');
            
            const formGroup = usernameInput.closest('.mb-3');
            if (formGroup) {
              const errorDiv = document.createElement('div');
              errorDiv.className = 'invalid-feedback';
              errorDiv.textContent = errorMessage;
              formGroup.appendChild(errorDiv);
            }
          } else if (errorType === 'invalid_password') {
            // Highlight just the password field
            const passwordInput = loginForm.querySelector("input[placeholder='Password']");
            passwordInput.classList.add('is-invalid');
            
            const formGroup = passwordInput.closest('.mb-3');
            if (formGroup) {
              const errorDiv = document.createElement('div');
              errorDiv.className = 'invalid-feedback';
              errorDiv.textContent = errorMessage;
              formGroup.appendChild(errorDiv);
            }
          } else {
            // Generic error - highlight all fields
            const inputs = loginForm.querySelectorAll('input');
            inputs.forEach(input => {
              input.classList.add('is-invalid');
            });
          }
          
          // Create error alert at top of form if it doesn't exist
          if (!loginForm.querySelector('.alert-danger')) {
            const errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger mb-3';
            errorAlert.role = 'alert';
            errorAlert.textContent = errorMessage;
            loginForm.insertBefore(errorAlert, loginForm.firstChild);
          }
          
          // Reset button state
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      } catch (error) {
        console.error('Error:', error);
        
        // Display network error
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mb-3';
        errorAlert.role = 'alert';
        errorAlert.textContent = "Login failed. Please check your network connection and try again.";
        loginForm.insertBefore(errorAlert, loginForm.firstChild);
        
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });

    // Forgot password handling
    const forgotPasswordLink = document.getElementById("forgotPassword");
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener("click", (e) => {
        e.preventDefault();
        // Display forgot password modal or redirect to password reset page
        alert("Password reset functionality will be implemented here.");
      });
    }
  }

  // Signup form handling
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Clear any previous error states
      clearErrorStates(signupForm);

      // Show loading state
      const submitButton = signupForm.querySelector("button[type='submit']");
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = "Signing up...";

      const username = signupForm.querySelector("input[placeholder='Username']").value;
      const email = signupForm.querySelector("input[placeholder='Email']").value;
      const password = signupForm.querySelector("input[placeholder='Password']").value;
      const confirmPassword = signupForm.querySelector("input[placeholder='Confirm Password']").value;

      // Check if passwords match
      if (password !== confirmPassword) {
        // Create error alert at top of form
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mb-3';
        errorAlert.role = 'alert';
        errorAlert.textContent = "Passwords do not match";
        signupForm.insertBefore(errorAlert, signupForm.firstChild);
        
        // Highlight password fields
        const passwordInput = signupForm.querySelector("input[placeholder='Password']");
        const confirmPasswordInput = signupForm.querySelector("input[placeholder='Confirm Password']");
        passwordInput.classList.add('is-invalid');
        confirmPasswordInput.classList.add('is-invalid');
        
        // Add error message under confirm password field
        const formGroup = confirmPasswordInput.closest('.mb-3');
        if (formGroup) {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'invalid-feedback';
          errorDiv.textContent = 'Passwords do not match';
          formGroup.appendChild(errorDiv);
        }
        
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
      }

      try {
        // First check if account exists
        const checkResponse = await fetch(`${API_ENDPOINT}/users/check?email=${encodeURIComponent(email)}`);
        const checkData = await checkResponse.json();
        
        if (checkResponse.ok && checkData.exists) {
          // Email already exists - highlight the email field and show error
          const emailInput = signupForm.querySelector("input[placeholder='Email']");
          emailInput.classList.add('is-invalid');
          
          const formGroup = emailInput.closest('.mb-3');
          if (formGroup) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            errorDiv.textContent = 'This email is already associated with an account';
            formGroup.appendChild(errorDiv);
          }
          
          // Create error alert at top of form
          const errorAlert = document.createElement('div');
          errorAlert.className = 'alert alert-danger mb-3';
          errorAlert.role = 'alert';
          errorAlert.textContent = 'An account with this email already exists';
          signupForm.insertBefore(errorAlert, signupForm.firstChild);
          
          // Reset button state
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
        
        // If email is available, proceed with signup
        const response = await fetch(`${API_ENDPOINT}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: username, email, password, role: 'user' })
        });

        if (response.ok) {
          const userData = await response.json();
          
          // Store session type flag for proper isolation
          const isAdmin = userData.role === 'admin';
          
          // Create proper login data structure
          const loginData = {
            message: 'Sign-up successful',
            user: {
              id: userData._id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              sessionType: 'user'  // New users are always regular users
            }
          };
          
          // Store user data in localStorage
          localStorage.setItem('userData', JSON.stringify(loginData));
          
          // Also store session type separately for easy checking
          localStorage.setItem('currentSessionType', 'user');
          
          console.log("Sign-up successful, user data stored");
          
          alert("Sign-up successful! Redirecting to home page...");
          window.location.href = "home.html";
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.message || "Sign-up failed. Please try again.";
          
          // Create error alert at top of form
          const errorAlert = document.createElement('div');
          errorAlert.className = 'alert alert-danger mb-3';
          errorAlert.role = 'alert';
          errorAlert.textContent = errorMessage;
          signupForm.insertBefore(errorAlert, signupForm.firstChild);
          
          // Apply error styling to all fields
          const inputs = signupForm.querySelectorAll('input');
          inputs.forEach(input => {
            input.classList.add('is-invalid');
          });
          
          // Reset button state
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      } catch (error) {
        console.error('Error:', error);
        
        // Display network error
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mb-3';
        errorAlert.role = 'alert';
        errorAlert.textContent = "Sign-up failed. Please check your network connection and try again.";
        signupForm.insertBefore(errorAlert, signupForm.firstChild);
        
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }

  // Helper function to clear error states
  function clearErrorStates(form) {
    // Remove any previous error alerts
    const previousAlerts = form.querySelectorAll('.alert-danger');
    previousAlerts.forEach(alert => alert.remove());
    
    // Remove error styling from input fields
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.classList.remove('is-invalid');
      const errorFeedback = input.closest('.mb-3')?.querySelector('.invalid-feedback');
      if (errorFeedback) {
        errorFeedback.remove();
      }
    });
  }

  // Social login handlers
  const socialButtons = document.querySelectorAll(".social-btn");
  socialButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const socialPlatform = button.textContent.includes("Google") ? "Google" : "Facebook";
      
      if (socialPlatform === "Google") {
        // Redirect to Google OAuth endpoint
        window.location.href = `${API_ENDPOINT}/users/google`;
      } else {
        // Show message for Facebook (not implemented)
        alert(`${socialPlatform} authentication not implemented yet.`);
      }
    });
  });
});

// Toggle password visibility
document.addEventListener('DOMContentLoaded', function() {
  // Login form password toggle
  const togglePassword = document.querySelector('#togglePassword');
  const password = document.querySelector('#password');
  const eyeIcon = document.querySelector('#eyeIcon');
  
  if (togglePassword && password && eyeIcon) {
    togglePassword.addEventListener('click', function() {
      togglePasswordVisibility(password, eyeIcon);
    });
  }
  
  // Signup form password toggle
  const toggleSignupPassword = document.querySelector('#toggleSignupPassword');
  const signupPassword = document.querySelector('#signupPassword');
  const signupEyeIcon = document.querySelector('#signupEyeIcon');
  
  if (toggleSignupPassword && signupPassword && signupEyeIcon) {
    toggleSignupPassword.addEventListener('click', function() {
      togglePasswordVisibility(signupPassword, signupEyeIcon);
    });
  }
  
  // Signup form confirm password toggle
  const toggleConfirmPassword = document.querySelector('#toggleConfirmPassword');
  const confirmPassword = document.querySelector('#confirmPassword');
  const confirmEyeIcon = document.querySelector('#confirmEyeIcon');
  
  if (toggleConfirmPassword && confirmPassword && confirmEyeIcon) {
    toggleConfirmPassword.addEventListener('click', function() {
      togglePasswordVisibility(confirmPassword, confirmEyeIcon);
    });
  }
  
  // Helper function to toggle password visibility
  function togglePasswordVisibility(passwordInput, iconElement) {
    if (passwordInput.getAttribute('type') === 'password') {
      // Show the password (change from dots to text)
      passwordInput.setAttribute('type', 'text');
      
      // Change to regular eye (no slash) to indicate password is shown
      // and can be clicked to hide
      iconElement.classList.remove('fa-eye-slash');
      iconElement.classList.add('fa-eye');
    } else {
      // Hide the password (change from text to dots)
      passwordInput.setAttribute('type', 'password');
      
      // Change to eye-slash to indicate password is hidden
      // and can be clicked to show
      iconElement.classList.remove('fa-eye');
      iconElement.classList.add('fa-eye-slash');
    }
  }
});
