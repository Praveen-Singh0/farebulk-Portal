const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin'); // adjust path

require('dotenv').config();

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash('admin@123', 10);

  const admin = new Admin({
    username: 'admin@farebulk.com',
    password: hashedPassword,
    role: 'admin', // if you're using roles
  });

  await admin.save();
  console.log('Admin created');
  mongoose.disconnect();
}

createAdmin();
