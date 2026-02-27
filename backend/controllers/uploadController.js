const { uploadToOSS } = require('../utils/ossUpload');
const { successResponse, errorResponse } = require('../utils/response');
const ImageManagement = require('../models/ImageManagement');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

// ImgBB API配置
const IMGBB_API_KEY = '490bd6f9af092465ecc79c99895beba7';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * 上传图片到ImgBB
 * @param {string} filePath - 本地文件路径
 * @returns {Promise<object>} - 返回图片信息
 */
async function uploadToImgBB(filePath) {
  // 如果没有配置ImgBB API Key，跳过上传
  if (!IMGBB_API_KEY) {
    console.log('⚠️ 未配置ImgBB API Key，跳过ImgBB上传');
    return null;
  }

  try {
    // 读取文件并转换为base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');
    
    // 创建form data
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);
    
    // 发送请求
    const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000
    });
    
    if (response.data && response.data.success) {
      console.log('✅ ImgBB上传成功:', response.data.data.url);
      return {
        url: response.data.data.url,
        deleteUrl: response.data.data.delete_url,
        imgbbId: response.data.data.id
      };
    } else {
      console.error('❌ ImgBB上传失败:', response.data.error?.message || '未知错误');
      return null;
    }
  } catch (error) {
    console.error('❌ ImgBB上传失败:', error.message);
    if (error.response) {
      console.error('ImgBB错误详情:', error.response.data);
    }
    // ImgBB上传失败不影响整体流程，返回null
    return null;
  }
}

const uploadImage = async (req, res) => {
  try {
    console.log('收到图片上传请求');
    console.log('请求头:', req.headers);
    console.log('文件信息:', req.file);
    
    if (!req.file) {
      console.log('没有收到文件');
      return res.status(400).json(errorResponse('请选择要上传的图片'));
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname || req.file.filename;
    const fileSize = req.file.size;
    const fileExt = path.extname(fileName).toLowerCase().replace('.', '');
    
    // 计算文件哈希（仅用于记录，不用于重复判断）
    const imageHash = ImageManagement.calculateHash(filePath);
    
    const results = {
      oss: { success: false, url: null, error: null },
      imgbb: { success: false, url: null, deleteUrl: null, imgbbId: null, error: null }
    };
    
    // 同时上传到OSS和ImgBB
    console.log('开始同时上传到OSS和ImgBB:', filePath);
    
    const uploadPromises = [
      // OSS上传
      uploadToOSS(filePath)
        .then(url => {
          results.oss.success = true;
          results.oss.url = url;
          console.log('✅ OSS上传成功:', url);
        })
        .catch(error => {
          results.oss.error = error.message;
          console.error('❌ OSS上传失败:', error.message);
        }),
      
      // ImgBB上传
      uploadToImgBB(filePath)
        .then(data => {
          if (data) {
            results.imgbb.success = true;
            results.imgbb.url = data.url;
            results.imgbb.deleteUrl = data.deleteUrl;
            results.imgbb.imgbbId = data.imgbbId;
            console.log('✅ ImgBB上传成功:', data.url);
          } else {
            results.imgbb.success = false;
            results.imgbb.error = 'ImgBB上传失败或未配置';
          }
        })
        .catch(error => {
          results.imgbb.error = error.message;
          console.error('❌ ImgBB上传失败:', error.message);
        })
    ];
    
    // 等待两个上传都完成
    await Promise.all(uploadPromises);
    
    // 检查至少有一个上传成功
    if (!results.oss.success && !results.imgbb.success) {
      throw new Error('OSS和ImgBB都上传失败');
    }

    // 保存到数据库
    const imageId = await ImageManagement.create({
      imageName: fileName,
      imageType: fileExt,
      imageSize: fileSize,
      imageHash: imageHash,
      ossUrl: results.oss.url,
      ossBucket: 'hi168-26998-7111ilq6',
      ossObjectKey: results.oss.url ? results.oss.url.split('/').pop() : null,
      ossStatus: results.oss.success ? 1 : 0,
      imgbbUrl: results.imgbb.url,
      imgbbDeleteUrl: results.imgbb.deleteUrl,
      imgbbId: results.imgbb.imgbbId,
      imgbbStatus: results.imgbb.success ? 1 : 0,
      sourceType: req.body.sourceType || 'other',
      sourceId: req.body.sourceId || null,
      userId: req.userId || null
    });

    // 更新统计
    const today = new Date().toISOString().split('T')[0];
    await ImageManagement.updateStats(today, {
      totalUploads: 1,
      ossSuccess: results.oss.success ? 1 : 0,
      ossFailed: results.oss.success ? 0 : 1,
      imgbbSuccess: results.imgbb.success ? 1 : 0,
      imgbbFailed: results.imgbb.success ? 0 : 1,
      totalSize: fileSize
    });

    // 删除临时文件
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅ 临时文件已删除:', filePath);
      }
    } catch (err) {
      console.error('❌ 删除临时文件失败:', err.message);
    }

    res.json(successResponse({
      id: imageId,
      url: results.oss.url || results.imgbb.url,
      filename: fileName,
      oss: results.oss,
      imgbb: results.imgbb
    }, '图片上传成功'));
  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json(errorResponse('图片上传失败: ' + error.message));
  }
};

