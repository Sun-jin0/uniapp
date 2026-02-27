<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="back-btn" @tap="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="back-icon">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </view>
        <view class="nav-title">{{ pageTitle }}</view>
        <view class="nav-actions">
          <text class="action-btn draft" @tap="saveAsDraft">存草稿</text>
          <text class="action-btn publish" @tap="publishContent">发布</text>
        </view>
      </view>
    </view>

    <scroll-view class="main-content" scroll-y :style="{ marginTop: (statusBarHeight + 44) + 'px' }">
      <view class="form-container">
        <!-- 分类标签（通知和文章类型显示） -->
        <view class="form-group" v-if="contentType !== 'ad'">
          <view class="group-label">分类标签</view>
          <picker @change="onCategoryChange" :value="categoryIndex" :range="categoryOptions" class="form-picker">
            <view class="picker-content">
              <text class="picker-text">{{ editingContent.category || '请选择分类' }}</text>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="picker-arrow">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </view>
          </picker>
        </view>

        <!-- 通知内容形式（仅通知类型显示） -->
        <view class="form-group" v-if="contentType === 'notice'">
          <view class="group-label">内容形式</view>
          <view class="type-selector">
            <view 
              class="type-option" 
              :class="{ active: noticeType === 'article' }"
              @tap="noticeType = 'article'"
            >
              文章内容
            </view>
            <view 
              class="type-option" 
              :class="{ active: noticeType === 'link' }"
              @tap="noticeType = 'link'"
            >
              跳转链接
            </view>
            <view 
              class="type-option" 
              :class="{ active: noticeType === 'wechat' }"
              @tap="noticeType = 'wechat'"
            >
              微信链接
            </view>
          </view>
        </view>

        <!-- 文章内容形式（仅文章类型显示） -->
        <view class="form-group" v-if="contentType === 'article'">
          <view class="group-label">内容形式</view>
          <view class="type-selector">
            <view 
              class="type-option" 
              :class="{ active: articleNoticeType === 'article' }"
              @tap="articleNoticeType = 'article'"
            >
              文章内容
            </view>
            <view 
              class="type-option" 
              :class="{ active: articleNoticeType === 'link' }"
              @tap="articleNoticeType = 'link'"
            >
              跳转链接
            </view>
            <view 
              class="type-option" 
              :class="{ active: articleNoticeType === 'wechat' }"
              @tap="articleNoticeType = 'wechat'"
            >
              微信链接
            </view>
          </view>
        </view>

        <!-- 微信公众号文章链接解析（选择微信链接时显示） -->
        <view class="form-group parse-section" v-if="(contentType === 'article' && articleNoticeType === 'wechat') || (contentType === 'notice' && noticeType === 'wechat')">
          <view class="group-label">微信公众号文章链接解析</view>
          <view class="parse-input-group">
            <input 
              class="url-input" 
              type="text" 
              placeholder="粘贴微信文章链接进行解析" 
              v-model="wechatUrl"
            />
            <button class="parse-btn" @tap="parseUrl" :loading="parsing">解析</button>
          </view>
          <view class="parse-hint">解析后将自动填充标题、内容和封面图</view>
        </view>

        <!-- 跳转链接（选择微信链接时显示，解析后自动填充） -->
        <view class="form-group" v-if="(contentType === 'notice' && noticeType === 'wechat') || (contentType === 'article' && articleNoticeType === 'wechat')">
          <view class="group-label">跳转链接</view>
          <input 
            class="title-input" 
            type="text" 
            placeholder="解析后自动填充" 
            v-model="editingContent.linkUrl"
            readonly
          />
        </view>

        <!-- 标题（通知和文章类型显示） -->
        <view class="form-group" v-if="contentType !== 'ad'">
          <view class="group-label">标题</view>
          <input 
            class="title-input" 
            type="text" 
            placeholder="请输入标题" 
            v-model="editingContent.title"
          />
        </view>

        <!-- 摘要（仅文章类型显示） -->
        <view class="form-group" v-if="contentType === 'article'">
          <view class="group-label">摘要</view>
          <textarea 
            class="description-input" 
            placeholder="请输入文章摘要（可选）" 
            v-model="editingContent.description"
            maxlength="200"
          />
        </view>

        <!-- 作者（仅文章类型显示） -->
        <view class="form-group" v-if="contentType === 'article'">
          <view class="group-label">作者</view>
          <input 
            class="title-input" 
            type="text" 
            placeholder="请输入作者名称" 
            v-model="editingContent.author"
            maxlength="20"
          />
        </view>

        <!-- 跳转链接（选择跳转链接时显示） -->
        <view class="form-group" v-if="(contentType === 'notice' && noticeType === 'link') || (contentType === 'article' && articleNoticeType === 'link')">
          <view class="group-label">跳转链接</view>
          <input 
            class="title-input" 
            type="text" 
            placeholder="请输入跳转链接" 
            v-model="editingContent.linkUrl"
          />
        </view>

        <!-- 广告图片（仅广告类型显示） -->
        <view class="form-group" v-if="contentType === 'ad'">
          <view class="group-label">广告图片</view>
          <view class="cover-upload" @tap="uploadAdImage">
            <image v-if="editingContent.imageUrl" :src="editingContent.imageUrl" mode="aspectFill" class="cover-preview"></image>
            <view v-else class="upload-placeholder">
              <text class="upload-icon">+</text>
              <text class="upload-text">点击上传图片</text>
            </view>
          </view>
        </view>

        <!-- 按钮文字（仅广告类型显示） -->
        <view class="form-group" v-if="contentType === 'ad'">
          <view class="group-label">按钮文字</view>
          <input 
            class="title-input" 
            type="text" 
            placeholder="默认：查看详情" 
            v-model="editingContent.buttonText"
          />
        </view>

        <!-- 跳转链接（仅广告类型显示） -->
        <view class="form-group" v-if="contentType === 'ad'">
          <view class="group-label">跳转链接</view>
          <input 
            class="title-input" 
            type="text" 
            placeholder="请输入跳转链接" 
            v-model="editingContent.linkUrl"
          />
        </view>

        <!-- 封面图（文章类型显示） -->
        <view class="form-group" v-if="contentType === 'article'">
          <view class="group-label">封面图</view>
          <view class="cover-upload" @tap="uploadCover">
            <image v-if="editingContent.coverImage" :src="editingContent.coverImage" mode="aspectFill" class="cover-preview"></image>
            <image v-else src="/static/logo1.png" mode="aspectFill" class="cover-preview default-cover"></image>
            <view class="cover-hint">点击更换封面</view>
          </view>
        </view>

        <!-- 内容（通知文章形式或文章类型显示） -->
        <view class="form-group" v-if="(contentType === 'notice' && noticeType === 'article') || (contentType === 'article' && articleNoticeType === 'article')">
          <view class="group-label">内容</view>
          <view class="editor-wrapper">
            <!-- 编辑器工具栏 -->
            <view class="editor-toolbar">
              <view class="toolbar-item" @tap="format('bold')" :class="{ active: formats.bold }">
                <text class="toolbar-icon bold">B</text>
              </view>
              <view class="toolbar-item" @tap="format('italic')" :class="{ active: formats.italic }">
                <text class="toolbar-icon italic">I</text>
              </view>
              <view class="toolbar-item" @tap="format('underline')" :class="{ active: formats.underline }">
                <text class="toolbar-icon underline">U</text>
              </view>
              <view class="toolbar-item" @tap="format('strikeThrough')" :class="{ active: formats.strikeThrough }">
                <text class="toolbar-icon strike">S</text>
              </view>
              <view class="toolbar-divider"></view>
              <view class="toolbar-item" @tap="format('header', 'H1')">
                <text class="toolbar-icon">H1</text>
              </view>
              <view class="toolbar-item" @tap="format('header', 'H2')">
                <text class="toolbar-icon">H2</text>
              </view>
              <view class="toolbar-item" @tap="format('header', 'H3')">
                <text class="toolbar-icon">H3</text>
              </view>
              <view class="toolbar-divider"></view>
              <view class="toolbar-item" @tap="format('list', 'bullet')">
                <text class="toolbar-icon">•</text>
              </view>
              <view class="toolbar-item" @tap="format('list', 'ordered')">
                <text class="toolbar-icon">1.</text>
              </view>
              <view class="toolbar-item" @tap="format('indent', '+1')">
                <text class="toolbar-icon">→</text>
              </view>
              <view class="toolbar-item" @tap="format('indent', '-1')">
                <text class="toolbar-icon">←</text>
              </view>
              <view class="toolbar-divider"></view>
              <view class="toolbar-item" @tap="format('align', 'left')" :class="{ active: formats.align === 'left' }">
                <text class="toolbar-icon">⬅</text>
              </view>
              <view class="toolbar-item" @tap="format('align', 'center')" :class="{ active: formats.align === 'center' }">
                <text class="toolbar-icon">⬌</text>
              </view>
              <view class="toolbar-item" @tap="format('align', 'right')" :class="{ active: formats.align === 'right' }">
                <text class="toolbar-icon">➡</text>
              </view>
              <view class="toolbar-item" @tap="format('align', 'justify')" :class="{ active: formats.align === 'justify' }">
                <text class="toolbar-icon">≡</text>
              </view>
              <view class="toolbar-divider"></view>
              <view class="toolbar-item" @tap="format('lineHeight', '1.5')">
                <text class="toolbar-icon">行距</text>
              </view>
              <view class="toolbar-divider"></view>
              <view class="toolbar-item" @tap="insertFormula">
                <text class="toolbar-icon">∑</text>
              </view>
              <view class="toolbar-item" @tap="pickColor">
                <text class="toolbar-icon color">A</text>
              </view>
              <view class="toolbar-item" @tap="pickBackgroundColor">
                <text class="toolbar-icon">🎨</text>
              </view>
              <view class="toolbar-divider"></view>
              <view class="toolbar-item" @tap="insertLink">
                <text class="toolbar-icon link">🔗</text>
              </view>
              <view class="toolbar-item" @tap="insertImage">
                <text class="toolbar-icon image">🖼️</text>
              </view>
              <view class="toolbar-item" @tap="removeFormat">
                <text class="toolbar-icon">✖</text>
              </view>
            </view>
            <!-- 编辑器区域 -->
            <editor 
              id="editor"
              class="editor-content" 
              placeholder="请输入内容..."
              @ready="onEditorReady"
              @statuschange="onStatusChange"
              @input="onEditorInput"
            ></editor>
          </view>
        </view>
        <!-- 编辑器图片选择 -->
        <view class="form-group" v-if="(contentType === 'notice' && noticeType === 'article') || (contentType === 'article' && articleNoticeType === 'article')">
            <view class="group-label">编辑器图片</view>
            <view class="image-selector">
              <view class="image-option" 
                :class="{ active: editorImageSource === 'default' }"
                @tap="editorImageSource = 'default'">
                <text>默认图片</text>
              </view>
              <view class="image-option" 
                :class="{ active: editorImageSource === 'upload' }"
                @tap="editorImageSource = 'upload'">
                <text>自定义图片</text>
              </view>
              <view class="image-option" 
                :class="{ active: editorImageSource === 'wechat' }"
                @tap="editorImageSource = 'wechat'">
                <text>微信链接获取</text>
              </view>
            </view>
            <view v-if="editorImageSource === 'default'" class="default-image-preview">
              <image src="/static/logo1.png" mode="aspectFill" class="preview-img"></image>
            </view>
            <view v-if="editorImageSource === 'upload'" class="upload-image-preview" @tap="uploadEditorImage">
              <image v-if="editorUploadedImage" :src="editorUploadedImage" mode="aspectFill" class="preview-img"></image>
              <view v-else class="upload-placeholder">
                <text class="upload-icon">+</text>
                <text class="upload-text">点击上传图片</text>
              </view>
            </view>
            <view v-if="editorImageSource === 'wechat'" class="wechat-image-preview">
              <image v-if="editorWechatImage" :src="editorWechatImage" mode="aspectFill" class="preview-img"></image>
              <view v-else class="upload-placeholder">
                <text class="upload-text">请先在上方解析微信文章链接</text>
              </view>
            </view>
        </view>

        <!-- 是否启用 -->
        <view class="form-group">
          <view class="group-label">是否启用</view>
          <view class="switch-wrapper">
            <switch 
              :checked="editingContent.isActive" 
              @change="editingContent.isActive = $event.detail.value"
              active-color="#7b4397"
            />
            <text class="switch-text">{{ editingContent.isActive ? '已启用' : '已禁用' }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const { proxy } = getCurrentInstance();
const adminApi = proxy.$api.adminApi;

// 状态
const statusBarHeight = ref(0);
const isDarkMode = ref(false);
const categoryIndex = ref(-1);
const categoryOptions = ['学习方法', '系统通知', '考试技巧', '政策动态', '备考经验', '资料'];
const articleCategories = ['系统通知', '资料', '备考经验', '政策动态', '考试技巧'];

const wechatUrl = ref('');
const parsing = ref(false);
const contentType = ref('article');
const noticeType = ref('article');
const articleNoticeType = ref('article');
const editorImageSource = ref('default');
const editorUploadedImage = ref('');
const editorWechatImage = ref('');

const editingContent = ref({
  id: null,
  type: 'notice',
  noticeType: 'article',
  category: '',
  title: '',
  description: '',
  content: '',
  author: '管理员',
  imageUrl: '',
  linkUrl: '',
  buttonText: '',
  coverImage: '',
  isActive: true
});

const formats = ref({});
let editorCtx = null;

const pageTitle = computed(() => {
  const typeMap = {
    notice: editingContent.value.id ? '编辑通知' : '新建通知',
    ad: editingContent.value.id ? '编辑广告' : '新建广告',
    article: editingContent.value.id ? '编辑文章' : '发帖'
  };
  return typeMap[contentType.value];
});

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync();
  statusBarHeight.value = sysInfo.statusBarHeight || 0;

  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';

  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });
});

