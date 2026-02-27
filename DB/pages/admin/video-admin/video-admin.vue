
<template>
  <view class="admin-container">
    <view class="admin-header">
      <view class="header-left">
        <text class="admin-logo">OJLD</text>
        <text class="admin-title">视频管理后台</text>
      </view>
      <view class="header-right">
        <view class="admin-user">
          <text class="user-name">Admin</text>
          <text class="logout-btn" @click="handleBack">返回</text>
        </view>
      </view>
    </view>

    <view class="main-content">
      <view class="sidebar">
        <view class="sidebar-item" :class="{ active: activeTab === 'content' }" @click="activeTab = 'content'">
          <text class="icon">🎬</text>
          <text>内容管理</text>
        </view>
        <view class="sidebar-item" :class="{ active: activeTab === 'code' }" @click="activeTab = 'code'">
          <text class="icon">🔑</text>
          <text>兑换码管理</text>
        </view>
        <view class="sidebar-item" :class="{ active: activeTab === 'feedback' }" @click="activeTab = 'feedback'">
          <text class="icon">💬</text>
          <text>反馈与推荐</text>
        </view>
      </view>

      <view class="tab-content">
        <!-- Content Management -->
        <template v-if="activeTab === 'content'">
          <view class="manage-layout">
            <!-- Sidebar: Subjects & Categories -->
            <view class="manage-sidebar">
              <view class="section-header-row">
                <view class="section-title">科目分类</view>
                <button class="btn-add-mini" @click="openSubjectModal()">+</button>
              </view>
              <scroll-view scroll-y class="subject-list">
                <view v-for="sub in subjects" :key="sub.id" class="subject-group">
                  <view class="subject-item" :class="{ active: selectedSubjectId === sub.id && !selectedCategoryId }" @click="selectSubject(sub)">
                    <text class="subject-name">{{ sub.name }}</text>
                    <view class="subject-actions">
                      <text class="action-icon-mini" @click.stop="openSubjectModal(sub)">✎</text>
                      <text class="action-icon-mini delete" @click.stop="deleteSubject(sub)">🗑</text>
                      <text class="action-icon-mini add" @click.stop="openCategoryModal(sub)">+</text>
                      <text class="action-icon-mini batch" title="批量管理" @click.stop="openBatchSubjectModal(sub)">⚙</text>
                    </view>
                  </view>
                  <!-- Categories -->
                  <view v-if="sub.categories && sub.categories.length" class="category-list">
                    <view v-for="cat in sub.categories" :key="cat.id" 
                          class="category-item" 
                          :class="{ active: selectedCategoryId === cat.id }"
                          @click="selectCategory(sub, cat)">
                      <text class="category-name">└ {{ cat.name }}</text>
                      <view class="category-actions">
                        <text class="action-icon-mini" @click.stop="openCategoryModal(sub, cat)">✎</text>
                        <text class="action-icon-mini delete" @click.stop="deleteCategory(cat)">🗑</text>
                        <text class="action-icon-mini batch" title="批量管理" @click.stop="openBatchCategoryModal(cat)">⚙</text>
                      </view>
                    </view>
                  </view>
                </view>
              </scroll-view>
            </view>

            <!-- Main: Resources -->
            <view class="manage-main">
              <view class="content-header">
                <view class="h2">
                  <checkbox v-if="resources.length" :checked="isAllSelected" @click="toggleSelectAll" />
                  {{ currentBreadcrumb }}
                </view>
                <view class="header-btns">
        <button v-if="selectedResourceIds.length" class="btn-batch" @click="openBatchResourceModal">批量操作 ({{ selectedResourceIds.length }})</button>
        <button v-if="selectedResourceIds.length" class="btn-batch-code" @click="openBatchGenerateModal">批量生成兑换码</button>
        <button class="btn-primary-small" @click="openResourceModal()">新建视频/合集</button>
      </view>
              </view>

              <scroll-view scroll-y class="resource-list">
                <view v-if="resources.length === 0" class="empty-text">暂无视频资源</view>
                <view v-for="res in resources" :key="res.id" class="resource-card" :class="{ selected: selectedResourceIds.includes(res.id) }">
                   <view class="res-checkbox">
                     <checkbox :checked="selectedResourceIds.includes(res.id)" @click="toggleSelectResource(res.id)" />
                   </view>
                   <image :src="res.cover_url || '/static/default-video.png'" mode="aspectFill" class="res-cover" @click="toggleSelectResource(res.id)" />
                   <view class="res-info">
                     <view class="res-title">
                       <text class="tag" :class="res.type === 'collection' ? 'tag-collection' : 'tag-single'">{{ res.type === 'collection' ? '合集' : '单集' }}</text>
                       {{ res.title }}
                     </view>
                     <view class="res-meta">
                       <text v-if="res.requires_redemption" class="status-badge lock">需兑换</text>
                       <text v-else class="status-badge free">免费/公开</text>
                       <text class="status-badge" :class="res.is_public ? 'public' : 'private'">{{ res.is_public ? '公开展示' : '隐藏' }}</text>
                       <text class="vid-text">VID: {{ res.vid }}</text>
                     </view>
                     <view class="res-desc">{{ res.description || '暂无简介' }}</view>
                   </view>
                   <view class="res-actions">
                     <button class="action-btn" @click="openResourceModal(res)">编辑</button>
                     <button class="action-btn" @click="copyExternalLink(res)">复制外部链接</button>
                     <button class="action-btn" @click="openGenerateCodeModal(res)">生成兑换码</button>
                     <button class="action-btn delete" @click="deleteResource(res)">删除</button>
                   </view>
                </view>
              </scroll-view>
            </view>
          </view>
        </template>

        <!-- Code Management -->
        <template v-if="activeTab === 'code'">
           <view class="content-header">
             <view class="h2">兑换码管理</view>
             <view class="filter-row">
               <input v-model="codeKeyword" placeholder="搜索兑换码..." class="search-input" @confirm="fetchCodes" />
               <button class="search-btn" @click="fetchCodes">搜索</button>
             </view>
           </view>
           <scroll-view scroll-y class="table-container">
             <view class="table-header">
               <view class="th">兑换码</view>
               <view class="th">对应资源</view>
               <view class="th">状态</view>
               <view class="th">使用用户ID</view>
               <view class="th">使用时间</view>
               <view class="th">生成时间</view>
             </view>
             <view v-for="code in codes" :key="code.id" class="tr">
               <view class="td code-text">{{ code.code }}</view>
               <view class="td">{{ code.resource_title }}</view>
               <view class="td">
                 <text :class="code.is_used ? 'text-danger' : 'text-success'">{{ code.is_used ? '已使用' : '未使用' }}</text>
               </view>
               <view class="td">{{ code.used_by || '-' }}</view>
               <view class="td">{{ formatDate(code.used_at) }}</view>
               <view class="td">{{ formatDate(code.created_at) }}</view>
             </view>
           </scroll-view>
        </template>

        <!-- Feedback & Recommendation -->
        <template v-if="activeTab === 'feedback'">
          <view class="content-header">
            <view class="h2">反馈与推荐</view>
            <view class="filter-row">
              <view class="type-filter">
                <text class="filter-label">类型：</text>
                <picker @change="onFeedbackTypeChange" :range="['全部', '反馈', '推荐']" :value="feedbackTypeIndex">
                  <view class="picker-box mini">{{ ['全部', '反馈', '推荐'][feedbackTypeIndex] }}</view>
                </picker>
              </view>
              <button class="search-btn" @click="fetchFeedbacks">刷新</button>
            </view>
          </view>
          <scroll-view scroll-y class="feedback-list">
            <view v-if="feedbacks.length === 0" class="empty-text">暂无反馈或推荐</view>
            <view v-for="item in feedbacks" :key="item.id" class="feedback-card">
              <view class="fb-header">
                <view class="fb-user">
                  <image :src="item.avatar || '/static/default-avatar.png'" class="fb-avatar" />
                  <text class="fb-nickname">{{ item.nickname || '匿名用户' }}</text>
                </view>
                <view class="fb-meta">
                  <text class="fb-tag" :class="item.type">{{ item.type === 'feedback' ? '反馈' : '推荐' }}</text>
                  <text class="fb-time">{{ formatDate(item.created_at) }}</text>
                </view>
              </view>
              <view class="fb-target">
                <text class="label">针对视频：</text>
                <text class="value">{{ item.resource_title || '未知视频' }}</text>
              </view>
              <view class="fb-content">
                {{ item.content }}
              </view>
            </view>
          </scroll-view>
        </template>
      </view>
    </view>

    <!-- Modals -->
    <!-- Subject Modal -->
    <view v-if="showSubjectModal" class="modal-mask">
      <view class="modal-content">
        <view class="modal-header">
          <text>{{ editingSubject.id ? '编辑科目' : '新建科目' }}</text>
          <text class="close-btn" @click="showSubjectModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="label">科目名称</text>
            <input v-model="editingSubject.name" class="input" placeholder="请输入科目名称" />
          </view>
          <view class="form-item">
            <text class="label">排序</text>
            <input v-model.number="editingSubject.sort" type="number" class="input" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showSubjectModal = false">取消</button>
          <button class="btn-confirm" @click="saveSubject">保存</button>
        </view>
      </view>
    </view>

    <!-- Category Modal -->
    <view v-if="showCategoryModal" class="modal-mask">
      <view class="modal-content">
        <view class="modal-header">
          <text>{{ editingCategory.id ? '编辑分类' : '新建分类' }}</text>
          <text class="close-btn" @click="showCategoryModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="label">所属科目</text>
            <text class="value">{{ editingCategory.subjectName }}</text>
          </view>
          <view class="form-item">
            <text class="label">分类名称</text>
            <input v-model="editingCategory.name" class="input" placeholder="请输入分类名称" />
          </view>
          <view class="form-item">
            <text class="label">排序</text>
            <input v-model.number="editingCategory.sort" type="number" class="input" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showCategoryModal = false">取消</button>
          <button class="btn-confirm" @click="saveCategory">保存</button>
        </view>
      </view>
    </view>

    <!-- Resource Modal -->
    <view v-if="showResourceModal" class="modal-mask large">
      <view class="modal-content large-content">
        <view class="modal-header">
          <text>{{ editingResource.id ? '编辑视频资源' : '新建视频资源' }}</text>
          <text class="close-btn" @click="showResourceModal = false">×</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="form-row">
            <view class="form-item">
              <text class="label">归属科目</text>
              <picker @change="onResourceSubjectChange" :range="subjects" range-key="name" :value="resourceSubjectIndex">
                <view class="picker-box">{{ subjects[resourceSubjectIndex]?.name || '请选择科目' }}</view>
              </picker>
            </view>
            <view class="form-item">
              <text class="label">归属分类</text>
              <picker @change="onResourceCategoryChange" :range="resourceCategories" range-key="name" :value="resourceCategoryIndex">
                 <view class="picker-box">{{ resourceCategories[resourceCategoryIndex]?.name || '请选择分类' }}</view>
              </picker>
            </view>
          </view>
          
          <view class="form-item" v-if="editingResource.id">
            <text class="label">VID (外部检索标识)</text>
            <view class="vid-display-row">
              <text class="value">{{ editingResource.vid }}</text>
              <button class="btn-mini ml-10" @click="copyText(editingResource.vid)">复制</button>
            </view>
            <text class="tip">这是对外公开的视频标识，不可更改</text>
          </view>
          
          <view class="form-item">
            <text class="label">标题</text>
            <input v-model="editingResource.title" class="input" placeholder="视频或合集标题" />
          </view>
          
          <view class="form-item">
            <text class="label">Bilibili 链接 (合集主链接/单集链接)</text>
            <input v-model="editingResource.bili_link" class="input" placeholder="https://b23.tv/..." />
          </view>
          
          <view class="form-item">
            <text class="label">封面URL</text>
            <input v-model="editingResource.cover_url" class="input" placeholder="http://..." />
          </view>

          <view class="form-item">
            <text class="label">简介</text>
            <textarea v-model="editingResource.description" class="textarea" placeholder="资源简介..." />
          </view>

          <view class="form-item bili-quick-add">
            <text class="label">Bilibili 快速识别</text>
            <view class="quick-input-row">
              <input v-model="biliQuickInput" class="input flex-1" placeholder="粘贴 B站 分享文字，如：【标题】链接" />
              <button class="btn-mini ml-5" @click="handleBiliParse">识别</button>
            </view>
            <text class="tip">识别后将自动填充标题、链接、封面和简介</text>
          </view>

          <view class="form-row">
             <view class="form-item">
               <text class="label">资源类型</text>
               <radio-group @change="e => editingResource.type = e.detail.value">
                 <label class="radio"><radio value="single" :checked="editingResource.type === 'single'" />单集</label>
                 <label class="radio"><radio value="collection" :checked="editingResource.type === 'collection'" />合集</label>
               </radio-group>
             </view>
             <view class="form-item">
               <text class="label">观看权限</text>
               <radio-group @change="e => editingResource.requires_redemption = Number(e.detail.value)">
                 <label class="radio"><radio :value="0" :checked="editingResource.requires_redemption === 0" />免费</label>
                 <label class="radio"><radio :value="1" :checked="editingResource.requires_redemption === 1" />需兑换</label>
               </radio-group>
             </view>
             <view class="form-item">
               <text class="label">是否公开展示</text>
               <switch :checked="editingResource.is_public === 1" @change="e => editingResource.is_public = e.detail.value ? 1 : 0" />
             </view>
          </view>

          <!-- Video Items -->
          <view class="items-section">
            <view class="section-head">
              <text class="title">视频列表 ({{ editingResource.items.length }})</text>
              <button class="btn-add-mini" @click="addVideoItem">+ 添加视频</button>
            </view>
            <view v-for="(item, idx) in editingResource.items" :key="idx" class="video-item-edit">
              <view class="item-row">
                 <text class="idx">{{ idx + 1 }}</text>
                 <input v-model="item.title" class="input flex-1" placeholder="视频标题" />
                 <input v-model="item.duration" class="input w-100" placeholder="时长" />
                 <text class="del-btn" @click="removeVideoItem(idx)">×</text>
              </view>
              <view class="item-row mt-5">
                 <input v-model="item.url" class="input flex-1" placeholder="视频链接 URL (OSS直链)" />
                 <input v-model="item.bili_link" class="input flex-1 ml-5" placeholder="Bilibili 链接 (b23.tv 或 bilibili.com)" />
              </view>
            </view>
          </view>

        </scroll-view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showResourceModal = false">取消</button>
          <button class="btn-confirm" @click="saveResource">保存</button>
        </view>
      </view>
    </view>

    <!-- Generate Code Modal -->
    <view v-if="showGenerateModal" class="modal-mask">
      <view class="modal-content">
        <view class="modal-header">
          <text>生成兑换码</text>
          <text class="close-btn" @click="showGenerateModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
             <text class="label">资源名称</text>
             <text class="value">{{ generatingResource?.title }}</text>
          </view>
          <view class="form-item">
             <text class="label">生成数量</text>
             <input v-model.number="generateCount" type="number" class="input" placeholder="请输入数量" />
          </view>
          <view v-if="generatedCodes.length" class="codes-result">
            <text class="label">生成结果：</text>
            <textarea :value="generatedCodes.join('\n')" class="textarea codes-area" maxlength="-1"></textarea>
            <button class="btn-copy" @click="copyCodes">复制全部</button>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showGenerateModal = false">关闭</button>
          <button v-if="!generatedCodes.length" class="btn-confirm" @click="confirmGenerate">生成</button>
        </view>
      </view>
    </view>

    <!-- Batch Management Modal -->
    <view v-if="showBatchModal" class="modal-mask">
      <view class="modal-content">
        <view class="modal-header">
          <text>{{ 
            batchType === 'subject' ? '批量管理科目下所有视频' : 
            (batchType === 'category' ? '批量管理分类下所有视频' : '批量管理已选视频') 
          }}</text>
          <text class="close-btn" @click="showBatchModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="label">修改观看权限</text>
            <radio-group @change="e => batchData.requires_redemption = Number(e.detail.value)">
              <label class="radio"><radio :value="0" :checked="batchData.requires_redemption === 0" />免费</label>
              <label class="radio"><radio :value="1" :checked="batchData.requires_redemption === 1" />需兑换</label>
              <label class="radio"><radio :value="-1" :checked="batchData.requires_redemption === -1" />不修改</label>
            </radio-group>
          </view>
          <view class="form-item">
            <text class="label">修改公开状态</text>
            <radio-group @change="e => batchData.is_public = Number(e.detail.value)">
              <label class="radio"><radio :value="1" :checked="batchData.is_public === 1" />公开</label>
              <label class="radio"><radio :value="0" :checked="batchData.is_public === 0" />隐藏</label>
              <label class="radio"><radio :value="-1" :checked="batchData.is_public === -1" />不修改</label>
            </radio-group>
          </view>
          <view class="form-item" v-if="batchType === 'resource'">
            <text class="label">移动到分类</text>
            <picker @change="onBatchCategoryChange" :range="allCategories" range-key="name" :value="batchCategoryIndex">
              <view class="picker-box">{{ allCategories[batchCategoryIndex]?.name || '不修改' }}</view>
            </picker>
          </view>
          <view class="form-item danger-zone" v-if="batchType === 'resource'">
            <button class="btn-delete-batch" @click="batchDelete">批量删除所选视频</button>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showBatchModal = false">取消</button>
          <button class="btn-confirm" @click="applyBatch">应用修改</button>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import adminVideoApi from '@/api/adminVideo';
