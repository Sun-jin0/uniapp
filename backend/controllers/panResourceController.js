const PanResource = require('../models/PanResource');
const { successResponse, errorResponse } = require('../utils/response');

exports.getPanResources = async (req, res) => {
  try {
    const { category, search } = req.query;
    const resources = await PanResource.findAll({ Category: category, Search: search });
    res.json(successResponse(resources));
  } catch (error) {
    console.error('获取网盘资源失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.getPanCategories = async (req, res) => {
  try {
    const { full } = req.query;
    if (full) {
      const categories = await PanResource.findAllCategories();
      res.json(successResponse(categories));
    } else {
      const categories = await PanResource.findCategories();
      res.json(successResponse(categories));
    }
  } catch (error) {
    console.error('获取资源分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.syncPanResources = async (req, res) => {
  try {
    const { resources } = req.body;
    if (!resources || !Array.isArray(resources)) {
      return res.status(400).json(errorResponse('数据格式错误'));
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of resources) {
      const existing = await PanResource.findByTitle(item.Title);
      if (existing) {
        await PanResource.update(existing.ResourceID, item);
        updatedCount++;
      } else {
        await PanResource.create(item);
        createdCount++;
      }
    }

    res.json(successResponse({ createdCount, updatedCount }, '同步成功'));
  } catch (error) {
    console.error('同步网盘资源失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.createPanCategory = async (req, res) => {
  try {
    const { name, sortOrder } = req.body;
    if (!name) return res.status(400).json(errorResponse('分类名称必填'));
    const id = await PanResource.createCategory(name, sortOrder || 0);
    res.json(successResponse({ id }));
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.updatePanCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;
    const success = await PanResource.updateCategory(id, name, sortOrder);
    if (success) {
      res.json(successResponse(null, '更新成功'));
    } else {
      res.status(404).json(errorResponse('分类不存在'));
    }
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.deletePanCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await PanResource.deleteCategory(id);
    if (success) {
      res.json(successResponse(null, '删除成功'));
    } else {
      res.status(404).json(errorResponse('分类不存在'));
    }
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

// 管理员接口 - 获取资源列表
exports.adminGetResources = async (req, res) => {
  try {
    const { category, keyword } = req.query;
    const resources = await PanResource.findAll({ Category: category, Search: keyword });
    res.json(successResponse(resources));
  } catch (error) {
    console.error('adminGetResources error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

// 管理员接口 - 添加资源
exports.adminAddResource = async (req, res) => {
  try {
    const { Title, Category, QuarkUrl, BaiduUrl, Description, IsNew, UpdateStatus } = req.body;
    if (!Title) return res.status(400).json(errorResponse('标题不能为空'));

    const id = await PanResource.create({
      Title,
      Category,
      QuarkUrl: QuarkUrl || '',
      BaiduUrl: BaiduUrl || '',
      Description: Description || '',
      IsNew: IsNew || 0,
      UpdateStatus: UpdateStatus || ''
    });

    res.json(successResponse({ id }, '添加成功'));
  } catch (error) {
    console.error('adminAddResource error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

// 管理员接口 - 更新资源
exports.adminUpdateResource = async (req, res) => {
  try {
    const { ResourceID, Title, Category, QuarkUrl, BaiduUrl, Description, IsNew, UpdateStatus } = req.body;
    if (!ResourceID) return res.status(400).json(errorResponse('ID不能为空'));

    const success = await PanResource.update(ResourceID, {
      Title,
      Category,
      QuarkUrl,
      BaiduUrl,
      Description,
      IsNew,
      UpdateStatus
    });

    if (success) {
      res.json(successResponse(null, '更新成功'));
    } else {
      res.status(404).json(errorResponse('资源不存在'));
    }
  } catch (error) {
    console.error('adminUpdateResource error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

// 管理员接口 - 删除资源
exports.adminDeleteResource = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json(errorResponse('ID不能为空'));

    const success = await PanResource.delete(id);
    if (success) {
      res.json(successResponse(null, '删除成功'));
    } else {
      res.status(404).json(errorResponse('资源不存在'));
    }
  } catch (error) {
    console.error('adminDeleteResource error:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.parsePanResources = async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) {
      return res.status(400).json(errorResponse('未提供识别内容'));
    }

    const parsedResources = parsePanText(rawText);
    
    // 合并同一批次中的同名资源
    const consolidated = [];
    const nameMap = new Map();
    
    for (const item of parsedResources) {
      if (nameMap.has(item.Title)) {
        const existing = nameMap.get(item.Title);
        existing.QuarkUrl = existing.QuarkUrl || item.QuarkUrl;
        existing.BaiduUrl = existing.BaiduUrl || item.BaiduUrl;
        existing.Description = (existing.Description + '\n' + item.Description).trim();
      } else {
        nameMap.set(item.Title, item);
        consolidated.push(item);
      }
    }

    // 查重分析
    const analyzed = [];
    for (const item of consolidated) {
      const existing = await PanResource.findByTitle(item.Title);
      if (existing) {
        let action = 'ignore'; // 默认无变化
        const diffs = [];

        // 检查夸克链接 - 如果有新链接，优先替换（解决过期链接问题）
        if (item.QuarkUrl) {
          if (!existing.QuarkUrl) {
            action = 'supplement';
            diffs.push('补充夸克链接');
          } else if (item.QuarkUrl !== existing.QuarkUrl) {
            action = 'update';
            diffs.push(`夸克链接替换: ${existing.QuarkUrl.substring(0, 15)}... -> ${item.QuarkUrl.substring(0, 15)}...`);
          }
        }

        // 检查百度链接 - 如果有新链接，优先替换（解决过期链接问题）
        if (item.BaiduUrl) {
          if (!existing.BaiduUrl) {
            if (action === 'ignore') action = 'supplement';
            diffs.push('补充百度链接');
          } else if (item.BaiduUrl !== existing.BaiduUrl) {
            action = 'update';
            diffs.push(`百度链接替换: ${existing.BaiduUrl.substring(0, 15)}... -> ${item.BaiduUrl.substring(0, 15)}...`);
          }
        }

        analyzed.push({
          ...item,
          existingId: existing.ResourceID,
          action,
          diffs,
          existingData: existing
        });
      } else {
        analyzed.push({
          ...item,
          action: 'create'
        });
      }
    }

    res.json(successResponse(analyzed));
  } catch (error) {
    console.error('解析失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.importPanResources = async (req, res) => {
  try {
    const { resources } = req.body;
    if (!resources || !Array.isArray(resources)) {
      return res.status(400).json(errorResponse('数据格式错误'));
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of resources) {
      if (item.action === 'create') {
        await PanResource.create(item);
        createdCount++;
      } else if (item.action === 'supplement' || item.action === 'update') {
        // 合并数据 - 新链接优先替换旧链接（解决过期链接问题）
        const updateData = {
          ...item.existingData,
          Title: item.Title,
          Category: item.Category,
          // 如果新链接存在则使用新链接，否则保留旧链接
          QuarkUrl: item.QuarkUrl || item.existingData.QuarkUrl,
          BaiduUrl: item.BaiduUrl || item.existingData.BaiduUrl,
          Description: item.Description || item.existingData.Description,
          IsNew: item.IsNew
        };
        await PanResource.update(item.existingId, updateData);
        updatedCount++;
      }
    }

    res.json(successResponse({ createdCount, updatedCount }));
  } catch (error) {
    console.error('导入失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.createPanResource = async (req, res) => {
  try {
    const id = await PanResource.create(req.body);
    res.json(successResponse({ id }));
  } catch (error) {
    console.error('创建网盘资源失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.updatePanResource = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await PanResource.update(id, req.body);
    if (success) {
      res.json(successResponse(null, '更新成功'));
    } else {
      res.status(404).json(errorResponse('资源不存在'));
    }
  } catch (error) {
    console.error('更新网盘资源失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.deletePanResource = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await PanResource.delete(id);
    if (success) {
      res.json(successResponse(null, '删除成功'));
    } else {
      res.status(404).json(errorResponse('资源不存在'));
    }
  } catch (error) {
    console.error('删除网盘资源失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.batchDeletePanResources = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('未提供有效的资源ID列表'));
    }
    const affectedRows = await PanResource.batchDelete(ids);
    res.json(successResponse({ affectedRows }, `成功删除 ${affectedRows} 条资源`));
  } catch (error) {
    console.error('批量删除失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

exports.batchUpdatePanResourcesCategory = async (req, res) => {
  try {
    const { ids, category } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('未提供有效的资源ID列表'));
    }
    if (!category) {
      return res.status(400).json(errorResponse('请提供目标分类'));
    }
    const affectedRows = await PanResource.batchUpdateCategory(ids, category);
    res.json(successResponse({ affectedRows }, `成功修改 ${affectedRows} 条资源的分类`));
  } catch (error) {
    console.error('批量修改分类失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

// 更新置顶状态
exports.updatePanResourceTop = async (req, res) => {
  try {
    const { id } = req.params;
    const { isTop } = req.body;
    const success = await PanResource.updateTopStatus(id, isTop);
    if (success) {
      res.json(successResponse(null, isTop ? '置顶成功' : '取消置顶成功'));
    } else {
      res.status(404).json(errorResponse('资源不存在'));
    }
  } catch (error) {
    console.error('更新置顶状态失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

// 更新排序值
exports.updatePanResourceSort = async (req, res) => {
  try {
    const { id } = req.params;
    const { sortOrder } = req.body;
    const success = await PanResource.updateSortOrder(id, sortOrder);
    if (success) {
      res.json(successResponse(null, '排序更新成功'));
    } else {
      res.status(404).json(errorResponse('资源不存在'));
    }
  } catch (error) {
    console.error('更新排序失败:', error);
    res.status(500).json(errorResponse('服务器错误'));
  }
};

function parsePanText(text) {
  const resources = [];
  const lines = text.split('\n');
  let currentTitleLines = [];
  let currentCategory = '全部资料';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. 识别分类 (支持自定义)
    if (line.startsWith('#') || line.includes('【分类】')) {
      currentCategory = line.replace(/[#【】分类]/g, '').trim();
      continue;
    }

    // 2. 识别行内链接 (例如: 「标题」链接: URL)
    const inlineMatch = line.match(/(?:「([^」]+)」|【([^】]+)】|([^：:]+))?\s*(?:链接[:：]\s*)(https:\/\/pan\.(?:quark\.cn|baidu\.com)\/s\/[a-zA-Z0-9_-]+)/);
    
    if (inlineMatch) {
      let titlesRaw = inlineMatch[1] || inlineMatch[2] || inlineMatch[3] || '';
      // 支持多种分隔符：逗号、斜杠、竖线、以及被多个空格分开的情况
      let titles = titlesRaw.split(/[,，/|]|\s{2,}/);
      const url = inlineMatch[4];
      
      for (let title of titles) {
        title = title.trim();
        if (!title && currentTitleLines.length > 0) {
          title = currentTitleLines.join(' ').replace(/【|】|🔥|❗|链接：|链接:|`|'|"|🌸/g, '').trim();
        }
        if (!title) continue;

        resources.push({
          Title: title,
          Category: currentCategory,
          QuarkUrl: url.includes('quark') ? url : null,
          BaiduUrl: url.includes('baidu') ? url : null,
          Description: line,
          IsNew: line.includes('今年') || line.includes('更新') || line.includes('新增'),
          UpdateStatus: line.includes('更新') ? '持续更新' : '已完结'
        });
      }
      currentTitleLines = [];
      continue;
    }

    // 3. 识别独立链接行
    const urlMatch = line.match(/https:\/\/pan\.(?:quark\.cn|baidu\.com)\/s\/[a-zA-Z0-9_-]+/);
    if (urlMatch) {
      const url = urlMatch[0];
      if (currentTitleLines.length > 0) {
        const fullTitle = currentTitleLines.join(' ').replace(/【|】|🔥|❗|链接：|链接:|`|'|"|🌸/g, '').trim();
        // 同样支持多种分隔符
        const titles = fullTitle.split(/[,，/|]|\s{2,}/);
        
        for (let title of titles) {
          title = title.trim();
          if (!title) continue;
          resources.push({
            Title: title,
            Category: currentCategory,
            QuarkUrl: url.includes('quark') ? url : null,
            BaiduUrl: url.includes('baidu') ? url : null,
            Description: currentTitleLines.join('\n'),
            IsNew: line.includes('今年') || line.includes('更新') || line.includes('新增') || currentTitleLines.some(l => l.includes('今年') || l.includes('更新')),
            UpdateStatus: (line.includes('更新') || currentTitleLines.some(l => l.includes('更新'))) ? '持续更新' : '已完结'
          });
        }
      }
      currentTitleLines = [];
    } else {
      if (!line.includes('一定要保存') && !line.includes('试看2分钟') && !line.includes('链接') && !line.startsWith('🌸')) {
        currentTitleLines.push(line);
      }
    }
  }
  return resources;
}
