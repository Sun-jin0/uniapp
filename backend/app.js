require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev', {
  skip: (req, res) => req.url.includes('/api/video/proxy')
}));
// app.use((req, res, next) => {
//   console.log(`[Request] ${req.method} ${req.url}`);
//   next();
// });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/api/user', require('./routes/userRoutes'));
app.use('/api', require('./routes/publicRoutes'));
app.use('/api', require('./routes/examRoutes'));
app.use('/api/redeem-codes', require('./routes/redeemCodeRoutes'));
app.use('/api', require('./routes/studyRoutes'));
app.use('/api/checkin', require('./routes/checkinRoutes'));
app.use('/api/essay', require('./routes/essayRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/med', require('./routes/medRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api', require('./routes/uploadRoutes'));
app.use('/api', require('./routes/mathRoutes'));
app.use('/api', require('./routes/computer1Routes'));
app.use('/api', require('./routes/adminMathRoutes'));
app.use('/api', require('./routes/homepageCardRoutes')); // homepageCardRoutes mounts on / and /admin
app.use('/api/video', require('./routes/videoRoutes'));
app.use('/api/admin/video', require('./routes/adminVideoRoutes'));
app.use('/api', require('./routes/politicsRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/online-exam', require('./routes/onlineExamRoutes'));
app.use('/api', require('./routes/uploadRoutes'));
app.use('/api', require('./routes/tutorialRoutes'));

// 静态页面用于管理员管理纠错
app.use('/admin-panel', express.static(path.join(__dirname, 'public/admin')));

// 测试页面
app.use('/test-upload.html', express.static(path.join(__dirname, 'public/test-upload.html')));
app.use('/test-image-manage.html', express.static(path.join(__dirname, 'public/test-image-manage.html')));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