/**
 * 获取图片列表
 */
const getImageList = async (req, res) => {
  try {
    const params = req.query;
    const result = await ImageManagement.getList(params);
    res.json(successResponse(result));
  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json(errorResponse('获取图片列表失败: ' + error.message));
  }
};

/**
 * 获取图片详情
 */
const getImageDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await ImageManagement.findById(id);
    if (!image) {
      return res.status(404).json(errorResponse('图片不存在'));
    }
    
    // 获取使用记录
    const usageLog = await ImageManagement.getUsageLog(id);
    
    res.json(successResponse({
      ...image,
      usageLog
    }));
  } catch (error) {
    console.error('获取图片详情失败:', error);
    res.status(500).json(errorResponse('获取图片详情失败: ' + error.message));
  }
};

/**
 * 删除图片
 */
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ImageManagement.delete(id);
    if (result) {
      res.json(successResponse(null, '图片删除成功'));
    } else {
      res.status(404).json(errorResponse('图片不存在'));
    }
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json(errorResponse('删除图片失败: ' + error.message));
  }
};

/**
 * 批量删除图片
 */
const batchDeleteImages = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('请选择要删除的图片'));
    }
    
    console.log('批量删除图片:', ids);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const id of ids) {
      try {
        const result = await ImageManagement.delete(id);
        if (result) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`删除图片 ${id} 失败:`, err.message);
        failCount++;
      }
    }
    
    res.json(successResponse({
      successCount,
      failCount,
      total: ids.length
    }, `成功删除 ${successCount} 张图片${failCount > 0 ? `，${failCount} 张删除失败` : ''}`));
  } catch (error) {
    console.error('批量删除图片失败:', error);
    res.status(500).json(errorResponse('批量删除图片失败: ' + error.message));
  }
};

/**
 * 获取统计信息
 */
const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 获取总统计
    const totalStats = await ImageManagement.getTotalStats();
    
    // 获取日期范围统计
    let dailyStats = [];
    if (startDate && endDate) {
      dailyStats = await ImageManagement.getStats(startDate, endDate);
    }
    
    res.json(successResponse({
      total: totalStats,
      daily: dailyStats
    }));
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json(errorResponse('获取统计信息失败: ' + error.message));
  }
};

/**
 * 替换图片并更新所有引用
 */
const replaceImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json(errorResponse('请选择要上传的图片'));
    }

    // 获取原图片信息
    const originalImage = await ImageManagement.findById(id);
    if (!originalImage) {
      return res.status(404).json(errorResponse('原图片不存在'));
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname || req.file.filename;
    const fileSize = req.file.size;
    const fileExt = path.extname(fileName).toLowerCase().replace('.', '');
    
    // 计算新文件哈希
    const imageHash = ImageManagement.calculateHash(filePath);
    
    const results = {
      oss: { success: false, url: null, error: null },
      imgbb: { success: false, url: null, deleteUrl: null, imgbbId: null, error: null }
    };
    
    // 同时上传到OSS和ImgBB
    console.log('开始替换图片，上传到OSS和ImgBB:', filePath);
    
    const uploadPromises = [
      // OSS上传
      uploadToOSS(filePath)
        .then(url => {
          results.oss.success = true;
          results.oss.url = url;
          console.log('✅ OSS上传成功:', url);
        })
        .catch(error => {
          results.oss.error = error.message;
          console.error('❌ OSS上传失败:', error.message);
        }),
      
      // ImgBB上传
      uploadToImgBB(filePath)
        .then(data => {
          if (data) {
            results.imgbb.success = true;
            results.imgbb.url = data.url;
            results.imgbb.deleteUrl = data.deleteUrl;
            results.imgbb.imgbbId = data.imgbbId;
            console.log('✅ ImgBB上传成功:', data.url);
          } else {
            results.imgbb.success = false;
            results.imgbb.error = 'ImgBB上传失败或未配置';
          }
        })
        .catch(error => {
          results.imgbb.error = error.message;
          console.error('❌ ImgBB上传失败:', error.message);
        })
    ];
    
    await Promise.all(uploadPromises);
    
    // 检查至少有一个上传成功
    if (!results.oss.success && !results.imgbb.success) {
      throw new Error('OSS和ImgBB都上传失败');
    }

    // 更新数据库中的图片记录（使用下划线字段名）
    await ImageManagement.update(id, {
      image_name: fileName,
      image_type: fileExt,
      image_size: fileSize,
      image_hash: imageHash,
      oss_url: results.oss.url,
      oss_bucket: 'hi168-26998-7111ilq6',
      oss_object_key: results.oss.url ? results.oss.url.split('/').pop() : null,
      oss_status: results.oss.success ? 1 : 0,
      imgbb_url: results.imgbb.url,
      imgbb_delete_url: results.imgbb.deleteUrl,
      imgbb_id: results.imgbb.imgbbId,
      imgbb_status: results.imgbb.success ? 1 : 0
    });

    // 获取原图片URL用于全局替换
    const oldUrls = [];
    if (originalImage.oss_url) oldUrls.push(originalImage.oss_url);
    if (originalImage.imgbb_url) oldUrls.push(originalImage.imgbb_url);
    
    const newUrl = results.oss.url || results.imgbb.url;
    
    // 全局替换所有数据表中的图片URL
    const updateResults = await globalImageUrlReplace(oldUrls, newUrl);

    // 更新统计
    const today = new Date().toISOString().split('T')[0];
    await ImageManagement.updateStats(today, {
      totalUploads: 1,
      ossSuccess: results.oss.success ? 1 : 0,
      ossFailed: results.oss.success ? 0 : 1,
      imgbbSuccess: results.imgbb.success ? 1 : 0,
      imgbbFailed: results.imgbb.success ? 0 : 1,
      totalSize: fileSize
    });

    // 删除临时文件
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅ 临时文件已删除:', filePath);
      }
    } catch (err) {
      console.error('❌ 删除临时文件失败:', err.message);
    }

    res.json(successResponse({
      id: id,
      url: results.oss.url || results.imgbb.url,
      filename: fileName,
      oss: results.oss,
      imgbb: results.imgbb,
      updatedReferences: updateResults
    }, '图片替换成功'));
  } catch (error) {
    console.error('图片替换失败:', error);
    res.status(500).json(errorResponse('图片替换失败: ' + error.message));
  }
};

/**
 * 全局替换所有数据表中的图片URL
 * @param {Array} oldUrls - 原图片URL数组
 * @param {string} newUrl - 新图片URL
 * @returns {Object} - 替换结果统计
 */
