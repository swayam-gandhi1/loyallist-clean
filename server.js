const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Attach socket.io to the server

// MongoDB models
const User = require('./models/User');
const Message = require('./models/Message'); // Add this model if you haven't yet
const adminRoutes = require('./routes/adminRoutes');



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('public/uploads'));


// Routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');



app.use('/api', authRoutes);
app.use('/api/messages', messageRoutes); // Mount path
app.use('/api', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/pdfs', require('./routes/pdfRoutes'));
app.use('/uploads/pdfs', express.static(path.join(__dirname, 'public/uploads/pdfs')));
app.use('/api/admin', adminRoutes);
app.use('/api/subscribe', subscriberRoutes);


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Socket.IO connection
io.on('connection', async (socket) => {
  console.log('📡 New admin connected to dashboard');

  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments();

    socket.emit('dashboardStats', {
      totalUsers,
      totalMessages
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
  }
});

// Fallback route for index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