onLoad(async (options) => {
  if (options.id) {
    editingContent.value.id = options.id;
    await fetchContentDetails(options.id);
  }
  if (options.type) {
    contentType.value = options.type;
    editingContent.value.type = options.type === 'article' ? 'notice' : options.type;
  }
});

const fetchContentDetails = async (id) => {
  uni.showLoading({ title: '加载中...' });
  try {
    const res = await adminApi.getNoticeById(id);
    if (res.code === 0 && res.data) {
      const data = res.data;
      editingContent.value = {
        id: data._id || data.id,
        type: data.type || 'notice',
        noticeType: data.noticeType || 'article',
        category: data.category || '',
        title: data.title || '',
        description: data.description || '',
        content: data.content || '',
        author: data.author || '管理员',
        imageUrl: data.imageUrl || '',
        linkUrl: data.linkUrl || '',
        buttonText: data.buttonText || '',
        coverImage: data.imageUrl || '',
        isActive: data.isActive !== undefined ? data.isActive : true
      };

      if (data.type) {
        contentType.value = data.type;
      }
      if (data.noticeType) {
        if (data.type === 'article') {
          articleNoticeType.value = data.noticeType;
        } else {
          noticeType.value = data.noticeType;
        }
      }

      if (data.editorImageSource) {
        editorImageSource.value = data.editorImageSource;
      }
      if (data.editorUploadedImage) {
        editorUploadedImage.value = data.editorUploadedImage;
      }
      if (data.editorWechatImage) {
        editorWechatImage.value = data.editorWechatImage;
      }

      const idx = categoryOptions.indexOf(data.category);
      if (idx !== -1) {
        categoryIndex.value = idx;
      }

      if (editorCtx && editingContent.value.content) {
        editorCtx.setContents({ html: editingContent.value.content });
      }
    }
  } catch (error) {
    console.error('Fetch detail error:', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const goBack = () => {
  uni.navigateBack();
};

const onEditorReady = () => {
  uni.createSelectorQuery().select('#editor').context((res) => {
    editorCtx = res.context;
    if (editingContent.value.content) {
      editorCtx.setContents({ html: editingContent.value.content });
    }
  }).exec();
};

const onEditorInput = (e) => {
  editingContent.value.content = e.detail.html;
};

const onStatusChange = (e) => {
  formats.value = e.detail;
};

const format = (name, value) => {
  if (!editorCtx) return;
  editorCtx.format(name, value);
};

const removeFormat = () => {
  if (!editorCtx) return;
  editorCtx.removeFormat();
};

const pickColor = () => {
  const colors = ['#000000', '#f44336', '#2196f3', '#4caf50', '#ffeb3b', '#9c27b0', '#ff9800', '#795548'];
  uni.showActionSheet({
    itemList: ['黑色', '红色', '蓝色', '绿色', '黄色', '紫色', '橙色', '棕色'],
    success: (res) => {
      format('color', colors[res.tapIndex]);
    }
  });
};

const pickBackgroundColor = () => {
  const colors = ['#ffffff', '#f44336', '#2196f3', '#4caf50', '#ffeb3b', '#9c27b0', '#ff9800', '#795548'];
  uni.showActionSheet({
    itemList: ['白色', '红色', '蓝色', '绿色', '黄色', '紫色', '橙色', '棕色'],
    success: (res) => {
      format('backgroundColor', colors[res.tapIndex]);
    }
  });
};

const insertFormula = () => {
  uni.showModal({
    title: '插入公式',
    editable: true,
    placeholderText: '请输入LaTeX公式（例如：E=mc^2）',
    success: (res) => {
      if (res.confirm && res.content) {
        if (!editorCtx) return;
        editorCtx.insertText(`$$${res.content}$$`);
      }
    }
  });
};

const uploadEditorImage = () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths[0];
      uni.showLoading({ title: '上传中...' });
      try {
        const uploadRes = await adminApi.uploadImage(path);
        if (uploadRes.code === 0) {
          editorUploadedImage.value = uploadRes.data.url;
        }
      } catch (error) {
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    }
  });
};

