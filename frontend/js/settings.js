// Update settings form
document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Settings updated successfully!');
  });
  
  // Dark mode toggle
  const toggle = document.getElementById('darkModeToggle');
  toggle.addEventListener('change', function() {
    document.body.classList.toggle('dark-mode', this.checked);
    localStorage.setItem('darkMode', this.checked);
  });
  
  // Load dark mode state
  window.addEventListener('DOMContentLoaded', () => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    toggle.checked = isDark;
    document.body.classList.toggle('dark-mode', isDark);
  });
  
  // Log out
  document.getElementById('logoutBtn').addEventListener('click', () => {
    alert('Logged out!');
    window.location.href = 'login.html'; // Simulate logout redirect
  });

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('settingsForm');
  
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('Settings saved!');
      // Here, add logic to save settings (e.g., to localStorage or backend)
    });
  });
  