import { decryptVideoUrl, encryptVideoUrl } from '@/utils/videoEncryption';

const activeTab = ref('content');
const subjects = ref([]);
const selectedSubjectId = ref(null);
const selectedCategoryId = ref(null);
const resources = ref([]);

// Modals state
const showSubjectModal = ref(false);
const editingSubject = ref({});
const showCategoryModal = ref(false);
const editingCategory = ref({});
const showResourceModal = ref(false);
const editingResource = ref({ items: [] });
const resourceSubjectIndex = ref(-1);
const resourceCategoryIndex = ref(-1);
const resourceCategories = ref([]); // For picker

const showGenerateModal = ref(false);
const generatingResource = ref(null);
const generateCount = ref(1);
const generatedCodes = ref([]);

const biliQuickInput = ref('');

const codeKeyword = ref('');
const codes = ref([]);

const feedbacks = ref([]);
const feedbackTypeIndex = ref(0); // 0: 全部, 1: 反馈, 2: 推荐

// Batch Selection
const selectedResourceIds = ref([]);
const isAllSelected = computed(() => resources.value.length > 0 && selectedResourceIds.value.length === resources.value.length);

const toggleSelectResource = (id) => {
  const index = selectedResourceIds.value.indexOf(id);
  if (index > -1) {
    selectedResourceIds.value.splice(index, 1);
  } else {
    selectedResourceIds.value.push(id);
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedResourceIds.value = [];
  } else {
    selectedResourceIds.value = resources.value.map(r => r.id);
  }
};

