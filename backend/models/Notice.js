const pool = require('../config/mysql');

class Notice {
  static async find(query = {}) {
    let sql = 'SELECT * FROM notices WHERE 1=1';
    const params = [];
    
    if (query.status !== undefined) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    if (query.isActive !== undefined) {
      sql += ' AND isActive = ?';
      params.push(query.isActive);
    }
    if (query.noticeType) {
      sql += ' AND noticeType = ?';
      params.push(query.noticeType);
    }
    if (query.category) {
      sql += ' AND category = ?';
      params.push(query.category);
    }
    if (query.title && query.title.$regex) {
      sql += ' AND title LIKE ?';
      params.push(`%${query.title.$regex}%`);
    } else if (query.keyword) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }
    
    if (query.sort === 'hottest') {
      sql += ' ORDER BY viewCount DESC, createdAt DESC';
    } else {
      sql += ' ORDER BY createdAt DESC';
    }
    
    if (query.skip !== undefined && query.limit !== undefined) {
      sql += ' LIMIT ?, ?';
      params.push(parseInt(query.skip), parseInt(query.limit));
    }
    
    console.log('Executing SQL:', sql, 'with params:', params);
    const [rows] = await pool.query(sql, params);
    return rows.map(r => ({ ...r, _id: r.id }));
  }

  static async countDocuments(query = {}) {
    let sql = 'SELECT COUNT(*) as count FROM notices WHERE 1=1';
    const params = [];
    
    if (query.status !== undefined) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    if (query.isActive !== undefined) {
      sql += ' AND isActive = ?';
      params.push(query.isActive);
    }
    if (query.noticeType) {
      sql += ' AND noticeType = ?';
      params.push(query.noticeType);
    }
    if (query.category) {
      sql += ' AND category = ?';
      params.push(query.category);
    }
    if (query.title && query.title.$regex) {
      sql += ' AND title LIKE ?';
      params.push(`%${query.title.$regex}%`);
    } else if (query.keyword) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }

    const [rows] = await pool.query(sql, params);
    return rows[0].count;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM notices WHERE id = ?', [id]);
    return rows[0] ? { ...rows[0], _id: rows[0].id } : null;
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO notices (title, description, category, content, linkUrl, noticeType, imageUrl, type, status, isActive, subCategory, author) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.title, 
        data.description || null,
        data.category || '系统通知', 
        data.content || '', 
        data.linkUrl || null, 
        data.noticeType || 'article', 
        data.imageUrl || null,
        data.type || 'notice', 
        data.status !== undefined ? data.status : 1,
        data.isActive !== undefined ? data.isActive : 1,
        data.subCategory || null,
        data.author || '研兔刷题'
      ]
    );
    return { id: result.insertId, _id: result.insertId, ...data };
  }

  static async findByIdAndUpdate(id, updateData) {
    const fields = [];
    const params = [];
    
    // 定义允许更新的字段
    const allowedFields = [
      'title', 'description', 'category', 'content', 'linkUrl', 
      'noticeType', 'imageUrl', 'type', 'status', 'isActive', 
      'subCategory', 'author', 'viewCount'
    ];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    if (fields.length === 0) return await this.findById(id);

    params.push(id);
    await pool.query(`UPDATE notices SET ${fields.join(', ')} WHERE id = ?`, params);
    return await this.findById(id);
  }

  static async findByIdAndDelete(id) {
    const notice = await this.findById(id);
    if (notice) {
      await pool.query('DELETE FROM notices WHERE id = ?', [id]);
    }
    return notice;
  }

  static async incrementViewCount(id) {
    await pool.query('UPDATE notices SET viewCount = viewCount + 1 WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Notice;