async function globalImageUrlReplace(oldUrls, newUrl) {
  const mysqlPool = require('../config/mysql');
  const results = {
    success: [],
    failed: [],
    totalReplaced: 0
  };
  
  console.log('🔄 开始全局替换:', { oldUrls, newUrl });
  
  try {
    // 获取数据库中所有表
    const [tables] = await mysqlPool.execute(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = DATABASE() 
       AND table_type = 'BASE TABLE'`
    );
    
    console.log(`🔍 发现 ${tables.length} 个表，开始扫描...`);
    
    for (const tableRow of tables) {
      try {
        // 获取表名（处理大小写）
        const tableName = tableRow.table_name || tableRow.TABLE_NAME;
        if (!tableName) {
          console.log('⚠️ 表名为空，跳过');
          continue;
        }
        
        // 跳过图片管理相关的表（避免循环更新）
        if (tableName === 'image_management' || tableName === 'image_usage_log' || tableName === 'image_storage_stats') {
          continue;
        }
        
        // 获取表的所有字段
        const [columns] = await mysqlPool.execute(
          `SELECT column_name, data_type 
           FROM information_schema.columns 
           WHERE table_schema = DATABASE() AND table_name = ?`,
          [tableName]
        );
        
        // 筛选文本类型的字段
        const textFields = columns.filter(col => {
          const type = (col.data_type || col.DATA_TYPE || '').toLowerCase();
          return type.includes('char') || type.includes('text') || type.includes('blob') || type.includes('json');
        }).map(col => col.column_name || col.COLUMN_NAME);
        
        console.log(`📋 表 ${tableName} 的文本字段:`, textFields);
        
        if (textFields.length === 0) {
          continue; // 没有文本字段，跳过
        }
        
        // 对每个文本字段进行替换
        for (const fieldName of textFields) {
          for (const oldUrl of oldUrls) {
            if (!oldUrl) continue;
            
            try {
              const [result] = await mysqlPool.execute(
                `UPDATE \`${tableName}\` SET \`${fieldName}\` = REPLACE(\`${fieldName}\`, ?, ?) 
                 WHERE \`${fieldName}\` LIKE ?`,
                [oldUrl, newUrl, `%${oldUrl}%`]
              );
              
              if (result.affectedRows > 0) {
                results.success.push({
                  table: tableName,
                  field: fieldName,
                  oldUrl,
                  newUrl,
                  affectedRows: result.affectedRows
                });
                results.totalReplaced += result.affectedRows;
                console.log(`✅ 已替换 ${tableName}.${fieldName}: ${result.affectedRows} 条记录`);
              }
            } catch (error) {
              // 某些字段可能不支持LIKE查询，记录但不中断
              if (!error.message.includes('BLOB')) {
                console.error(`❌ 替换失败 ${tableName}.${fieldName}:`, error.message);
                results.failed.push({
                  table: tableName,
                  field: fieldName,
                  oldUrl,
                  error: error.message
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ 处理表失败 ${tableName}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ 获取表列表失败:', error.message);
  }
  
  console.log(`🎉 全局替换完成，共替换 ${results.totalReplaced} 处引用`);
  return results;
}

/**
 * 扫描所有数据表中的图片链接
 */
const scanAllImages = async (req, res) => {
  const mysqlPool = require('../config/mysql');
  const imageUrls = new Map(); // 使用Map去重，key为URL，value为出现的位置信息
  
  // 获取筛选参数
  const { tableFilter, urlFilter } = req.query;
  
  // 要扫描的表列表
  const targetTableNames = [
    'computer1_question',
    'computer1_question_option', 
    'computer1_question_sub',
    'math_questiondetails',
    'math_knowledgepoints'
  ];
  
  // 如果指定了表筛选，只扫描匹配的表
  const tablesToScan = tableFilter 
    ? targetTableNames.filter(t => t.includes(tableFilter))
    : targetTableNames;
  
  try {
    console.log(`🔍 开始扫描数据库中的图片链接...`);
    
    for (const tableName of tablesToScan) {
      try {
        // 检查表是否存在
        const [tableExists] = await mysqlPool.execute(
          `SELECT 1 FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = ?`,
          [tableName]
        );
        
        if (tableExists.length === 0) {
          console.log(`⚠️ 表 ${tableName} 不存在，跳过`);
          continue;
        }
        
        // 获取表的所有字段（排除QuestionImg）
        const [columns] = await mysqlPool.execute(
          `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME != 'QuestionImg'`,
          [tableName]
        );
        
        if (columns.length === 0) {
          console.log(`⚠️ 表 ${tableName} 没有可扫描的字段，跳过`);
          continue;
        }
        
        console.log(`📋 扫描表 ${tableName}，字段: ${columns.map(c => c.COLUMN_NAME).join(', ')}`);
        
        // 扫描每个字段
        for (const column of columns) {
          const fieldName = column.COLUMN_NAME;
          try {
            // 查询包含http链接的记录
            const [rows] = await mysqlPool.execute(
              `SELECT \`${fieldName}\` as content FROM \`${tableName}\` 
               WHERE \`${fieldName}\` IS NOT NULL 
               AND (\`${fieldName}\` LIKE '%http://%' OR \`${fieldName}\` LIKE '%https://%')
               LIMIT 1000`,
              []
            );
            
            for (const row of rows) {
              const content = String(row.content);
              if (!content) continue;
              
              // 提取图片URL
              const urlRegex = /https?:\/\/[^\s"'<>\]\)]+?(?:\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico))(\?[^\s"'<>\]\)]*)?/gi;
              const matches = content.match(urlRegex);
              
              if (matches) {
                for (const url of matches) {
                  // 清理URL
                  const cleanUrl = url.replace(/[\]\)]+$/, '');
                  
                  // 添加到结果（自动去重）
                  if (!imageUrls.has(cleanUrl)) {
                    imageUrls.set(cleanUrl, {
                      url: cleanUrl,
                      tableName: tableName,
                      fieldName: fieldName
                    });
                  }
                }
              }
            }
          } catch (error) {
            // 某些字段可能不支持查询，记录但不中断
            if (!error.message.includes('BLOB')) {
              console.error(`❌ 扫描失败 ${tableName}.${fieldName}:`, error.message);
            }
          }
        }
      } catch (error) {
        console.error(`❌ 处理表失败 ${tableName}:`, error.message);
      }
    }
    
    // 转换为数组
    let results = Array.from(imageUrls.values());
    
    // 根据URL关键词筛选
    if (urlFilter) {
      const keyword = urlFilter.toLowerCase();
      results = results.filter(item => item.url.toLowerCase().includes(keyword));
    }
    
    console.log(`🎉 扫描完成，共发现 ${results.length} 个图片链接`);
    
    res.json(successResponse({
      total: results.length,
      images: results
    }, '扫描完成'));
  } catch (error) {
    console.error('扫描失败:', error);
    res.status(500).json(errorResponse('扫描失败: ' + error.message));
  }
};

module.exports = {
  uploadImage,
  getImageList,
  getImageDetail,
  deleteImage,
  batchDeleteImages,
  getStats,
  replaceImage,
  scanAllImages
};