// Batch Modal
const showBatchModal = ref(false);
const batchType = ref('resource'); // 'resource' or 'subject' or 'category'
const targetSubjectId = ref(null);
const targetCategoryId = ref(null);
const batchData = ref({ requires_redemption: -1, is_public: -1, category_id: null });
const batchCategoryIndex = ref(0);

const allCategories = computed(() => {
  const cats = [{ id: null, name: '不修改' }];
  subjects.value.forEach(sub => {
    if (sub.categories) {
      sub.categories.forEach(cat => {
        cats.push({ id: cat.id, name: `${sub.name} > ${cat.name}` });
      });
    }
  });
  return cats;
});

const onBatchCategoryChange = (e) => {
  batchCategoryIndex.value = e.detail.value;
  batchData.value.category_id = allCategories.value[e.detail.value].id;
};

const openBatchResourceModal = () => {
  if (selectedResourceIds.value.length === 0) return;
  batchType.value = 'resource';
  batchData.value = { requires_redemption: -1, is_public: -1, category_id: null };
  batchCategoryIndex.value = 0;
  showBatchModal.value = true;
};

const openBatchSubjectModal = (sub) => {
  batchType.value = 'subject';
  targetSubjectId.value = sub.id;
  batchData.value = { requires_redemption: -1, is_public: -1 };
  showBatchModal.value = true;
};

