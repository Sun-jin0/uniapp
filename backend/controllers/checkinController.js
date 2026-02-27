const CheckinRecord = require('../models/CheckinRecord');
const PointsRecord = require('../models/PointsRecord');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

const checkin = async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingRecord = await CheckinRecord.findOne({
      userId,
      date: today,
    });
    
    if (existingRecord) {
      return res.status(400).json(errorResponse('今日已签到'));
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayRecord = await CheckinRecord.findOne({
      userId,
      date: yesterday,
    });
    
    let consecutiveDays = 1;
    if (yesterdayRecord) {
      consecutiveDays = yesterdayRecord.consecutiveDays + 1;
    }
    
    let points = 10;
    if (consecutiveDays >= 7) {
      points = 20;
    } else if (consecutiveDays >= 30) {
      points = 30;
    }
    
    await CheckinRecord.create({
      userId,
      date: today,
      points,
      consecutiveDays,
    });
    
    await PointsRecord.create({
      userId,
      points,
      type: 1,
      description: '每日签到',
    });
    
    const pool = require('../config/mysql');
    await pool.query(
      'UPDATE users SET totalScore = totalScore + ?, practiceDays = practiceDays + 1 WHERE id = ?',
      [points, userId]
    );
    
    res.json(successResponse({ points, consecutiveDays }));
  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

const getCheckinRecords = async (req, res) => {
  try {
    const userId = req.userId;
    
    const records = await CheckinRecord.find({ 
      userId,
      limit: 30
    });
    
    const consecutiveDays = records.length > 0 ? records[0].consecutiveDays : 0;
    const totalDays = await CheckinRecord.countDocuments({ userId });
    
    res.json(successResponse({
      consecutiveDays,
      totalDays,
      records: records.map(r => ({
        date: r.checkinDate,
        points: r.points,
      })),
    }));
  } catch (error) {
    res.status(500).json(errorResponse('服务器错误'));
  }
};

module.exports = {
  checkin,
  getCheckinRecords,
};
