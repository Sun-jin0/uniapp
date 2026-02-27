<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-back" @click="handleBack">← 返回</view>
      <view class="nav-title">视频课程管理</view>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 标签切换 -->
    <view class="tab-bar">
      <view 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-item" 
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view scroll-y class="content" :show-scrollbar="false" :enhanced="true">
      <!-- 内容管理 -->
      <template v-if="activeTab === 'content'">
        <!-- 分类选择器 -->
        <view class="section-card">
          <view class="section-header">
            <text class="section-title">科目分类</text>
            <button class="btn-text" @click="openSubjectModal()">+ 添加科目</button>
          </view>
          <scroll-view scroll-x class="subject-scroll" :show-scrollbar="false">
            <view class="subject-tags">
              <view 
                class="subject-tag" 
                :class="{ active: !selectedSubjectId }"
                @click="selectSubject(null)"
              >
                全部
              </view>
              <view 
                v-for="sub in subjects" 
                :key="sub.id"
                class="subject-tag" 
                :class="{ active: selectedSubjectId === sub.id && !selectedCategoryId }"
                @click="selectSubject(sub)"
              >
                {{ sub.name }}
              </view>
            </view>
          </scroll-view>
          <!-- 子分类 -->
          <view v-if="currentCategories.length" class="category-tags">
            <view 
              class="category-tag" 
              :class="{ active: selectedCategoryId === null && selectedSubjectId }"
              @click="selectedCategoryId = null; fetchResources();"
            >
              全部
            </view>
            <view 
              v-for="cat in currentCategories" 
              :key="cat.id"
              class="category-tag" 
              :class="{ active: selectedCategoryId === cat.id }"
              @click="selectCategory(currentSubject, cat)"
            >
              {{ cat.name }}
            </view>
          </view>
        </view>

        <!-- 操作栏 -->
        <view class="action-bar">
          <button class="btn-primary" @click="openResourceModal()">+ 新建视频</button>
          <button v-if="selectedResourceIds.length" class="btn-warning" @click="openBatchResourceModal">
            批量({{ selectedResourceIds.length }})
          </button>
        </view>

        <!-- 视频列表 -->
        <view class="list-card">
          <view v-if="resources.length === 0" class="empty-state">
            <text class="empty-icon">🎬</text>
            <text class="empty-text">暂无视频资源</text>
          </view>
          <view 
            v-for="res in resources" 
            :key="res.id" 
            class="video-item"
            :class="{ selected: selectedResourceIds.includes(res.id) }"
          >
            <checkbox 
              :checked="selectedResourceIds.includes(res.id)" 
              @click="toggleSelectResource(res.id)"
              class="item-checkbox"
            />
            <image 
              :src="res.cover_url || '/static/default-video.png'" 
              mode="aspectFill" 
              class="item-cover"
              @click="toggleSelectResource(res.id)"
            />
            <view class="item-body" @click="openResourceModal(res)">
              <view class="item-title">
                <text class="type-badge" :class="res.type">{{ res.type === 'collection' ? '合集' : '单集' }}</text>
                <text class="title-text">{{ res.title }}</text>
              </view>
              <view class="item-meta">
                <text class="meta-badge" :class="res.requires_redemption ? 'lock' : 'free'">
                  {{ res.requires_redemption ? '需兑换' : '免费' }}
                </text>
                <text class="meta-badge" :class="res.is_public ? 'public' : 'private'">
                  {{ res.is_public ? '公开' : '隐藏' }}
                </text>
              </view>
            </view>
            <view class="item-actions">
              <text class="action-btn code" @click.stop="openGenerateCodeModal(res)">🔑</text>
              <text class="action-btn delete" @click.stop="deleteResource(res)">🗑</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 合集管理 -->
      <template v-if="activeTab === 'collections'">
        <view class="action-bar">
          <button class="btn-primary" @click="openCollectionModal()">+ 新建合集</button>
        </view>
        <view class="list-card">
          <view v-if="collections.length === 0" class="empty-state">
            <text class="empty-icon">📚</text>
            <text class="empty-text">暂无合集</text>
          </view>
          <view v-for="col in collections" :key="col.id" class="collection-item">
            <view class="collection-header">
              <view class="collection-title-wrap">
                <text class="collection-name">{{ col.name }}</text>
                <text class="collection-status" :class="col.is_active ? 'active' : 'inactive'">
                  {{ col.is_active ? '启用' : '禁用' }}
                </text>
              </view>
              <text class="collection-sort">排序: {{ col.sort }}</text>
            </view>
            <text class="collection-desc">{{ col.description || '暂无描述' }}</text>
            <view class="collection-actions">
              <button class="btn-small" @click="openCollectionVideosModal(col)">管理视频</button>
              <button class="btn-small success" @click="openCollectionCodeModal(col)">兑换码</button>
              <button class="btn-small" @click="openCollectionModal(col)">编辑</button>
              <button class="btn-small danger" @click="deleteCollection(col)">删除</button>
            </view>
          </view>
        </view>
      </template>

      <!-- 兑换码管理 -->
      <template v-if="activeTab === 'code'">
        <view class="section-card">
          <view class="search-bar">
            <input 
              v-model="codeKeyword" 
              class="search-input" 
              placeholder="搜索兑换码..."
              @confirm="fetchCodes"
            />
            <button class="btn-search" @click="fetchCodes">搜索</button>
          </view>
        </view>
        <view class="list-card">
          <view v-if="codes.length === 0" class="empty-state">
            <text class="empty-icon">🔑</text>
            <text class="empty-text">暂无兑换码</text>
          </view>
          <view v-for="code in codes" :key="code.id" class="code-item">
            <view class="code-main">
              <text class="code-value">{{ code.code }}</text>
              <text class="code-resource">{{ code.resource_title || code.collection_name || '-' }}</text>
            </view>
            <view class="code-status">
              <text class="status-badge" :class="code.is_used ? 'used' : 'unused'">
                {{ code.is_used ? '已使用' : '未使用' }}
              </text>
              <text v-if="code.used_by_student_id" class="used-by">{{ code.used_by_student_id }}</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 反馈与推荐 -->
      <template v-if="activeTab === 'feedback'">
        <view class="section-card">
          <picker @change="onFeedbackTypeChange" :value="feedbackTypeIndex" :range="feedbackTypes">
            <view class="picker-view">
              <text>{{ feedbackTypes[feedbackTypeIndex] }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="list-card">
          <view v-if="feedbacks.length === 0" class="empty-state">
            <text class="empty-icon">💬</text>
            <text class="empty-text">暂无反馈</text>
          </view>
          <view v-for="fb in feedbacks" :key="fb.id" class="feedback-item">
            <view class="feedback-header">
              <text class="feedback-type" :class="fb.type">{{ fb.type === 'feedback' ? '反馈' : '推荐' }}</text>
              <text class="feedback-user">{{ fb.nickname }}</text>
              <text class="feedback-time">{{ formatDate(fb.created_at) }}</text>
            </view>
            <text class="feedback-content">{{ fb.content }}</text>
            <text v-if="fb.resource_title" class="feedback-resource">相关: {{ fb.resource_title }}</text>
          </view>
        </view>
      </template>
    </scroll-view>

    <!-- 弹窗: 科目编辑 -->
    <view v-if="showSubjectModal" class="modal-mask" @click="showSubjectModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>{{ editingSubject.id ? '编辑科目' : '新建科目' }}</text>
          <text class="modal-close" @click="showSubjectModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">科目名称</text>
            <input v-model="editingSubject.name" class="form-input" placeholder="请输入科目名称" />
          </view>
          <view class="form-item">
            <text class="form-label">排序</text>
            <input v-model.number="editingSubject.sort" type="number" class="form-input" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showSubjectModal = false">取消</button>
          <button class="btn-confirm" @click="saveSubject">保存</button>
        </view>
      </view>
    </view>

    <!-- 弹窗: 分类编辑 -->
    <view v-if="showCategoryModal" class="modal-mask" @click="showCategoryModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>{{ editingCategory.id ? '编辑分类' : '新建分类' }}</text>
          <text class="modal-close" @click="showCategoryModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">所属科目</text>
            <text class="form-static">{{ editingCategory.subjectName }}</text>
          </view>
          <view class="form-item">
            <text class="form-label">分类名称</text>
            <input v-model="editingCategory.name" class="form-input" placeholder="请输入分类名称" />
          </view>
          <view class="form-item">
            <text class="form-label">排序</text>
            <input v-model.number="editingCategory.sort" type="number" class="form-input" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showCategoryModal = false">取消</button>
          <button class="btn-confirm" @click="saveCategory">保存</button>
        </view>
      </view>
    </view>

    <!-- 弹窗: 视频编辑 -->
    <view v-if="showResourceModal" class="modal-mask" @click="showResourceModal = false">
      <view class="modal-content modal-large" @click.stop>
        <view class="modal-header">
          <text>{{ editingResource.id ? '编辑视频' : '新建视频' }}</text>
          <text class="modal-close" @click="showResourceModal = false">×</text>
        </view>
        <scroll-view scroll-y class="modal-body" :show-scrollbar="false" :enhanced="true">
          <view class="form-item">
            <text class="form-label">归属科目</text>
            <view class="custom-select" @click="showSubjectSelector = true">
              <text class="select-text">{{ subjects[resourceSubjectIndex]?.name || '请选择科目' }}</text>
              <text class="select-arrow">▼</text>
            </view>
          </view>
          <view class="form-item" v-if="resourceCategories.length > 0">
            <text class="form-label">归属分类</text>
            <view class="custom-select" @click="showCategorySelector = true">
              <text class="select-text">{{ resourceCategories[resourceCategoryIndex]?.name || '请选择分类' }}</text>
              <text class="select-arrow">▼</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">B站快速识别</text>
            <view class="input-with-btn">
              <input v-model="biliQuickInput" class="form-input flex-1" placeholder="粘贴B站分享文字" />
              <button class="btn-small" @click="handleBiliParse">识别</button>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">标题</text>
            <input v-model="editingResource.title" class="form-input" placeholder="请输入标题" />
          </view>
          <view class="form-item">
            <text class="form-label">B站链接</text>
            <input v-model="editingResource.bili_link" class="form-input" placeholder="合集主链接/单集链接" />
          </view>
          <view class="form-item">
            <text class="form-label">封面URL</text>
            <input v-model="editingResource.cover_url" class="form-input" placeholder="封面图片URL" />
          </view>
          <view class="form-item">
            <text class="form-label">简介</text>
            <textarea v-model="editingResource.description" class="form-textarea" placeholder="请输入简介" />
          </view>
          <view class="form-row">
            <view class="form-item flex-1">
              <text class="form-label">类型</text>
              <radio-group @change="e => editingResource.type = e.detail.value">
                <label class="radio-label">
                  <radio value="single" :checked="editingResource.type === 'single'" />单集
                </label>
                <label class="radio-label">
                  <radio value="collection" :checked="editingResource.type === 'collection'" />合集
                </label>
              </radio-group>
            </view>
            <view class="form-item flex-1">
              <text class="form-label">权限</text>
              <radio-group @change="e => editingResource.requires_redemption = parseInt(e.detail.value)">
                <label class="radio-label">
                  <radio :value="0" :checked="editingResource.requires_redemption === 0" />免费
                </label>
                <label class="radio-label">
                  <radio :value="1" :checked="editingResource.requires_redemption === 1" />需兑换
                </label>
              </radio-group>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">公开状态</text>
            <switch :checked="editingResource.is_public === 1" @change="e => editingResource.is_public = e.detail.value ? 1 : 0" />
          </view>
          <!-- 视频列表 -->
          <view class="video-list-section">
            <view class="section-title-row">
              <text>视频列表 ({{ editingResource.items?.length || 0 }})</text>
              <button class="btn-text" @click="addVideoItem">+ 添加</button>
            </view>
            <view v-for="(item, idx) in editingResource.items" :key="idx" class="video-list-item">
              <text class="item-index">{{ idx + 1 }}</text>
              <input v-model="item.title" class="form-input flex-1" placeholder="标题" />
              <input v-model="item.url" class="form-input flex-2" placeholder="视频URL" />
              <text class="delete-btn" @click="removeVideoItem(idx)">×</text>
            </view>
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showResourceModal = false">取消</button>
          <button class="btn-confirm" @click="saveResource">保存</button>
        </view>
      </view>
    </view>

    <!-- 弹窗: 生成兑换码 -->
    <view v-if="showGenerateModal" class="modal-mask" @click="showGenerateModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>生成兑换码</text>
          <text class="modal-close" @click="showGenerateModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">资源</text>
            <text class="form-static">{{ generatingResource?.title }}</text>
          </view>
          <view class="form-item">
            <text class="form-label">生成数量</text>
            <input v-model.number="generateCount" type="number" class="form-input" min="1" max="100" />
          </view>
          <view v-if="generatedCodes.length" class="codes-result">
            <text class="result-title">生成的兑换码</text>
            <scroll-view scroll-y class="codes-list" :show-scrollbar="false" :enhanced="true">
              <view v-for="(code, idx) in generatedCodes" :key="idx" class="code-row">
                <text class="code-text">{{ code }}</text>
                <button class="btn-text" @click="copyText(code)">复制</button>
              </view>
            </scroll-view>
            <button class="btn-primary full-width" @click="copyCodes">复制全部</button>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showGenerateModal = false">关闭</button>
          <button v-if="!generatedCodes.length" class="btn-confirm" @click="confirmGenerate">生成</button>
        </view>
      </view>
    </view>

    <!-- 弹窗: 批量操作 -->
    <view v-if="showBatchModal" class="modal-mask" @click="showBatchModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>批量操作 ({{ selectedResourceIds.length }}项)</text>
          <text class="modal-close" @click="showBatchModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">观看权限</text>
            <radio-group @change="e => batchData.requires_redemption = parseInt(e.detail.value)">
              <label class="radio-label"><radio :value="-1" :checked="batchData.requires_redemption === -1" />不修改</label>
              <label class="radio-label"><radio :value="0" :checked="batchData.requires_redemption === 0" />免费</label>
              <label class="radio-label"><radio :value="1" :checked="batchData.requires_redemption === 1" />需兑换</label>
            </radio-group>
          </view>
          <view class="form-item">
            <text class="form-label">公开状态</text>
            <radio-group @change="e => batchData.is_public = parseInt(e.detail.value)">
              <label class="radio-label"><radio :value="-1" :checked="batchData.is_public === -1" />不修改</label>
              <label class="radio-label"><radio :value="1" :checked="batchData.is_public === 1" />公开</label>
              <label class="radio-label"><radio :value="0" :checked="batchData.is_public === 0" />隐藏</label>
            </radio-group>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showBatchModal = false">取消</button>
          <button class="btn-danger" @click="batchDelete">删除</button>
          <button class="btn-confirm" @click="applyBatch">应用</button>
        </view>
      </view>
    </view>

    <!-- 弹窗: 合集编辑 -->
    <view v-if="showCollectionModal" class="modal-mask" @click="showCollectionModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>{{ editingCollection.id ? '编辑合集' : '新建合集' }}</text>
          <text class="modal-close" @click="showCollectionModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">合集名称</text>
            <input v-model="editingCollection.name" class="form-input" placeholder="请输入合集名称" />
          </view>
          <view class="form-item">
            <text class="form-label">描述</text>
            <textarea v-model="editingCollection.description" class="form-textarea" placeholder="请输入描述" />
          </view>
          <view class="form-item">
            <text class="form-label">封面URL</text>
            <input v-model="editingCollection.cover_url" class="form-input" placeholder="封面图片URL" />
          </view>
          <view class="form-item">
            <text class="form-label">排序</text>
            <input v-model.number="editingCollection.sort" type="number" class="form-input" />
          </view>
          <view class="form-item">
            <text class="form-label">状态</text>
            <switch :checked="editingCollection.is_active === 1" @change="e => editingCollection.is_active = e.detail.value ? 1 : 0" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showCollectionModal = false">取消</button>
          <button class="btn-confirm" @click="saveCollection">保存</button>
        </view>
      </view>
    </view>

    <!-- 弹窗: 合集视频管理 -->
    <view v-if="showCollectionVideosModal" class="modal-mask" @click="showCollectionVideosModal = false">
      <view class="modal-content modal-large" @click.stop>
        <view class="modal-header">
          <text>管理视频 - {{ editingCollectionVideos?.name }}</text>
          <text class="modal-close" @click="showCollectionVideosModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">搜索视频</text>
            <input v-model="videoSearchKeyword" class="form-input" placeholder="输入关键词搜索" />
          </view>
          <scroll-view scroll-y class="video-select-list" :show-scrollbar="false" :enhanced="true">
            <view 
              v-for="resource in filteredAvailableResources" 
              :key="resource.id" 
              class="video-select-item"
              @click="toggleCollectionVideo(resource.id)"
            >
              <checkbox :checked="selectedCollectionVideoIds.includes(resource.id)" />
              <image :src="resource.cover_url || '/static/default-video.png'" mode="aspectFill" class="select-cover" />
              <view class="select-info">
                <text class="select-title">{{ resource.title }}</text>
                <text class="select-meta">{{ resource.subject_name }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showCollectionVideosModal = false">取消</button>
          <button class="btn-confirm" @click="saveCollectionVideos">保存({{ selectedCollectionVideoIds.length }})</button>
        </view>
      </view>
    </view>

    <!-- 弹窗: 合集兑换码 -->
    <view v-if="showCollectionCodeModal" class="modal-mask" @click="showCollectionCodeModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>生成合集兑换码</text>
          <text class="modal-close" @click="showCollectionCodeModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">合集</text>
            <text class="form-static">{{ generatingCollection?.name }}</text>
          </view>
          <view class="form-item">
            <text class="form-label">生成数量</text>
            <input v-model.number="collectionGenerateCount" type="number" class="form-input" min="1" max="100" />
          </view>
          <view v-if="collectionGeneratedCodes.length" class="codes-result">
            <text class="result-title">生成的兑换码</text>
            <scroll-view scroll-y class="codes-list" :show-scrollbar="false" :enhanced="true">
              <view v-for="(code, idx) in collectionGeneratedCodes" :key="idx" class="code-row">
                <text class="code-text">{{ code }}</text>
                <button class="btn-text" @click="copyText(code)">复制</button>
              </view>
            </scroll-view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showCollectionCodeModal = false">关闭</button>
          <button v-if="!collectionGeneratedCodes.length" class="btn-confirm" @click="confirmCollectionCodeGenerate">生成</button>
        </view>
      </view>
    </view>

    <!-- 弹窗: 科目选择器 -->
    <view v-if="showSubjectSelector" class="modal-mask" @click="showSubjectSelector = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>选择科目</text>
          <text class="modal-close" @click="showSubjectSelector = false">×</text>
        </view>
        <scroll-view scroll-y class="selector-list" :show-scrollbar="false" :enhanced="true">
          <view 
            v-for="(sub, index) in subjects" 
            :key="sub.id" 
            class="selector-item"
            :class="{ active: resourceSubjectIndex === index }"
            @click="selectResourceSubject(index)"
          >
            <text class="selector-text">{{ sub.name }}</text>
            <text v-if="resourceSubjectIndex === index" class="selector-check">✓</text>
          </view>
          <view v-if="subjects.length === 0" class="empty-state">
            <text class="empty-text">暂无科目，请先添加</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 弹窗: 分类选择器 -->
    <view v-if="showCategorySelector" class="modal-mask" @click="showCategorySelector = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>选择分类</text>
          <text class="modal-close" @click="showCategorySelector = false">×</text>
        </view>
        <scroll-view scroll-y class="selector-list" :show-scrollbar="false" :enhanced="true">
          <view 
            v-for="(cat, index) in resourceCategories" 
            :key="cat.id" 
            class="selector-item"
            :class="{ active: resourceCategoryIndex === index }"
            @click="selectResourceCategory(index)"
          >
            <text class="selector-text">{{ cat.name }}</text>
            <text v-if="resourceCategoryIndex === index" class="selector-check">✓</text>
          </view>
          <view v-if="resourceCategories.length === 0" class="empty-state">
            <text class="empty-text">该科目下暂无分类</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import adminVideoApi from './api';

// 标签配置
const tabs = [
  { key: 'content', label: '内容管理', icon: '🎬' },
  { key: 'collections', label: '合集管理', icon: '📚' },
  { key: 'code', label: '兑换码', icon: '🔑' },
  { key: 'feedback', label: '反馈', icon: '💬' }
];

const activeTab = ref('content');
const subjects = ref([]);
const selectedSubjectId = ref(null);
const selectedCategoryId = ref(null);
const resources = ref([]);
const collections = ref([]);
const codes = ref([]);
const feedbacks = ref([]);

// 弹窗状态
const showSubjectModal = ref(false);
const editingSubject = ref({});
const showCategoryModal = ref(false);
const editingCategory = ref({});
const showResourceModal = ref(false);
const editingResource = ref({ items: [] });
const resourceSubjectIndex = ref(-1);
const resourceCategoryIndex = ref(-1);
const showGenerateModal = ref(false);
const generatingResource = ref(null);
const generateCount = ref(1);
const generatedCodes = ref([]);
const showBatchModal = ref(false);
const selectedResourceIds = ref([]);
const biliQuickInput = ref('');
const codeKeyword = ref('');
const feedbackTypeIndex = ref(0);
const feedbackTypes = ['全部', '反馈', '推荐'];

// 选择器相关
const showSubjectSelector = ref(false);
const showCategorySelector = ref(false);

// 合集相关
const showCollectionModal = ref(false);
const editingCollection = ref({});
const showCollectionVideosModal = ref(false);
const editingCollectionVideos = ref(null);
const availableResources = ref([]);
const selectedCollectionVideoIds = ref([]);
const videoSearchKeyword = ref('');
const showCollectionCodeModal = ref(false);
const generatingCollection = ref(null);
const collectionGenerateCount = ref(1);
const collectionGeneratedCodes = ref([]);

// 批量操作数据
const batchData = ref({
  requires_redemption: -1,
  is_public: -1
});

// 计算属性
const currentSubject = computed(() => subjects.value.find(s => s.id === selectedSubjectId.value));
const currentCategories = computed(() => currentSubject.value?.categories || []);
const resourceCategories = computed(() => resourceSubjectIndex.value >= 0 ? subjects.value[resourceSubjectIndex.value]?.categories || [] : []);
const isAllSelected = computed(() => resources.value.length > 0 && selectedResourceIds.value.length === resources.value.length);

const filteredAvailableResources = computed(() => {
  if (!videoSearchKeyword.value) return availableResources.value;
  const keyword = videoSearchKeyword.value.toLowerCase();
  return availableResources.value.filter(r => r.title.toLowerCase().includes(keyword));
});

// 初始化
onMounted(() => {
  fetchSubjects();
  fetchCollections();
  
  // 处理URL参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const { tab, action } = currentPage.$page?.options || {};
  
  if (tab === 'collections') {
    activeTab.value = 'collections';
  }
  
  if (action === 'create') {
    setTimeout(() => openResourceModal(), 500);
  }
});

// 监听标签切换
watch(activeTab, (val) => {
  if (val === 'code') fetchCodes();
  else if (val === 'feedback') fetchFeedbacks();
  else if (val === 'collections') fetchCollections();
});

// API 调用
const fetchSubjects = async () => {
  try {
    const res = await adminVideoApi.getSubjects();
    if (res.code === 0) subjects.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const fetchResources = async () => {
  try {
    const params = {};
    if (selectedCategoryId.value) {
      params.category_id = selectedCategoryId.value;
    } else if (selectedSubjectId.value) {
      params.subject_id = selectedSubjectId.value;
    }
    const res = await adminVideoApi.getResources(params);
    if (res.code === 0) resources.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const fetchCollections = async () => {
  try {
    const res = await adminVideoApi.getCollections();
    if (res.code === 0) collections.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

const fetchCodes = async () => {
  try {
    const params = codeKeyword.value ? { keyword: codeKeyword.value } : {};
    const res = await adminVideoApi.getCodes(params);
    if (res.code === 0) codes.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

const fetchFeedbacks = async () => {
  try {
    const typeMap = ['', 'feedback', 'recommend'];
    const params = {};
    if (feedbackTypeIndex.value > 0) params.type = typeMap[feedbackTypeIndex.value];
    const res = await adminVideoApi.getFeedbacks(params);
    if (res.code === 0) feedbacks.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

// 选择操作
const selectSubject = (sub) => {
  if (sub) {
    selectedSubjectId.value = sub.id;
    selectedCategoryId.value = null;
  } else {
    selectedSubjectId.value = null;
    selectedCategoryId.value = null;
  }
  fetchResources();
};

const selectCategory = (sub, cat) => {
  selectedSubjectId.value = sub.id;
  selectedCategoryId.value = cat.id;
  fetchResources();
};

// 选中操作
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

// 科目操作
const openSubjectModal = (sub = null) => {
  editingSubject.value = sub ? { ...sub } : { name: '', sort: 0 };
  showSubjectModal.value = true;
};

const saveSubject = async () => {
  if (!editingSubject.value.name?.trim()) {
    uni.showToast({ title: '请输入科目名称', icon: 'none' });
    return;
  }
  
  uni.showLoading({ title: '保存中...' });
  try {
    const data = {
      name: editingSubject.value.name.trim(),
      sort: editingSubject.value.sort || 0
    };
    
    let res;
    if (editingSubject.value.id) {
      res = await adminVideoApi.updateSubject(editingSubject.value.id, data);
    } else {
      res = await adminVideoApi.createSubject(data);
    }
    
    if (res.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' });
      showSubjectModal.value = false;
      fetchSubjects();
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' });
    }
  } catch (e) {
    console.error('保存科目失败:', e);
    uni.showToast({ title: '保存失败: ' + (e.message || '网络错误'), icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const deleteSubject = async (sub) => {
  uni.showModal({
    title: '确认删除',
    content: `删除科目「${sub.name}」？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          const result = await adminVideoApi.deleteSubject(sub.id);
          if (result.code === 0) {
            fetchSubjects();
            uni.showToast({ title: '删除成功', icon: 'success' });
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' });
          }
        } catch (e) {
          console.error('删除科目失败:', e);
          uni.showToast({ title: '删除失败: ' + (e.message || '网络错误'), icon: 'none' });
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

// 分类操作
const openCategoryModal = (sub, cat = null) => {
  if (cat) {
    editingCategory.value = { ...cat, subjectName: sub.name };
  } else {
    editingCategory.value = { name: '', sort: 0, subject_id: sub.id, subjectName: sub.name };
  }
  showCategoryModal.value = true;
};

const saveCategory = async () => {
  if (!editingCategory.value.name?.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' });
    return;
  }
  
  uni.showLoading({ title: '保存中...' });
  try {
    const data = {
      name: editingCategory.value.name.trim(),
      sort: editingCategory.value.sort || 0,
      subject_id: editingCategory.value.subject_id
    };
    
    let res;
    if (editingCategory.value.id) {
      res = await adminVideoApi.updateCategory(editingCategory.value.id, data);
    } else {
      res = await adminVideoApi.createCategory(data);
    }
    
    if (res.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' });
      showCategoryModal.value = false;
      fetchSubjects();
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' });
    }
  } catch (e) {
    console.error('保存分类失败:', e);
    uni.showToast({ title: '保存失败: ' + (e.message || '网络错误'), icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const deleteCategory = async (cat) => {
  uni.showModal({
    title: '确认删除',
    content: `删除分类「${cat.name}」？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          const result = await adminVideoApi.deleteCategory(cat.id);
          if (result.code === 0) {
            fetchSubjects();
            uni.showToast({ title: '删除成功', icon: 'success' });
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' });
          }
        } catch (e) {
          console.error('删除分类失败:', e);
          uni.showToast({ title: '删除失败: ' + (e.message || '网络错误'), icon: 'none' });
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

// 视频资源操作
const openResourceModal = (res = null) => {
  if (res) {
    editingResource.value = JSON.parse(JSON.stringify(res));
    const subIndex = subjects.value.findIndex(s => s.id === res.subject_id);
    resourceSubjectIndex.value = subIndex;
    const catIndex = subjects.value[subIndex]?.categories?.findIndex(c => c.id === res.category_id) ?? -1;
    resourceCategoryIndex.value = catIndex;
  } else {
    editingResource.value = { 
      title: '', 
      bili_link: '', 
      cover_url: '', 
      description: '', 
      type: 'single',
      requires_redemption: 0,
      is_public: 1,
      items: [] 
    };
    resourceSubjectIndex.value = -1;
    resourceCategoryIndex.value = -1;
  }
  biliQuickInput.value = '';
  showResourceModal.value = true;
};

const onResourceSubjectChange = (e) => {
  resourceSubjectIndex.value = e.detail.value;
  resourceCategoryIndex.value = -1;
  editingResource.value.subject_id = subjects.value[resourceSubjectIndex.value]?.id;
  editingResource.value.category_id = null;
};

const onResourceCategoryChange = (e) => {
  resourceCategoryIndex.value = e.detail.value;
  editingResource.value.category_id = resourceCategories.value[resourceCategoryIndex.value]?.id;
};

// 自定义选择器方法
const selectResourceSubject = (index) => {
  resourceSubjectIndex.value = index;
  resourceCategoryIndex.value = -1;
  editingResource.value.subject_id = subjects.value[index]?.id;
  editingResource.value.category_id = null;
  showSubjectSelector.value = false;
};

const selectResourceCategory = (index) => {
  resourceCategoryIndex.value = index;
  editingResource.value.category_id = resourceCategories.value[index]?.id;
  showCategorySelector.value = false;
};

const handleBiliParse = async () => {
  if (!biliQuickInput.value) return;
  try {
    const res = await adminVideoApi.parseBiliLink(biliQuickInput.value);
    if (res.code === 0) {
      editingResource.value.title = res.data.title || editingResource.value.title;
      editingResource.value.bili_link = res.data.link || editingResource.value.bili_link;
      editingResource.value.cover_url = res.data.cover || editingResource.value.cover_url;
      if (res.data.videos) {
        editingResource.value.items = res.data.videos;
      }
    }
  } catch (e) {
    uni.showToast({ title: '解析失败', icon: 'none' });
  }
};

const addVideoItem = () => {
  if (!editingResource.value.items) editingResource.value.items = [];
  editingResource.value.items.push({ title: '', url: '', duration: '' });
};

const removeVideoItem = (idx) => {
  editingResource.value.items.splice(idx, 1);
};

const saveResource = async () => {
  // 表单验证
  if (!editingResource.value.title?.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' });
    return;
  }
  if (!editingResource.value.subject_id) {
    uni.showToast({ title: '请选择归属科目', icon: 'none' });
    return;
  }
  if (!editingResource.value.bili_link?.trim()) {
    uni.showToast({ title: '请输入B站链接', icon: 'none' });
    return;
  }
  
  uni.showLoading({ title: '保存中...' });
  try {
    const data = { 
      ...editingResource.value,
      title: editingResource.value.title.trim(),
      bili_link: editingResource.value.bili_link.trim(),
      cover_url: editingResource.value.cover_url?.trim() || '',
      description: editingResource.value.description?.trim() || '',
      items: editingResource.value.items || []
    };
    
    console.log('保存视频数据:', data);
    
    let res;
    if (editingResource.value.id) {
      res = await adminVideoApi.updateResource(editingResource.value.id, data);
    } else {
      res = await adminVideoApi.createResource(data);
    }
    
    if (res.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' });
      showResourceModal.value = false;
      fetchResources();
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' });
    }
  } catch (e) {
    console.error('保存视频失败:', e);
    uni.showToast({ title: '保存失败: ' + (e.message || '网络错误'), icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const deleteResource = async (res) => {
  uni.showModal({
    title: '确认删除',
    content: `删除「${res.title}」？`,
    success: async (r) => {
      if (r.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          const result = await adminVideoApi.deleteResource(res.id);
          if (result.code === 0) {
            fetchResources();
            uni.showToast({ title: '删除成功', icon: 'success' });
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' });
          }
        } catch (e) {
          console.error('删除视频失败:', e);
          uni.showToast({ title: '删除失败: ' + (e.message || '网络错误'), icon: 'none' });
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

// 兑换码操作
const openGenerateCodeModal = (res) => {
  generatingResource.value = res;
  generateCount.value = 1;
  generatedCodes.value = [];
  showGenerateModal.value = true;
};

const confirmGenerate = async () => {
  if (!generatingResource.value?.id) {
    uni.showToast({ title: '请先选择资源', icon: 'none' });
    return;
  }
  if (!generateCount.value || generateCount.value < 1) {
    uni.showToast({ title: '请输入有效的生成数量', icon: 'none' });
    return;
  }
  uni.showLoading({ title: '生成中...' });
  try {
    const res = await adminVideoApi.generateCodes({
      resourceIds: [generatingResource.value.id],
      count: generateCount.value
    });
    if (res.code === 0) {
      generatedCodes.value = res.data;
      uni.showToast({ title: '生成成功', icon: 'success' });
    } else {
      uni.showToast({ title: res.message || '生成失败', icon: 'none' });
    }
  } catch (e) {
    console.error('生成兑换码失败:', e);
    uni.showToast({ title: '生成失败: ' + (e.message || '未知错误'), icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const copyCodes = () => {
  const text = generatedCodes.value.join('\n');
  copyToClipboard(text);
};

const copyText = (text) => {
  copyToClipboard(text);
};

// 复制到剪贴板（兼容H5和小程序）
const copyToClipboard = (text) => {
  if (!text) {
    uni.showToast({ title: '没有内容可复制', icon: 'none' });
    return;
  }
  
  // #ifdef H5
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      uni.showToast({ title: '已复制', icon: 'success' });
    }).catch((err) => {
      console.error('复制失败:', err);
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
  // #endif
  
  // #ifndef H5
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败', icon: 'none' })
  });
  // #endif
};

// H5 降级复制方案
const fallbackCopy = (text) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      uni.showToast({ title: '已复制', icon: 'success' });
    } else {
      uni.showToast({ title: '复制失败，请手动复制', icon: 'none' });
    }
  } catch (err) {
    console.error('复制失败:', err);
    uni.showToast({ title: '复制失败，请手动复制', icon: 'none' });
  }
  
  document.body.removeChild(textarea);
};

// 批量操作
const openBatchResourceModal = () => {
  batchData.value = { requires_redemption: -1, is_public: -1 };
  showBatchModal.value = true;
};

const applyBatch = async () => {
  const data = {};
  if (batchData.value.requires_redemption !== -1) data.requires_redemption = batchData.value.requires_redemption;
  if (batchData.value.is_public !== -1) data.is_public = batchData.value.is_public;
  
  if (Object.keys(data).length === 0) {
    uni.showToast({ title: '请选择要修改的权限或状态', icon: 'none' });
    return;
  }
  
  uni.showLoading({ title: '更新中...' });
  try {
    const res = await adminVideoApi.batchUpdateResources(selectedResourceIds.value, data);
    if (res.code === 0) {
      showBatchModal.value = false;
      selectedResourceIds.value = [];
      fetchResources();
      uni.showToast({ title: '修改成功', icon: 'success' });
    } else {
      uni.showToast({ title: res.message || '修改失败', icon: 'none' });
    }
  } catch (e) {
    console.error('批量更新失败:', e);
    uni.showToast({ title: '操作失败: ' + (e.message || '网络错误'), icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const batchDelete = async () => {
  uni.showModal({
    title: '确认删除',
    content: `删除选中的 ${selectedResourceIds.value.length} 个资源？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          const result = await adminVideoApi.batchDeleteResources(selectedResourceIds.value);
          if (result.code === 0) {
            showBatchModal.value = false;
            selectedResourceIds.value = [];
            fetchResources();
            uni.showToast({ title: '删除成功', icon: 'success' });
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' });
          }
        } catch (e) {
          console.error('批量删除失败:', e);
          uni.showToast({ title: '删除失败: ' + (e.message || '网络错误'), icon: 'none' });
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

// 合集操作
const openCollectionModal = (col = null) => {
  editingCollection.value = col ? { ...col } : { name: '', description: '', cover_url: '', sort: 0, is_active: 1 };
  showCollectionModal.value = true;
};

const saveCollection = async () => {
  if (!editingCollection.value.name?.trim()) {
    uni.showToast({ title: '请输入合集名称', icon: 'none' });
    return;
  }
  
  uni.showLoading({ title: '保存中...' });
  try {
    const data = {
      name: editingCollection.value.name.trim(),
      description: editingCollection.value.description?.trim() || '',
      cover_url: editingCollection.value.cover_url?.trim() || '',
      sort: editingCollection.value.sort || 0,
      is_active: editingCollection.value.is_active ?? 1
    };
    
    let res;
    if (editingCollection.value.id) {
      res = await adminVideoApi.updateCollection(editingCollection.value.id, data);
    } else {
      res = await adminVideoApi.createCollection(data);
    }
    
    if (res.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' });
      showCollectionModal.value = false;
      fetchCollections();
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' });
    }
  } catch (e) {
    console.error('保存合集失败:', e);
    uni.showToast({ title: '保存失败: ' + (e.message || '网络错误'), icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const deleteCollection = async (col) => {
  uni.showModal({
    title: '确认删除',
    content: `删除合集「${col.name}」？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          const result = await adminVideoApi.deleteCollection(col.id);
          if (result.code === 0) {
            fetchCollections();
            uni.showToast({ title: '删除成功', icon: 'success' });
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' });
          }
        } catch (e) {
          console.error('删除合集失败:', e);
          uni.showToast({ title: '删除失败: ' + (e.message || '网络错误'), icon: 'none' });
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

const openCollectionVideosModal = async (col) => {
  editingCollectionVideos.value = col;
  videoSearchKeyword.value = '';
  selectedCollectionVideoIds.value = [];
  
  try {
    const detailRes = await adminVideoApi.getCollectionDetail(col.id);
    if (detailRes.code === 0) {
      selectedCollectionVideoIds.value = detailRes.data.videos.map(v => v.resource_id);
    }
    
    const resourcesRes = await adminVideoApi.getResources({ status: 1 });
    if (resourcesRes.code === 0) {
      availableResources.value = resourcesRes.data;
    }
    
    showCollectionVideosModal.value = true;
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
};

const toggleCollectionVideo = (id) => {
  const index = selectedCollectionVideoIds.value.indexOf(id);
  if (index > -1) {
    selectedCollectionVideoIds.value.splice(index, 1);
  } else {
    selectedCollectionVideoIds.value.push(id);
  }
};

const saveCollectionVideos = async () => {
  uni.showLoading({ title: '保存中...' });
  try {
    const res = await adminVideoApi.updateCollectionVideos(
      editingCollectionVideos.value.id,
      selectedCollectionVideoIds.value
    );
    if (res.code === 0) {
      showCollectionVideosModal.value = false;
      fetchCollections();
      uni.showToast({ title: '保存成功', icon: 'success' });
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' });
    }
  } catch (e) {
    console.error('保存合集视频失败:', e);
    uni.showToast({ title: '保存失败: ' + (e.message || '网络错误'), icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const openCollectionCodeModal = (col) => {
  generatingCollection.value = col;
  collectionGenerateCount.value = 1;
  collectionGeneratedCodes.value = [];
  showCollectionCodeModal.value = true;
};

const confirmCollectionCodeGenerate = async () => {
  if (!generatingCollection.value?.id) {
    uni.showToast({ title: '请先选择合集', icon: 'none' });
    return;
  }
  if (!collectionGenerateCount.value || collectionGenerateCount.value < 1) {
    uni.showToast({ title: '请输入有效的生成数量', icon: 'none' });
    return;
  }
  
  uni.showLoading({ title: '生成中...' });
  try {
    const res = await adminVideoApi.generateCollectionCodes({
      collectionId: generatingCollection.value.id,
      count: collectionGenerateCount.value
    });
    if (res.code === 0) {
      collectionGeneratedCodes.value = res.data;
      uni.showToast({ title: '生成成功', icon: 'success' });
    } else {
      uni.showToast({ title: res.message || '生成失败', icon: 'none' });
    }
  } catch (e) {
    console.error('生成合集兑换码失败:', e);
    uni.showToast({ title: '生成失败: ' + (e.message || '未知错误'), icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 反馈
const onFeedbackTypeChange = (e) => {
  feedbackTypeIndex.value = e.detail.value;
  fetchFeedbacks();
};

// 工具函数
const formatDate = (str) => {
  if (!str) return '-';
  return new Date(str).toLocaleDateString();
};

const handleBack = () => {
  uni.navigateBack();
};
</script>

<style scoped>
.container {
  height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}
.nav-back {
  font-size: 14px;
  color: #666;
  padding: 4px 8px;
}
.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.nav-placeholder {
  width: 60px;
}

/* 标签栏 */
.tab-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 8px;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  color: #666;
  font-size: 12px;
}
.tab-item.active {
  color: #2b5cff;
  border-bottom: 2px solid #2b5cff;
}
.tab-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

/* 内容区域 */
.content {
  flex: 1;
  height: calc(100vh - 100px);
  padding: 12px;
}

/* 卡片 */
.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* 科目标签 */
.subject-scroll {
  white-space: nowrap;
  height: 40px;
}
.subject-tags {
  display: inline-flex;
  gap: 8px;
}
.subject-tag {
  display: inline-block;
  padding: 6px 14px;
  background: #f0f2f5;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
}
.subject-tag.active {
  background: #2b5cff;
  color: #fff;
}

/* 分类标签 */
.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.category-tag {
  padding: 4px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}
.category-tag.active {
  background: #e6f7ff;
  color: #2b5cff;
}

/* 操作栏 */
.action-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

/* 列表卡片 */
.list-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}
.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}
.empty-text {
  font-size: 14px;
  color: #999;
}

/* 视频项 */
.video-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}
.video-item:last-child {
  border-bottom: none;
}
.video-item.selected {
  background: #f0f7ff;
  margin: 0 -12px;
  padding-left: 12px;
  padding-right: 12px;
}
.item-checkbox {
  margin-right: 8px;
}
.item-cover {
  width: 80px;
  height: 50px;
  border-radius: 6px;
  margin-right: 12px;
  background: #f0f0f0;
}
.item-body {
  flex: 1;
  min-width: 0;
}
.item-title {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.type-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 6px;
}
.type-badge.single {
  background: #e6f7ff;
  color: #2b5cff;
}
.type-badge.collection {
  background: #fff7e6;
  color: #fa8c16;
}
.title-text {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-meta {
  display: flex;
  gap: 8px;
}
.meta-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
.meta-badge.free {
  background: #f6ffed;
  color: #52c41a;
}
.meta-badge.lock {
  background: #fff2f0;
  color: #ff4d4f;
}
.meta-badge.public {
  background: #e6f7ff;
  color: #2b5cff;
}
.meta-badge.private {
  background: #f5f5f5;
  color: #999;
}
.item-actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  font-size: 18px;
  padding: 4px;
}

/* 合集项 */
.collection-item {
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}
.collection-item:last-child {
  border-bottom: none;
}
.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.collection-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.collection-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}
.collection-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
.collection-status.active {
  background: #f6ffed;
  color: #52c41a;
}
.collection-status.inactive {
  background: #f5f5f5;
  color: #999;
}
.collection-sort {
  font-size: 12px;
  color: #999;
}
.collection-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
}
.collection-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 兑换码项 */
.code-item {
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}
.code-item:last-child {
  border-bottom: none;
}
.code-main {
  margin-bottom: 6px;
}
.code-value {
  font-family: monospace;
  font-size: 15px;
  color: #333;
  display: block;
  margin-bottom: 4px;
}
.code-resource {
  font-size: 12px;
  color: #666;
}
.code-status {
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}
.status-badge.used {
  background: #fff2f0;
  color: #ff4d4f;
}
.status-badge.unused {
  background: #f6ffed;
  color: #52c41a;
}
.used-by {
  font-size: 12px;
  color: #999;
}

/* 反馈项 */
.feedback-item {
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}
.feedback-item:last-child {
  border-bottom: none;
}
.feedback-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.feedback-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #e6f7ff;
  color: #2b5cff;
}
.feedback-type.recommend {
  background: #f6ffed;
  color: #52c41a;
}
.feedback-user {
  font-size: 13px;
  color: #666;
}
.feedback-time {
  font-size: 11px;
  color: #999;
  margin-left: auto;
}
.feedback-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 6px;
}
.feedback-resource {
  font-size: 12px;
  color: #2b5cff;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: 10px;
}
.search-input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
}

/* 按钮 */
.btn-primary {
  background: #2b5cff;
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  border: none;
}
.btn-primary.full-width {
  width: 100%;
  margin-top: 12px;
}
.btn-warning {
  background: #faad14;
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  border: none;
}
.btn-text {
  background: transparent;
  color: #2b5cff;
  font-size: 13px;
  padding: 4px 8px;
  border: none;
}
.btn-small {
  background: #f5f5f5;
  color: #666;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  border: none;
}
.btn-small.success {
  background: #f6ffed;
  color: #52c41a;
}
.btn-small.danger {
  background: #fff2f0;
  color: #ff4d4f;
}
.btn-search {
  background: #2b5cff;
  color: #fff;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  border: none;
}

/* Picker */
.picker-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
}
.picker-arrow {
  font-size: 12px;
  color: #999;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
}
.modal-content.modal-large {
  max-height: 90vh;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
  font-weight: 600;
}
.modal-close {
  font-size: 24px;
  color: #999;
  padding: 0 4px;
}
.modal-body {
  height: 50vh;
  overflow-y: auto;
  padding: 20px;
}
.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}
.modal-footer button {
  flex: 1;
}

/* 表单 */
.form-item {
  margin-bottom: 16px;
}
.form-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}
.form-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
}
.form-textarea {
  width: 100%;
  height: 100px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
}
.form-static {
  font-size: 14px;
  color: #333;
  padding: 10px 0;
}
.form-row {
  display: flex;
  gap: 16px;
}
.flex-1 {
  flex: 1;
}
.flex-2 {
  flex: 2;
}

/* 单选 */
.radio-label {
  display: inline-flex;
  align-items: center;
  margin-right: 16px;
  font-size: 14px;
}

/* 视频列表编辑 */
.video-list-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}
.video-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.item-index {
  width: 24px;
  text-align: center;
  font-size: 13px;
  color: #999;
}
.delete-btn {
  font-size: 20px;
  color: #ff4d4f;
  padding: 0 8px;
}

/* 视频选择列表 */
.video-select-list {
  height: 300px;
}

/* 自定义选择器 */
.custom-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}
.select-text {
  font-size: 14px;
  color: #333;
}
.select-arrow {
  font-size: 12px;
  color: #999;
}
.selector-list {
  height: 300px;
  padding: 0 20px;
}
.selector-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}
.selector-item.active {
  color: #2b5cff;
}
.selector-text {
  font-size: 15px;
}
.selector-check {
  font-size: 16px;
  color: #2b5cff;
}

.video-select-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.select-cover {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  margin: 0 10px;
  background: #f0f0f0;
}
.select-info {
  flex: 1;
}
.select-title {
  font-size: 14px;
  color: #333;
  display: block;
  margin-bottom: 4px;
}
.select-meta {
  font-size: 12px;
  color: #999;
}

/* 兑换码结果 */
.codes-result {
  margin-top: 16px;
}
.result-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  display: block;
}
.codes-list {
  height: 150px;
  margin-bottom: 12px;
}
.code-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 8px;
}
.code-text {
  font-family: monospace;
  font-size: 14px;
  color: #333;
}

/* 底部按钮 */
.btn-cancel {
  background: #f5f5f5;
  color: #666;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  border: none;
}
.btn-confirm {
  background: #2b5cff;
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  border: none;
}
.btn-danger {
  background: #ff4d4f;
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  border: none;
}

/* 输入框带按钮 */
.input-with-btn {
  display: flex;
  gap: 8px;
}
</style>