const openBatchCategoryModal = (cat) => {
  batchType.value = 'category';
  targetCategoryId.value = cat.id;
  batchData.value = { requires_redemption: -1, is_public: -1 };
  showBatchModal.value = true;
};

const applyBatch = async () => {
  const data = {};
  if (batchData.value.requires_redemption !== -1) data.requires_redemption = batchData.value.requires_redemption;
  if (batchData.value.is_public !== -1) data.is_public = batchData.value.is_public;
  if (batchType.value === 'resource' && batchData.value.category_id) data.category_id = batchData.value.category_id;

  if (Object.keys(data).length === 0) {
    uni.showToast({ title: '未做任何修改', icon: 'none' });
    return;
  }

  uni.showLoading({ title: '处理中...' });
  try {
    let res;
    if (batchType.value === 'resource') {
      res = await adminVideoApi.batchUpdateResources(selectedResourceIds.value, data);
    } else if (batchType.value === 'subject') {
      res = await adminVideoApi.batchUpdateBySubject(targetSubjectId.value, data);
    } else if (batchType.value === 'category') {
      res = await adminVideoApi.batchUpdateByCategory(targetCategoryId.value, data);
    }

    if (res.code === 0) {
      uni.showToast({ title: '修改成功' });
      showBatchModal.value = false;
      fetchResources();
      if (batchType.value === 'resource') selectedResourceIds.value = [];
    } else {
      uni.showToast({ title: res.message || '修改失败', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '操作出错', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const batchDelete = async () => {
  uni.showModal({
    title: '批量删除确认',
    content: `确定要删除选中的 ${selectedResourceIds.value.length} 个资源吗？此操作不可恢复。`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          const result = await adminVideoApi.batchDeleteResources(selectedResourceIds.value);
          if (result.code === 0) {
            uni.showToast({ title: '删除成功' });
            showBatchModal.value = false;
            selectedResourceIds.value = [];
            fetchResources();
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' });
          }
        } catch (e) {
          uni.showToast({ title: '操作出错', icon: 'none' });
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

onMounted(() => {
  fetchSubjects();
});

watch(activeTab, (val) => {
  if (val === 'code') {
    fetchCodes();
  } else if (val === 'feedback') {
    fetchFeedbacks();
  }
});

const handleBack = () => {
  uni.navigateBack();
};

const copyText = (text) => {
  if (!text) return;
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '已复制' })
  });
};

const copyExternalLink = (res) => {
  if (!res || !res.vid) return;
  // Use a relative path or get current origin
  const origin = window.location.origin || '';
  const url = `${origin}/#/pages/video/video-detail?vid=${res.vid}`;
  copyText(url);
};

const formatDate = (str) => {
  if (!str) return '-';
  return new Date(str).toLocaleString();
};

// --- Subjects & Categories ---
const fetchSubjects = async () => {
  try {
    const res = await adminVideoApi.getSubjects();
    if (res.code === 0) {
      subjects.value = res.data;
      // Also fetch categories for each subject (simplified: API could return tree, but here separate)
      // Actually my backend model getTree() returns nested structure.
      // So subjects.value already has categories.
    }
  } catch (e) {
    console.error(e);
  }
};

const selectSubject = (sub) => {
  selectedSubjectId.value = sub.id;
  selectedCategoryId.value = null;
  fetchResources();
};

const selectCategory = (sub, cat) => {
  selectedSubjectId.value = sub.id;
  selectedCategoryId.value = cat.id;
  fetchResources();
};

const currentBreadcrumb = computed(() => {
  if (selectedCategoryId.value) {
     const sub = subjects.value.find(s => s.id === selectedSubjectId.value);
     const cat = sub?.categories?.find(c => c.id === selectedCategoryId.value);
     return `${sub?.name || ''} / ${cat?.name || ''}`;
  } else if (selectedSubjectId.value) {
     const sub = subjects.value.find(s => s.id === selectedSubjectId.value);
     return sub?.name || '未选择';
  }
  return '全部资源';
});

// Subject CRUD
const openSubjectModal = (sub = null) => {
  if (sub) {
    editingSubject.value = { ...sub };
  } else {
    editingSubject.value = { name: '', sort: 0 };
  }
  showSubjectModal.value = true;
};

const saveSubject = async () => {
  try {
    if (editingSubject.value.id) {
      await adminVideoApi.updateSubject(editingSubject.value.id, editingSubject.value);
    } else {
      await adminVideoApi.createSubject(editingSubject.value);
    }
    showSubjectModal.value = false;
    fetchSubjects();
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

const deleteSubject = async (sub) => {
  uni.showModal({
    title: '确认删除',
    content: `确定删除科目 ${sub.name} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await adminVideoApi.deleteSubject(sub.id);
          fetchSubjects();
        } catch (e) {
          uni.showToast({ title: '删除失败，可能含有下级', icon: 'none' });
        }
      }
    }
  });
};

// Category CRUD
const openCategoryModal = (sub, cat = null) => {
  if (cat) {
    editingCategory.value = { ...cat, subjectName: sub.name, parent_id: sub.id };
  } else {
    editingCategory.value = { name: '', sort: 0, subjectName: sub.name, parent_id: sub.id };
  }
  showCategoryModal.value = true;
};

const saveCategory = async () => {
  try {
    if (editingCategory.value.id) {
      await adminVideoApi.updateCategory(editingCategory.value.id, editingCategory.value);
    } else {
      await adminVideoApi.createCategory(editingCategory.value);
    }
    showCategoryModal.value = false;
    fetchSubjects();
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

const deleteCategory = async (cat) => {
  uni.showModal({
    title: '确认删除',
    content: `确定删除分类 ${cat.name} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await adminVideoApi.deleteCategory(cat.id);
          fetchSubjects();
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

// --- Resources ---
const fetchResources = async () => {
  const params = {};
  if (selectedCategoryId.value) params.category_id = selectedCategoryId.value;
  else if (selectedSubjectId.value) params.subject_id = selectedSubjectId.value;
  
  try {
    const res = await adminVideoApi.getResources(params);
    if (res.code === 0) {
      resources.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const openResourceModal = async (res = null) => {
  // Init picker data
  if (subjects.value.length > 0) {
      if (!res) {
          // New: set default subject/category based on selection
          const defaultSubIdx = subjects.value.findIndex(s => s.id === selectedSubjectId.value);
          resourceSubjectIndex.value = defaultSubIdx >= 0 ? defaultSubIdx : 0;
          updateResourceCategories();
          
          const defaultCatIdx = resourceCategories.value.findIndex(c => c.id === selectedCategoryId.value);
          resourceCategoryIndex.value = defaultCatIdx >= 0 ? defaultCatIdx : 0;
      }
  }

  if (res) {
    const detailRes = await adminVideoApi.getResourceDetail(res.id);
    let data = detailRes.data ? detailRes.data : { ...res, items: [] };
    
    // Decrypt URLs for editing
    if (data.items) {
      data.items.forEach(item => {
        if (item.url) item.url = decryptVideoUrl(item.url);
        if (item.bili_link) item.bili_link = decryptVideoUrl(item.bili_link);
      });
    }
    if (data.bili_link) data.bili_link = decryptVideoUrl(data.bili_link);

    editingResource.value = data;
    
    // Set picker indices
    const subIdx = subjects.value.findIndex(s => s.id === (editingResource.value.subject_id || (res.category_id && findSubjectIdByCatId(res.category_id))));
    resourceSubjectIndex.value = subIdx >= 0 ? subIdx : 0;
    updateResourceCategories();
    const catIdx = resourceCategories.value.findIndex(c => c.id === editingResource.value.category_id);
    resourceCategoryIndex.value = catIdx >= 0 ? catIdx : 0;
  } else {
    editingResource.value = {
      title: '',
      cover_url: '',
      description: '',
      type: 'single',
      requires_redemption: 0,
      is_public: 1,
      items: [],
      category_id: resourceCategories.value[resourceCategoryIndex.value]?.id
    };
    biliQuickInput.value = '';
  }
  showResourceModal.value = true;
};

const findSubjectIdByCatId = (catId) => {
    for (let s of subjects.value) {
        if (s.categories && s.categories.find(c => c.id === catId)) return s.id;
    }
    return null;
};

const updateResourceCategories = () => {
    const sub = subjects.value[resourceSubjectIndex.value];
    resourceCategories.value = sub ? (sub.categories || []) : [];
    resourceCategoryIndex.value = 0;
};

const onResourceSubjectChange = (e) => {
    resourceSubjectIndex.value = e.detail.value;
    updateResourceCategories();
};

const onResourceCategoryChange = (e) => {
    resourceCategoryIndex.value = e.detail.value;
};

const handleBiliParse = async () => {
    if (!biliQuickInput.value) {
        uni.showToast({ title: '请输入B站分享文字', icon: 'none' });
        return;
    }

    // Extract URL from input text
    const urlMatch = biliQuickInput.value.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) {
        uni.showToast({ title: '未找到有效链接', icon: 'none' });
        return;
    }

    const url = urlMatch[0];
    uni.showLoading({ title: '解析中...' });
    try {
        const res = await adminVideoApi.parseBiliLink(url);
        uni.hideLoading();
        if (res.code === 0) {
            const data = res.data;
            // 如果主标题为空，则填充主标题
            if (!editingResource.value.title) {
                editingResource.value.title = data.title;
            }
            // 填充主链接和封面等
            editingResource.value.bili_link = data.bili_link || editingResource.value.bili_link;
            editingResource.value.cover_url = data.cover_url || editingResource.value.cover_url;
            editingResource.value.description = data.description || editingResource.value.description;
            
            // 自动添加到视频列表
            if (!editingResource.value.items) editingResource.value.items = [];
            editingResource.value.items.push({
                title: data.title,
                bili_link: data.bili_link,
                url: '',
                duration: ''
            });

            uni.showToast({ title: '识别成功', icon: 'success' });
        } else {
            uni.showToast({ title: res.message || '识别失败', icon: 'none' });
        }
    } catch (e) {
        uni.hideLoading();
        uni.showToast({ title: '解析出错', icon: 'none' });
    }
};

const addVideoItem = () => {
    editingResource.value.items.push({ title: '', url: '', duration: '' });
};

const removeVideoItem = (idx) => {
    editingResource.value.items.splice(idx, 1);
};

const saveResource = async () => {
    const cat = resourceCategories.value[resourceCategoryIndex.value];
    if (!cat) {
        uni.showToast({ title: '请选择分类', icon: 'none' });
        return;
    }
    
    // Create a copy to avoid encrypting the UI data directly
    const dataToSave = JSON.parse(JSON.stringify(editingResource.value));
    dataToSave.category_id = cat.id;

    // Encrypt URLs before saving if needed (Wait, if the user wants the database to be unreadable, we should encrypt here)
    // However, the backend expects raw URLs and encrypts them for the response.
    // To satisfy "cannot be seen patterns by others", we should encrypt in the database too.
    if (dataToSave.items) {
      dataToSave.items.forEach(item => {
        if (item.url) item.url = encryptVideoUrl(item.url);
        if (item.bili_link) item.bili_link = encryptVideoUrl(item.bili_link);
      });
    }
    if (dataToSave.bili_link) dataToSave.bili_link = encryptVideoUrl(dataToSave.bili_link);

    try {
        if (dataToSave.id) {
            await adminVideoApi.updateResource(dataToSave.id, dataToSave);
        } else {
            await adminVideoApi.createResource(dataToSave);
        }
        showResourceModal.value = false;
        fetchResources();
    } catch (e) {
        uni.showToast({ title: '保存失败', icon: 'none' });
    }
};

const deleteResource = async (res) => {
    uni.showModal({
        title: '确认删除',
        content: `确定删除 ${res.title} 吗？`,
        success: async (r) => {
            if (r.confirm) {
                await adminVideoApi.deleteResource(res.id);
                fetchResources();
            }
        }
    });
};

// --- Codes ---
const openGenerateCodeModal = (res) => {
    generatingResource.value = res;
    generateCount.value = 1;
    generatedCodes.value = [];
    showGenerateModal.value = true;
};

const openBatchGenerateModal = () => {
    generatingResource.value = { id: selectedResourceIds.value.join(','), title: `已选 ${selectedResourceIds.value.length} 个项目` };
    generateCount.value = 1;
    generatedCodes.value = [];
    showGenerateModal.value = true;
};

const confirmGenerate = async () => {
    try {
        const res = await adminVideoApi.generateCodes({
            resourceIds: Array.isArray(generatingResource.value.id) ? generatingResource.value.id : generatingResource.value.id.toString().split(','),
            count: generateCount.value
        });
        if (res.code === 0) {
            generatedCodes.value = res.data;
        }
    } catch (e) {
        uni.showToast({ title: '生成失败', icon: 'none' });
    }
};

const copyCodes = () => {
    uni.setClipboardData({
        data: generatedCodes.value.join('\n'),
        success: () => uni.showToast({ title: '已复制' })
    });
};

const fetchCodes = async () => {
    try {
        const res = await adminVideoApi.getCodes({ keyword: codeKeyword.value });
        if (res.code === 0) codes.value = res.data;
    } catch (e) {
        console.error(e);
    }
};

// --- Feedbacks ---
const fetchFeedbacks = async () => {
    try {
        const typeMap = ['', 'feedback', 'recommend'];
        const params = {};
        if (feedbackTypeIndex.value > 0) {
            params.type = typeMap[feedbackTypeIndex.value];
        }
        const res = await adminVideoApi.getFeedbacks(params);
        if (res.code === 0) {
            feedbacks.value = res.data;
        }
    } catch (e) {
        console.error(e);
    }
};

const onFeedbackTypeChange = (e) => {
    feedbackTypeIndex.value = e.detail.value;
    fetchFeedbacks();
};
</script>

<style scoped>
/* Reuse styles from public-management mostly */
.admin-container { height: 100vh; display: flex; flex-direction: column; background-color: #f5f7fa; }
.admin-header { height: 60px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.header-left { display: flex; align-items: center; gap: 12px; }
.admin-logo { font-size: 20px; font-weight: bold; color: #2b5cff; }
.admin-title { font-size: 16px; color: #1f1f1f; }
.admin-user { display: flex; align-items: center; gap: 16px; font-size: 14px; }
.logout-btn { color: #8c8c8c; cursor: pointer; }
.main-content { flex: 1; display: flex; overflow: hidden; }
.sidebar { width: 200px; background: #fff; border-right: 1px solid #f0f0f0; padding-top: 16px; }
.sidebar-item { display: flex; align-items: center; padding: 12px 24px; cursor: pointer; color: #595959; font-size: 14px; gap: 10px; }
.sidebar-item.active { background: #e6f7ff; color: #2b5cff; border-right: 3px solid #2b5cff; }
.tab-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.manage-layout { display: flex; height: 100%; }
.manage-sidebar { width: 240px; background: #fafafa; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; }
.section-header-row { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; }
.section-title { font-weight: 600; font-size: 15px; }
.btn-add-mini { width: 24px; height: 24px; border-radius: 4px; background: #2b5cff; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; line-height: 1; padding: 0; border: none; cursor: pointer; }

.subject-list { flex: 1; overflow-y: auto; }
.subject-group { border-bottom: 1px solid #f5f5f5; }
.subject-item { padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: 500; font-size: 14px; }
.subject-item:hover, .category-item:hover { background: #f0f0f0; }
.subject-item.active { color: #2b5cff; background: #e6f7ff; }
.category-list { background: #fff; }
.category-item { padding: 8px 16px 8px 32px; font-size: 13px; color: #666; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.category-item.active { color: #2b5cff; background: #e6f7ff; }

.subject-actions, .category-actions { display: none; gap: 6px; }
.subject-item:hover .subject-actions, .category-item:hover .category-actions { display: flex; }
.action-icon-mini { font-size: 12px; color: #999; padding: 2px 4px; }
.action-icon-mini:hover { color: #2b5cff; }
.action-icon-mini.delete:hover { color: #ff4d4f; }
.action-icon-mini.add:hover { color: #52c41a; }

.manage-main { flex: 1; display: flex; flex-direction: column; background: #fff; padding: 20px; overflow: hidden; }
.content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.h2 { font-size: 18px; font-weight: 600; }
.btn-primary-small { background: #2b5cff; color: #fff; font-size: 13px; padding: 6px 16px; border-radius: 4px; border: none; cursor: pointer; }
.btn-batch { background: #faad14; color: #fff; border: none; padding: 4px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; margin-right: 10px; }
.btn-batch-code { background: #52c41a; color: #fff; border: none; padding: 4px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; margin-right: 10px; }
.btn-delete-batch { background: #ff4d4f; color: #fff; border: none; padding: 4px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; }

.resource-list { flex: 1; overflow-y: auto; }
.resource-card { display: flex; padding: 16px; border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 16px; transition: all 0.3s; }
.resource-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.res-cover { width: 120px; height: 80px; border-radius: 4px; background: #eee; margin-right: 16px; }
.res-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.res-title { font-size: 16px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px; }
.tag { font-size: 10px; padding: 2px 6px; border-radius: 2px; color: #fff; }
.tag-collection { background: #722ed1; }
.tag-single { background: #13c2c2; }
.res-meta { display: flex; gap: 8px; font-size: 12px; align-items: center; flex-wrap: wrap; }
.status-badge { padding: 2px 6px; border-radius: 2px; background: #f5f5f5; color: #666; }
.status-badge.lock { background: #fff1f0; color: #f5222d; }
.status-badge.free { background: #f6ffed; color: #52c41a; }
.status-badge.public { background: #e6f7ff; color: #1890ff; }
.status-badge.private { background: #fffbe6; color: #faad14; }
.vid-text { font-size: 11px; color: #8c8c8c; font-family: monospace; background: #f0f0f0; padding: 0 4px; border-radius: 2px; }

.vid-display-row { display: flex; align-items: center; background: #f5f5f5; padding: 4px 10px; border-radius: 4px; }
.vid-display-row .value { font-family: monospace; color: #2b5cff; font-weight: bold; flex: 1; }
.ml-10 { margin-left: 10px; }
.tip { font-size: 12px; color: #999; margin-top: 4px; display: block; }
.res-desc { font-size: 13px; color: #888; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.res-actions { display: flex; flex-direction: column; gap: 8px; justify-content: center; margin-left: 16px; }
.action-btn { font-size: 12px; padding: 4px 12px; background: #fff; border: 1px solid #d9d9d9; border-radius: 4px; color: #666; cursor: pointer; }
.action-btn:hover { color: #2b5cff; border-color: #2b5cff; }
.action-btn.delete:hover { color: #ff4d4f; border-color: #ff4d4f; }

/* Code Table */
.filter-row { display: flex; gap: 10px; }
.search-input { border: 1px solid #d9d9d9; padding: 6px 12px; border-radius: 4px; width: 200px; font-size: 13px; }
.search-btn { background: #f0f0f0; border: none; padding: 6px 16px; font-size: 13px; border-radius: 4px; cursor: pointer; }
.table-container { flex: 1; overflow-y: auto; background: #fff; border-radius: 8px; border: 1px solid #f0f0f0; }
.table-header { display: flex; background: #fafafa; padding: 12px; font-weight: 600; font-size: 13px; color: #555; border-bottom: 1px solid #f0f0f0; }
.tr { display: flex; padding: 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333; }
.tr:hover { background: #f9f9f9; }
.th, .td { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 8px; }
.code-text { font-family: monospace; font-weight: bold; color: #2b5cff; }
.text-danger { color: #ff4d4f; }
.text-success { color: #52c41a; }

/* Modal */
.modal-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { width: 400px; background: #fff; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.15); }
.large-content { width: 600px; height: 80vh; }
.modal-header { padding: 16px 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 16px; }
.close-btn { font-size: 20px; cursor: pointer; color: #999; }
.modal-body { padding: 24px; flex: 1; overflow-y: auto; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 12px; }
.btn-cancel { background: #fff; border: 1px solid #d9d9d9; padding: 6px 20px; border-radius: 4px; font-size: 14px; cursor: pointer; }
.btn-confirm { background: #2b5cff; color: #fff; border: none; padding: 6px 20px; border-radius: 4px; font-size: 14px; cursor: pointer; }

.form-item { margin-bottom: 16px; }
.form-row { display: flex; gap: 20px; }
.label { display: block; margin-bottom: 8px; font-size: 13px; color: #666; }
.input, .picker-box { width: 100%; height: 36px; border: 1px solid #d9d9d9; border-radius: 4px; padding: 0 12px; font-size: 14px; display: flex; align-items: center; box-sizing: border-box; }
.textarea { width: 100%; height: 80px; border: 1px solid #d9d9d9; border-radius: 4px; padding: 8px; font-size: 14px; box-sizing: border-box; }
.codes-area { height: 150px; font-family: monospace; }
.radio-group { display: flex; gap: 16px; }
.radio { display: flex; align-items: center; font-size: 14px; margin-right: 12px; }
.btn-copy { margin-top: 8px; font-size: 12px; padding: 4px 12px; }

.items-section { margin-top: 20px; border-top: 1px dashed #eee; padding-top: 16px; }
.section-head { display: flex; justify-content: space-between; margin-bottom: 12px; }
.title { font-weight: 600; font-size: 14px; }
.video-item-edit { background: #f9f9f9; padding: 12px; border-radius: 4px; margin-bottom: 10px; }
.item-row { display: flex; align-items: center; gap: 10px; }
.idx { width: 20px; text-align: center; font-weight: bold; color: #999; }
.flex-1 { flex: 1; }
.w-100 { width: 100px; }
.full-width { width: 100%; }
.del-btn { color: #ff4d4f; cursor: pointer; font-size: 18px; padding: 0 8px; }
.mt-5 { margin-top: 5px; }
.ml-5 { margin-left: 5px; }

/* Feedback styles */
.feedback-list { flex: 1; overflow-y: auto; padding: 0 10px; }
.feedback-card { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.fb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.fb-user { display: flex; align-items: center; gap: 8px; }
.fb-avatar { width: 32px; height: 32px; border-radius: 50%; background: #f0f0f0; }
.fb-nickname { font-size: 14px; font-weight: 600; color: #333; }
.fb-meta { display: flex; align-items: center; gap: 8px; }
.fb-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; color: #fff; }
.fb-tag.feedback { background: #faad14; }
.fb-tag.recommend { background: #52c41a; }
.fb-time { font-size: 12px; color: #999; }
.fb-target { font-size: 13px; color: #666; margin-bottom: 10px; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; }
.fb-target .label { color: #888; margin-right: 4px; display: inline; }
.fb-target .value { color: #2b5cff; font-weight: 500; }
.fb-content { font-size: 14px; color: #444; line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
.empty-text { text-align: center; padding: 40px; color: #999; font-size: 14px; }
.type-filter { display: flex; align-items: center; gap: 8px; margin-right: 16px; }
.filter-label { font-size: 13px; color: #666; }
.picker-box.mini { height: 30px; padding: 0 10px; font-size: 13px; min-width: 80px; }
</style>
