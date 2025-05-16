const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminAccountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: 'Administrator'
  },
  email: {
    type: String,
    default: 'admin@echoesoftoday.com'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model
const AdminAccount = mongoose.model('AdminAccount', adminAccountSchema);

// Function to initialize the default admin account
async function initializeDefaultAdmin() {
  try {
    // Check if the default admin already exists
    const adminExists = await AdminAccount.findOne({ username: 'EchoesOfTodayAdmin' });
    
    if (!adminExists) {
      console.log('Creating default admin account...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('EchoesOfToday-Aklat', 10);
      
      // Create the default admin
      const defaultAdmin = new AdminAccount({
        username: 'EchoesOfTodayAdmin',
        password: hashedPassword,
        name: 'System Administrator',
        email: 'admin@echoesoftoday.com'
      });
      
      await defaultAdmin.save();
      console.log('Default admin account created successfully');
    } else {
      console.log('Default admin account already exists');
    }
  } catch (error) {
    console.error('Error initializing admin account:', error);
  }
}

module.exports = { 
  AdminAccount,
  initializeDefaultAdmin
}; 