const insertImage = () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths[0];
      uni.showLoading({ title: '上传中...' });
      try {
        const uploadRes = await adminApi.uploadImage(path);
        if (uploadRes.code === 0) {
          editorCtx.insertImage({
            src: uploadRes.data.url,
            alt: 'image',
            width: '100%'
          });
        }
      } catch (error) {
        uni.showToast({ title: '上传失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    }
  });
};

const uploadCover = () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths[0];
      uni.showLoading({ title: '上传中...' });
      try {
        const uploadRes = await adminApi.uploadImage(path);
        if (uploadRes.code === 0) {
          editingContent.value.coverImage = uploadRes.data.url;
        }
      } catch (error) {
        uni.showToast({ title: '上传失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    }
  });
};

const uploadAdImage = () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths[0];
      uni.showLoading({ title: '上传中...' });
      try {
        const uploadRes = await adminApi.uploadImage(path);
        if (uploadRes.code === 0) {
          editingContent.value.imageUrl = uploadRes.data.url;
        }
      } catch (error) {
        uni.showToast({ title: '上传失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    }
  });
};

const insertLink = () => {
  uni.showModal({
    title: '插入链接',
    content: '',
    editable: true,
    placeholderText: '请输入链接地址',
    success: (res) => {
      if (res.confirm && res.content) {
        editorCtx.format('link', res.content);
      }
    }
  });
};

