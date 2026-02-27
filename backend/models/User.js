const pool = require('../config/mysql');

class User {
  static async find(query = {}) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    
    if (query.status !== undefined) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    
    if (query.$or) {
      const orClauses = [];
      query.$or.forEach(orQuery => {
        for (const [key, value] of Object.entries(orQuery)) {
          if (value && typeof value === 'object' && value.$regex) {
            orClauses.push(`${key} LIKE ?`);
            params.push(`%${value.$regex}%`);
          } else {
            orClauses.push(`${key} = ?`);
            params.push(value);
          }
        }
      });
      if (orClauses.length > 0) {
        sql += ` AND (${orClauses.join(' OR ')})`;
      }
    }

    sql += ' ORDER BY registerDate DESC';
    
    if (query.skip !== undefined && query.limit !== undefined) {
      sql += ' LIMIT ?, ?';
      params.push(parseInt(query.skip), parseInt(query.limit));
    }
    
    const [rows] = await pool.query(sql, params);
    return rows.map(r => this.formatUser(r));
  }

  static async countDocuments(query = {}) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];
    
    if (query.status !== undefined) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    
    if (query.$or) {
      const orClauses = [];
      query.$or.forEach(orQuery => {
        for (const [key, value] of Object.entries(orQuery)) {
          if (value && typeof value === 'object' && value.$regex) {
            orClauses.push(`${key} LIKE ?`);
            params.push(`%${value.$regex}%`);
          } else {
            orClauses.push(`${key} = ?`);
            params.push(value);
          }
        }
      });
      if (orClauses.length > 0) {
        sql += ` AND (${orClauses.join(' OR ')})`;
      }
    }

    const [rows] = await pool.query(sql, params);
    return rows[0].count;
  }

  static async findOne(query) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    
    if (query.username) {
      sql += ' AND username = ?';
      params.push(query.username);
    }
    if (query.studentId) {
      sql += ' AND studentId = ?';
      params.push(query.studentId);
    }
    if (query.openid) {
      sql += ' AND openid = ?';
      params.push(query.openid);
    }
    if (query.status !== undefined) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    if (query.$or) {
      const orClauses = [];
      query.$or.forEach(orQuery => {
        if (orQuery.username) {
          orClauses.push('username = ?');
          params.push(orQuery.username);
        }
        if (orQuery.studentId) {
          orClauses.push('studentId = ?');
          params.push(orQuery.studentId);
        }
      });
      if (orClauses.length > 0) {
        sql += ` AND (${orClauses.join(' OR ')})`;
      }
    }

    console.log('User.findOne SQL:', sql, params);
    const [rows] = await pool.query(sql, params);
    return rows[0] ? this.formatUser(rows[0]) : null;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] ? this.formatUser(rows[0]) : null;
  }

  static async create(userData) {
    // 为微信登录用户生成随机密码和学号
    const password = userData.password || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const studentId = userData.studentId || `WX${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const [result] = await pool.query(
      'INSERT INTO users (username, password, studentId, phone, avatar, openid) VALUES (?, ?, ?, ?, ?, ?)',
      [userData.username, password, studentId, userData.phone || null, userData.avatar || null, userData.openid || null]
    );
    
    return await this.findById(result.insertId);
  }

  static async updateById(id, updateData) {
    const fields = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
    
    if (fields.length === 0) return;
    
    params.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  static formatUser(user) {
    if (!user) return null;
    return {
      ...user,
      _id: user.id, // 保持兼容性
      comparePassword: async (candidatePassword) => {
        return candidatePassword === user.password;
      }
    };
  }
}

module.exports = User;