const parseUrl = async () => {
  if (!wechatUrl.value) {
    uni.showToast({ title: '请输入链接', icon: 'none' });
    return;
  }
  
  if (!wechatUrl.value.includes('mp.weixin.qq.com')) {
    uni.showToast({ title: '目前仅支持微信公众号文章链接', icon: 'none' });
    return;
  }
  
  parsing.value = true;
  try {
    const res = await adminApi.parseArticleLink({ url: wechatUrl.value });
    if (res.code === 0) {
      const { title, coverImage, author, content } = res.data;
      if (title) editingContent.value.title = title;
      if (coverImage) {
        editingContent.value.coverImage = coverImage;
        editorWechatImage.value = coverImage;
      }
      if (author) editingContent.value.author = author;
      if (content) editingContent.value.content = content;
      editingContent.value.linkUrl = wechatUrl.value;
      
      // 如果编辑器已初始化，更新编辑器内容
      if (editorCtx && content) {
        editorCtx.setContents({ html: content });
      }
      
      uni.showToast({ title: '解析成功', icon: 'success' });
    } else {
      uni.showToast({ title: res.message || '解析失败', icon: 'none' });
    }
  } catch (error) {
    console.error('Parse URL error:', error);
    uni.showToast({ title: '解析出错，请重试', icon: 'none' });
  } finally {
    parsing.value = false;
  }
};

const onCategoryChange = (e) => {
  categoryIndex.value = e.detail.value;
  editingContent.value.category = categoryOptions[categoryIndex.value];
};

const saveAsDraft = () => {
  saveContent(false);
};

const publishContent = () => {
  saveContent(true);
};

const saveContent = async (isActive) => {
  if (contentType.value !== 'ad' && !editingContent.value.category) {
    return uni.showToast({ title: '请选择分类', icon: 'none' });
  }
  if (contentType.value !== 'ad' && !editingContent.value.title) {
    return uni.showToast({ title: '请输入标题', icon: 'none' });
  }
  if (contentType.value === 'ad' && !editingContent.value.imageUrl) {
    return uni.showToast({ title: '请上传广告图片', icon: 'none' });
  }
  if ((contentType.value === 'notice' && noticeType.value === 'article') || (contentType.value === 'article' && articleNoticeType.value === 'article')) {
    if (!editingContent.value.content) {
      return uni.showToast({ title: '请输入内容', icon: 'none' });
    }
  }
  if ((contentType.value === 'notice' && noticeType.value === 'link') || (contentType.value === 'article' && articleNoticeType.value === 'link')) {
    if (!editingContent.value.linkUrl) {
      return uni.showToast({ title: '请输入跳转链接', icon: 'none' });
    }
  }
  if ((contentType.value === 'notice' && noticeType.value === 'wechat') || (contentType.value === 'article' && articleNoticeType.value === 'wechat')) {
    if (!editingContent.value.linkUrl) {
      return uni.showToast({ title: '请先解析微信文章链接', icon: 'none' });
    }
  }

  uni.showLoading({ title: '保存中...' });
  try {
    const postData = {
      ...editingContent.value,
      isActive: isActive,
      status: isActive ? 1 : 0,
      noticeType: contentType.value === 'article' ? articleNoticeType.value : noticeType.value,
      editorImageSource: editorImageSource.value,
      editorUploadedImage: editorUploadedImage.value,
      editorWechatImage: editorWechatImage.value
    };

    console.log('保存数据:', postData);

    let res;
    if (editingContent.value.id) {
      res = await adminApi.updateNotice(editingContent.value.id, postData);
    } else {
      res = await adminApi.createNotice(postData);
    }

    console.log('保存结果:', res);

    if (res.code === 0) {
      uni.showToast({ title: isActive ? '发布成功' : '草稿保存成功' });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' });
    }
  } catch (error) {
    console.error('保存错误:', error);
    uni.showToast({ title: '保存失败: ' + (error.message || '未知错误'), icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background-color: #fff;
  z-index: 100;
  box-sizing: content-box;
  border-bottom: 1rpx solid #eee;
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  color: #666;
}

.nav-title {
  font-size: 18px;
  font-weight: bold;
  color: #7b4397;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  font-size: 15px;
  margin-left: 15px;
}

.action-btn.draft {
  color: #7b4397;
}

.action-btn.publish {
  color: #7b4397;
  font-weight: bold;
}

.main-content {
  height: calc(100vh - 44px);
}

.form-container {
  padding: 15px;
}

.form-group {
  margin-bottom: 5px;
}

.group-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.type-selector {
  display: flex;
  background: #f2f2f2;
  border-radius: 8px;
  padding: 4px;
}

.type-option {
  flex: 1;
  text-align: center;
  padding: 6px;
  font-size: 13px;
  border-radius: 6px;
  color: #666;
  transition: all 0.3s;
}

.type-option.active {
  background: #fff;
  color: #7b4397;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(123, 67, 151, 0.15);
}

.form-picker {
  background-color: #f2f2f2;
  border-radius: 8px;
  padding: 8px 12px;
}

.picker-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.picker-text {
  font-size: 14px;
  color: #333;
}

.picker-arrow {
  color: #999;
}

.title-input {
  background-color: #f2f2f2;
  border-radius: 8px;
  padding: 8px 12px;
  border: 1rpx solid #e0e0e0;
  font-size: 14px;
  color: #333;
}

.description-input {
  background-color: #f2f2f2;
  border-radius: 8px;
  padding: 8px 12px;
  border: 1rpx solid #e0e0e0;
  font-size: 14px;
  width: 100%;
  height: 80px;
  box-sizing: border-box;
  color: #333;
}

.parse-section {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border-radius: 8px;
  padding: 10px;
}

.parse-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 5px;
}

.url-input {
  flex: 1;
  background-color: #fff;
  border-radius: 6px;
  padding: 8px 10px;
  border: 1rpx solid #e0e0e0;
  font-size: 13px;
}

.parse-btn {
  background-color: #7b4397;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 12px;
  height: 28px;
  line-height: 28px;
}

.parse-hint {
  font-size: 11px;
  color: #666;
}

.cover-upload {
  width: 100%;
  height: 150px;
  background-color: #f2f2f2;
  border-radius: 8px;
  border: 2rpx dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.cover-preview {
  width: 100%;
  height: 100%;
}

.cover-preview.default-cover {
  opacity: 0.8;
}

.cover-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 12px;
  text-align: center;
  padding: 4px 0;
}

.editor-wrapper {
  background-color: #fff;
  border-radius: 8px;
  border: 1rpx solid #e0e0e0;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
  background-color: #f5f5f5;
  border-bottom: 1rpx solid #eee;
  align-items: center;
}

.toolbar-item {
  height: 28px;
  min-width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1px;
  border-radius: 4px;
}

.toolbar-item.active {
  background-color: #e0e0e0;
}

.toolbar-icon {
  font-size: 16px;
  color: #333;
}

.toolbar-icon.bold { font-weight: bold; }
.toolbar-icon.italic { font-style: italic; }
.toolbar-icon.underline { text-decoration: underline; }

.toolbar-divider {
  width: 1rpx;
  height: 20px;
  background-color: #ddd;
  margin: 0 8px;
}

.editor-content {
  width: 100%;
  height: 250px;
  padding: 10px;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 1.5;
}

.switch-wrapper {
  display: flex;
  align-items: center;
}

.switch-text {
  margin-left: 10px;
  font-size: 13px;
  color: #666;
}

.image-selector {
  display: flex;
  background-color: #f2f2f2;
  border-radius: 6px;
  padding: 3px;
  margin-bottom: 5px;
}

.image-option {
  flex: 1;
  text-align: center;
  padding: 6px;
  font-size: 13px;
  border-radius: 4px;
  color: #666;
  transition: all 0.3s;
}

.image-option.active {
  background-color: #7b4397;
  color: #fff;
}

.default-image-preview,
.upload-image-preview,
.wechat-image-preview {
  width: 100%;
  height: 120px;
  background-color: #f2f2f2;
  border-radius: 6px;
  border: 2rpx dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  font-size: 40px;
  color: #999;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 14px;
  color: #999;
}

.dark-mode {
  background-color: #1a1a1a;
}

.dark-mode .nav-bar,
.dark-mode .form-picker,
.dark-mode .title-input,
.dark-mode .description-input,
.dark-mode .editor-wrapper,
.dark-mode .editor-toolbar,
.dark-mode .type-selector,
.dark-mode .url-input,
.dark-mode .cover-upload {
  background-color: #2c2c2c;
  border-color: #444;
}

.dark-mode .nav-title,
.dark-mode .group-label,
.dark-mode .picker-text,
.dark-mode .title-input,
.dark-mode .description-input,
.dark-mode .toolbar-icon,
.dark-mode .editor-content,
.dark-mode .type-option,
.dark-mode .url-input,
.dark-mode .switch-text {
  color: #e0e0e0;
}

.dark-mode .editor-toolbar {
  background-color: #333;
}

.dark-mode .toolbar-divider {
  background-color: #555;
}

.dark-mode .type-option.active {
  background: #3d3d3d;
}

.dark-mode .parse-section {
  background: linear-gradient(135deg, #3d3d3d 0%, #2c2c2c 100%);
}

.dark-mode .url-input {
  background-color: #3d3d3d;
}

.dark-mode .parse-hint {
  color: #999;
}

.dark-mode .picker-arrow {
  color: #e0e0e0;
}
</style>
