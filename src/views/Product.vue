<template>
  <el-container class="app-layout">
    <!-- Header -->
    <Header />

    <el-container class="body-container">
      <!-- Sidebar -->
      <Sidebar />

      <!-- Main Content -->
      <el-main class="app-main">
        <!-- Breadcrumb / Header Title -->
        <div class="page-title-row">
          <div>
            <h2 class="page-title">商品管理</h2>
            <p class="page-subtitle">管理商铺内的所有上架、下架商品，配置多规格信息。</p>
          </div>
        </div>

        <!-- Search Bar -->
        <el-card shadow="never" class="search-card">
          <el-form :inline="true" :model="searchForm" class="search-form" size="default">
            <el-form-item label="商品名称">
              <el-input v-model="searchForm.productName" placeholder="请输入商品名称" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item label="商品分类">
              <el-select v-model="searchForm.categoryId" placeholder="全部分类" clearable style="width: 160px">
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="商品状态">
              <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px">
                <el-option label="已上架" :value="1" />
                <el-option label="已下架" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" plain :icon="Search" @click="handleSearch">筛选</el-button>
              <el-button plain :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Action Card -->
        <el-card shadow="never" class="action-card">
          <el-button type="primary" plain :icon="Plus" @click="openCreateDrawer">新增商品</el-button>
          <el-button plain :icon="List" @click="handleCategoryManage">分类管理</el-button>
          <el-button plain :icon="Refresh" @click="loadProducts">刷新列表</el-button>
        </el-card>

        <!-- Table Card -->

        <!-- Table Card -->
        <el-card shadow="never" class="table-card">
          <div class="mode-indicator" v-if="isMockMode">
            <el-tag type="warning" effect="dark" size="small">
              ⚠️ 当前处于本地 Mock 数据演示模式（未连通后端 API）
            </el-tag>
          </div>
          <el-table :data="tableData" style="width: 100%" v-loading="loading" class="product-table">
            <el-table-column label="封面" width="110" align="left">
              <template #default="scope">
                <el-image
                  class="table-cover-img"
                  :src="scope.row.coverUrl"
                  :preview-src-list="[scope.row.coverUrl]"
                  preview-teleported
                  fit="cover"
                >
                  <template #error>
                    <div class="image-error-slot">
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
              </template>
            </el-table-column>
            <el-table-column label="商品信息" min-width="250" align="left">
              <template #default="scope">
                <div class="product-info-cell">
                  <div class="product-title">{{ scope.row.productName }}</div>
                  <div class="product-meta">分类：{{ scope.row.categoryName || '未分类' }}</div>
                  <div class="product-meta">商品ID：{{ scope.row.id }}</div>
                  <div class="product-meta">
                    总库存：
                    <span :class="{ 'low-stock': scope.row.totalStock <= 10 }">
                      {{ scope.row.totalStock }}
                    </span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="default" effect="light">
                  {{ scope.row.status === 1 ? '已上架' : '已下架' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updateTime" label="更新时间" width="200" align="center">
              <template #default="scope">
                <span>{{ formatDate(scope.row.updateTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="scope">
                <el-button link type="primary" size="default" @click="handleView(scope.row)">
                  <el-icon><View /></el-icon>详情
                </el-button>
                <el-button link type="primary" size="default" @click="handleEdit(scope.row)">
                  <el-icon><Edit /></el-icon>编辑
                </el-button>
                <el-button link :type="scope.row.status === 1 ? 'danger' : 'success'" size="default" @click="toggleStatus(scope.row)">
                  <el-icon><SwitchButton /></el-icon>{{ scope.row.status === 1 ? '下架' : '上架' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- Pagination -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pageNum"
              v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-main>
    </el-container>

    <!-- Create/Edit Drawer -->
    <el-drawer
      v-model="formDrawerVisible"
      :title="isEditMode ? '修改商品信息' : '新增商品'"
      size="680px"
      direction="rtl"
      :destroy-on-close="true"
      custom-class="form-drawer"
    >
      <el-form :model="productForm" :rules="formRules" ref="productFormRef" label-position="top">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="商品名称" prop="productName">
              <el-input v-model="productForm.productName" placeholder="请输入商品名称" maxLength="100" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类名称" prop="categoryName">
              <el-select v-model="productForm.categoryName" placeholder="请选择或输入分类" filterable allow-create @change="handleCategoryChange">
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发货地" prop="deliveryPlace">
              <el-input v-model="productForm.deliveryPlace" placeholder="请输入发货地，例如：广东深圳" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="封面图 URL" prop="coverUrl">
              <el-input v-model="productForm.coverUrl" placeholder="请输入封面图片地址" />
              <div class="image-preview-wrapper" v-if="productForm.coverUrl">
                <el-image :src="productForm.coverUrl" fit="cover" class="image-preview">
                  <template #error>
                    <div class="preview-error">地址不可用</div>
                  </template>
                </el-image>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品状态" prop="status">
              <el-radio-group v-model="productForm.status">
                <el-radio :label="1">上架</el-radio>
                <el-radio :label="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Carousel Urls -->
        <el-form-item label="轮播图列表 (最多 5 张)">
          <div v-for="(url, index) in productForm.carouselUrls" :key="index" class="carousel-url-row">
            <el-input v-model="productForm.carouselUrls[index]" placeholder="请输入轮播图链接" style="flex: 1" />
            <el-button type="danger" :icon="Delete" circle @click="removeCarouselUrl(index)" />
          </div>
          <el-button type="dashed" :icon="Plus" @click="addCarouselUrl" v-if="productForm.carouselUrls.length < 5" style="width: 100%; margin-top: 8px">
            添加轮播图链接
          </el-button>
        </el-form-item>

        <!-- Description -->
        <el-form-item label="商品描述" prop="description">
          <el-input type="textarea" :rows="4" v-model="productForm.description" placeholder="请输入商品详细描述..." />
        </el-form-item>

        <!-- Specifications (Specs) -->
        <div class="specs-section">
          <div class="specs-section-header">
            <h4 class="section-title">商品规格管理</h4>
            <el-button type="primary" size="small" :icon="Plus" @click="addSpec">添加规格</el-button>
          </div>
          
          <el-table :data="productForm.specs" class="specs-table" border size="small">
            <el-table-column label="规格名称" min-width="120">
              <template #default="scope">
                <el-input v-model="scope.row.specName" placeholder="如: 黑色 64G" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="规格图片 URL" min-width="140">
              <template #default="scope">
                <el-input v-model="scope.row.imageUrl" placeholder="图片 URL" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="价格 (元)" width="100">
              <template #default="scope">
                <el-input-number v-model="scope.row.price" :precision="2" :step="1" :min="0" size="small" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="库存" width="90">
              <template #default="scope">
                <el-input-number v-model="scope.row.stock" :min="0" :step="1" size="small" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="80">
              <template #default="scope">
                <el-input-number v-model="scope.row.sort" :min="0" size="small" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="scope">
                <el-button type="danger" :icon="Delete" size="small" circle @click="removeSpec(scope.$index)" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="formDrawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- Detail Drawer -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="商品详情"
      size="560px"
      direction="rtl"
      custom-class="detail-drawer"
    >
      <div v-if="detailData" class="detail-container">
        <div class="detail-section">
          <div class="detail-cover-wrapper">
            <el-image :src="detailData.coverUrl" fit="cover" class="detail-cover" />
            <div class="detail-status-tag">
              <el-tag :type="detailData.status === 1 ? 'success' : 'danger'" effect="dark">
                {{ detailData.status === 1 ? '已上架' : '已下架' }}
              </el-tag>
            </div>
          </div>
          <h3 class="detail-product-name">{{ detailData.productName }}</h3>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">商品 ID</span>
              <span class="info-value">{{ detailData.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">商品分类</span>
              <span class="info-value">
                <el-tag type="info" size="small">{{ detailData.categoryName || '未分类' }}</el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">发货地点</span>
              <span class="info-value">{{ detailData.deliveryPlace || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">总库存</span>
              <span class="info-value">{{ detailData.totalStock }} 件</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ formatDate(detailData.createTime) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">更新时间</span>
              <span class="info-value">{{ formatDate(detailData.updateTime) }}</span>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="detail-section" v-if="detailData.carouselUrls && detailData.carouselUrls.length">
          <h4 class="detail-section-title">商品轮播图</h4>
          <div class="detail-carousels">
            <el-image
              v-for="(url, idx) in detailData.carouselUrls"
              :key="idx"
              :src="url"
              fit="cover"
              class="carousel-thumb"
              :preview-src-list="detailData.carouselUrls"
              :initial-index="idx"
              preview-teleported
            />
          </div>
        </div>

        <el-divider v-if="detailData.carouselUrls && detailData.carouselUrls.length" />

        <div class="detail-section">
          <h4 class="detail-section-title">商品描述</h4>
          <p class="detail-description">{{ detailData.description || '暂无商品描述' }}</p>
        </div>

        <el-divider />

        <div class="detail-section">
          <h4 class="detail-section-title">商品规格 ({{ detailData.specs ? detailData.specs.length : 0 }})</h4>
          <el-table :data="detailData.specs" size="small" border class="detail-specs-table">
            <el-table-column label="图片" width="70" align="center">
              <template #default="scope">
                <el-image :src="scope.row.imageUrl" fit="cover" class="spec-thumb-img" v-if="scope.row.imageUrl" />
                <span v-else class="no-img-text">无图</span>
              </template>
            </el-table-column>
            <el-table-column prop="specName" label="规格名称" min-width="120" />
            <el-table-column prop="price" label="价格" width="90" align="right">
              <template #default="scope">
                <span class="price-text">¥ {{ (Number(scope.row.price) || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="80" align="center" />
            <el-table-column prop="sort" label="排序" width="60" align="center" />
          </el-table>
        </div>
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Shop, Menu, List, ArrowDown, SwitchButton, Plus, Search, Refresh, Delete, Picture, View, Edit
} from '@element-plus/icons-vue'
import { removeToken } from '@/utils/token'
import { getProductPage, getProductDetail, addProduct, updateProduct } from '@/api/productApi'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'

const router = useRouter()
const loading = ref(false)
const submitLoading = ref(false)
const isMockMode = ref(false)



// Categories list
const categories = ref([
  { id: 1, name: '办公文具' },
  { id: 2, name: '数码电子' },
  { id: 3, name: '食品生鲜' },
  { id: 4, name: '服饰箱包' }
])

// Mock default data
const defaultMockProducts = [
  {
    id: 1001,
    productName: "数智工会定制保温杯",
    status: 1,
    coverUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=300&q=80",
    carouselUrls: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1517256064527-09c53b2d0c6f?auto=format&fit=crop&w=500&q=80"
    ],
    description: "高品质不锈钢材质，智能温度显示，数智工会专属定制LOGO，送礼自用两相宜。",
    deliveryPlace: "广东深圳",
    categoryId: 1,
    categoryName: "办公文具",
    totalStock: 120,
    createTime: "2026-05-20 10:00:00",
    updateTime: "2026-05-20 12:00:00",
    specs: [
      { id: 10011, specName: "智雅黑 500ml", imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=150&q=80", price: 49.0, stock: 50, sort: 1 },
      { id: 10012, specName: "极光银 500ml", imageUrl: "https://images.unsplash.com/photo-1517256064527-09c53b2d0c6f?auto=format&fit=crop&w=150&q=80", price: 49.0, stock: 70, sort: 2 }
    ]
  },
  {
    id: 1002,
    productName: "无线降噪蓝牙耳机",
    status: 1,
    coverUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80",
    carouselUrls: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=500&q=80"
    ],
    description: "主动降噪技术，超长续航30小时，人体工学设计，高保真音质体验。",
    deliveryPlace: "上海",
    categoryId: 2,
    categoryName: "数码电子",
    totalStock: 85,
    createTime: "2026-05-19 14:00:00",
    updateTime: "2026-05-20 11:30:00",
    specs: [
      { id: 10021, specName: "皓月白", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80", price: 299.0, stock: 45, sort: 1 },
      { id: 10022, specName: "幻影黑", imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=150&q=80", price: 309.0, stock: 40, sort: 2 }
    ]
  },
  {
    id: 1003,
    productName: "工会福利：精选干果礼盒",
    status: 0,
    coverUrl: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&w=300&q=80",
    carouselUrls: [
      "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&w=500&q=80"
    ],
    description: "精选全球优质产区干果，包括扁桃仁、夏威夷果、腰果等，真空包装，健康美味。",
    deliveryPlace: "新疆乌鲁木齐",
    categoryId: 3,
    categoryName: "食品生鲜",
    totalStock: 200,
    createTime: "2026-05-18 09:00:00",
    updateTime: "2026-05-18 09:00:00",
    specs: [
      { id: 10031, specName: "尊享礼盒装 1.2kg", imageUrl: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&w=150&q=80", price: 128.0, stock: 200, sort: 1 }
    ]
  }
]

// Date Formatter helper
const formatDate = (dateVal) => {
  if (!dateVal) return '-'
  if (typeof dateVal === 'string') return dateVal
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return '-'
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const r = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${r} ${hh}:${mm}:${ss}`
  } catch (e) {
    return '-'
  }
}

// Initialize mock store
const initMockStore = () => {
  if (!localStorage.getItem('mock_products')) {
    localStorage.setItem('mock_products', JSON.stringify(defaultMockProducts))
  }
}

// Search form reactive state
const searchForm = reactive({
  productName: '',
  categoryId: '',
  status: ''
})

// Table & Pagination state
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

// Load product records
const loadProducts = async () => {
  loading.value = true
  const params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    productName: searchForm.productName || undefined,
    categoryId: searchForm.categoryId || undefined,
    status: searchForm.status !== '' ? searchForm.status : undefined
  }

  try {
    const res = await getProductPage(params)
    if (res && (res.code === 200 || res.code === 0) && res.data) {
      tableData.value = res.data.records || []
      total.value = Number(res.data.total) || 0
      isMockMode.value = false
    } else {
      throw new Error(res?.message || '接口错误')
    }
  } catch (err) {
    console.warn('API获取失败，降级为 Mock 数据模式:', err)
    isMockMode.value = true
    initMockStore()
    
    // Query mock data from localStorage
    let allMock = JSON.parse(localStorage.getItem('mock_products') || '[]')
    
    // Filter logic
    if (searchForm.productName) {
      allMock = allMock.filter(p => p.productName.toLowerCase().includes(searchForm.productName.toLowerCase()))
    }
    if (searchForm.categoryId) {
      allMock = allMock.filter(p => p.categoryId === searchForm.categoryId)
    }
    if (searchForm.status !== '') {
      allMock = allMock.filter(p => p.status === searchForm.status)
    }
    
    total.value = allMock.length
    
    // Paginate
    const start = (pageNum.value - 1) * pageSize.value
    const end = start + pageSize.value
    tableData.value = allMock.slice(start, end)
  } finally {
    loading.value = false
  }
}

// Search trigger
const handleSearch = () => {
  pageNum.value = 1
  loadProducts()
}

// Reset search
const handleReset = () => {
  searchForm.productName = ''
  searchForm.categoryId = ''
  searchForm.status = ''
  pageNum.value = 1
  loadProducts()
}

// Category management mock handler
const handleCategoryManage = () => {
  ElMessage.info('分类管理功能开发中...')
}

// Pagination triggers
const handleSizeChange = (val) => {
  pageSize.value = val
  pageNum.value = 1
  loadProducts()
}
const handleCurrentChange = (val) => {
  pageNum.value = val
  loadProducts()
}

// Product detail view drawer state
const detailDrawerVisible = ref(false)
const detailData = ref(null)

const handleView = async (row) => {
  try {
    if (isMockMode.value) {
      const allMock = JSON.parse(localStorage.getItem('mock_products') || '[]')
      detailData.value = allMock.find(p => p.id === row.id)
    } else {
      const res = await getProductDetail(row.id)
      if (res && (res.code === 200 || res.code === 0) && res.data) {
        detailData.value = res.data
      } else {
        throw new Error(res?.message || '详情获取失败')
      }
    }
    detailDrawerVisible.value = true
  } catch (err) {
    ElMessage.error(err.message || '获取商品详情失败')
  }
}

// Create/Edit form drawer state
const formDrawerVisible = ref(false)
const isEditMode = ref(false)
const editingId = ref(null)
const productFormRef = ref(null)

const productForm = reactive({
  productName: '',
  coverUrl: '',
  carouselUrls: [''],
  description: '',
  deliveryPlace: '',
  categoryId: '',
  categoryName: '',
  status: 1,
  specs: []
})

const formRules = {
  productName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryName: [{ required: true, message: '请选择或输入分类', trigger: 'change' }],
  coverUrl: [{ required: true, message: '请输入商品封面图链接', trigger: 'blur' }]
}

// Drawer openers
const openCreateDrawer = () => {
  isEditMode.value = false
  editingId.value = null
  Object.assign(productForm, {
    productName: '',
    coverUrl: '',
    carouselUrls: [''],
    description: '',
    deliveryPlace: '',
    categoryId: '',
    categoryName: '',
    status: 1,
    specs: [{ specName: '默认规格', imageUrl: '', price: 9.9, stock: 100, sort: 1 }]
  })
  formDrawerVisible.value = true
}

const handleEdit = async (row) => {
  isEditMode.value = true
  editingId.value = row.id
  
  try {
    let data = null
    if (isMockMode.value) {
      const allMock = JSON.parse(localStorage.getItem('mock_products') || '[]')
      data = allMock.find(p => p.id === row.id)
    } else {
      const res = await getProductDetail(row.id)
      if (res && (res.code === 200 || res.code === 0) && res.data) {
        data = res.data
      }
    }

    if (data) {
      Object.assign(productForm, {
        productName: data.productName || '',
        coverUrl: data.coverUrl || '',
        carouselUrls: data.carouselUrls && data.carouselUrls.length ? [...data.carouselUrls] : [''],
        description: data.description || '',
        deliveryPlace: data.deliveryPlace || '',
        categoryId: data.categoryId || '',
        categoryName: data.categoryName || '',
        status: data.status !== undefined ? data.status : 1,
        specs: data.specs && data.specs.length ? data.specs.map(s => ({ ...s })) : []
      })
      formDrawerVisible.value = true
    } else {
      ElMessage.error('未获取到商品数据')
    }
  } catch (err) {
    ElMessage.error(err.message || '获取商品详情失败')
  }
}

// Carousel link list dynamic methods
const addCarouselUrl = () => {
  if (productForm.carouselUrls.length < 5) {
    productForm.carouselUrls.push('')
  }
}
const removeCarouselUrl = (index) => {
  productForm.carouselUrls.splice(index, 1)
  if (productForm.carouselUrls.length === 0) {
    productForm.carouselUrls.push('')
  }
}

// Specification list dynamic methods
const addSpec = () => {
  productForm.specs.push({
    specName: '',
    imageUrl: '',
    price: 0,
    stock: 0,
    sort: productForm.specs.length + 1
  })
}
const removeSpec = (index) => {
  productForm.specs.splice(index, 1)
}

// Handle Category change to sync category ID
const handleCategoryChange = (val) => {
  const existing = categories.value.find(c => c.name === val)
  if (existing) {
    productForm.categoryId = existing.id
  } else {
    // Generate a random category ID for customized categorizations
    productForm.categoryId = Math.floor(Math.random() * 1000) + 10
  }
}

// Form Submission
const submitForm = async () => {
  if (!productFormRef.value) return
  await productFormRef.value.validate(async (valid) => {
    if (!valid) return

    // Filters empty string in carousels
    const cleanCarousels = productForm.carouselUrls.filter(url => url.trim() !== '')

    // Sum stock
    const calculatedTotalStock = productForm.specs.reduce((acc, curr) => acc + (curr.stock || 0), 0)

    const payload = {
      productName: productForm.productName,
      coverUrl: productForm.coverUrl,
      carouselUrls: cleanCarousels,
      description: productForm.description,
      deliveryPlace: productForm.deliveryPlace,
      categoryId: Number(productForm.categoryId) || 1,
      categoryName: productForm.categoryName,
      specs: productForm.specs.map(s => ({
        specName: s.specName || '默认规格',
        imageUrl: s.imageUrl || '',
        price: Number(s.price) || 0,
        stock: Number(s.stock) || 0,
        sort: Number(s.sort) || 1
      }))
    }

    submitLoading.value = true
    try {
      if (isEditMode.value) {
        if (isMockMode.value) {
          // Mock modification
          let allMock = JSON.parse(localStorage.getItem('mock_products') || '[]')
          const idx = allMock.findIndex(p => p.id === editingId.value)
          if (idx !== -1) {
            allMock[idx] = {
              ...allMock[idx],
              ...payload,
              totalStock: calculatedTotalStock,
              updateTime: new Date().toLocaleString()
            }
            localStorage.setItem('mock_products', JSON.stringify(allMock))
            ElMessage.success('商品信息更新成功 (本地 Mock 模式)')
          }
        } else {
          // Send API PUT request
          const res = await updateProduct(editingId.value, payload)
          if (res && (res.code === 200 || res.code === 0)) {
            ElMessage.success('商品信息更新成功')
          } else {
            throw new Error(res?.message || '更新失败')
          }
        }
      } else {
        if (isMockMode.value) {
          // Mock addition
          let allMock = JSON.parse(localStorage.getItem('mock_products') || '[]')
          const newProduct = {
            id: Math.floor(Math.random() * 9000) + 1000,
            ...payload,
            status: productForm.status,
            totalStock: calculatedTotalStock,
            createTime: new Date().toLocaleString(),
            updateTime: new Date().toLocaleString()
          }
          allMock.unshift(newProduct)
          localStorage.setItem('mock_products', JSON.stringify(allMock))
          ElMessage.success('商品新增成功 (本地 Mock 模式)')
        } else {
          // Send API POST request
          const res = await addProduct({ ...payload, status: productForm.status })
          if (res && (res.code === 200 || res.code === 0)) {
            ElMessage.success('商品新增成功')
          } else {
            throw new Error(res?.message || '新增失败')
          }
        }
      }
      formDrawerVisible.value = false
      loadProducts()
    } catch (err) {
      console.error(err)
      // Offer mock fallback if network is unreachable
      ElMessageBox.confirm(`请求出错: ${err.message || '网络连接失败'}。是否保存至本地缓存作为演示数据？`, '提示', {
        confirmButtonText: '保存到本地',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        isMockMode.value = true
        initMockStore()
        
        let allMock = JSON.parse(localStorage.getItem('mock_products') || '[]')
        if (isEditMode.value) {
          const idx = allMock.findIndex(p => p.id === editingId.value)
          if (idx !== -1) {
            allMock[idx] = {
              ...allMock[idx],
              ...payload,
              totalStock: calculatedTotalStock,
              updateTime: new Date().toLocaleString()
            }
          }
        } else {
          const newProduct = {
            id: Math.floor(Math.random() * 9000) + 1000,
            ...payload,
            status: productForm.status,
            totalStock: calculatedTotalStock,
            createTime: new Date().toLocaleString(),
            updateTime: new Date().toLocaleString()
          }
          allMock.unshift(newProduct)
        }
        localStorage.setItem('mock_products', JSON.stringify(allMock))
        ElMessage.success('已保存到本地 Mock 数据')
        formDrawerVisible.value = false
        loadProducts()
      }).catch(() => {})
    } finally {
      submitLoading.value = false
    }
  })
}

// Toggle Online/Offline status
const toggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const actionText = newStatus === 1 ? '上架' : '下架'

  ElMessageBox.confirm(`确定要${actionText}商品「${row.productName}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      if (isMockMode.value) {
        let allMock = JSON.parse(localStorage.getItem('mock_products') || '[]')
        const idx = allMock.findIndex(p => p.id === row.id)
        if (idx !== -1) {
          allMock[idx].status = newStatus
          allMock[idx].updateTime = new Date().toLocaleString()
          localStorage.setItem('mock_products', JSON.stringify(allMock))
          ElMessage.success(`商品已${actionText} (Mock 模式)`)
          loadProducts()
        }
      } else {
        // Since there is no dedicated toggleStatus API, we update it via the put API
        let fullData = null
        const resDetail = await getProductDetail(row.id)
        if (resDetail && (resDetail.code === 200 || resDetail.code === 0) && resDetail.data) {
          fullData = resDetail.data
        }

        if (fullData) {
          const updatePayload = {
            productName: fullData.productName,
            coverUrl: fullData.coverUrl,
            carouselUrls: fullData.carouselUrls,
            description: fullData.description,
            deliveryPlace: fullData.deliveryPlace,
            categoryId: fullData.categoryId,
            categoryName: fullData.categoryName,
            status: newStatus,
            specs: fullData.specs
          }
          const resUpdate = await updateProduct(row.id, updatePayload)
          if (resUpdate && (resUpdate.code === 200 || resUpdate.code === 0)) {
            ElMessage.success(`商品已${actionText}`)
            loadProducts()
          } else {
            throw new Error(resUpdate?.message || '修改状态失败')
          }
        } else {
          throw new Error('未获取到商品最新数据')
        }
      }
    } catch (err) {
      ElMessage.error(`操作失败: ${err.message}`)
    }
  }).catch(() => {})
}





onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
/* Main Layout Container */
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}



/* Body Container & Aside */
.body-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}



/* Main Area Layout */
.app-main {
  background-color: #f8fafc;
  padding: 24px;
  overflow-y: auto;
}

.page-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.btn-create {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
}

.btn-create:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
}

/* Search panel styling */
.search-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 8px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 18px;
}

/* Table styling */
.table-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.mode-indicator {
  margin-bottom: 12px;
}

.table-cover-img {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  display: block;
}

.image-error-slot {
  width: 100%;
  height: 100%;
  background-color: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  text-align: center;
  border-radius: 6px;
}

.low-stock {
  color: #ef4444;
  font-weight: bold;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* Form Drawer styling */
.carousel-url-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.image-preview-wrapper {
  margin-top: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px;
  width: fit-content;
}

.image-preview {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  display: block;
}

.preview-error {
  width: 80px;
  height: 80px;
  font-size: 11px;
  background-color: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.specs-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  background-color: #f8fafc;
}

.specs-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.specs-table {
  border-radius: 6px;
  overflow: hidden;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

/* Detail Drawer styling */
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-cover-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.detail-cover {
  width: 100%;
  height: 240px;
  display: block;
}

.detail-status-tag {
  position: absolute;
  top: 16px;
  right: 16px;
}

.detail-product-name {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #64748b;
}

.info-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 12px 0;
}

.detail-carousels {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.carousel-thumb {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
}

.detail-description {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

.detail-specs-table {
  border-radius: 8px;
}

.spec-thumb-img {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  vertical-align: middle;
}

.no-img-text {
  font-size: 11px;
  color: #94a3b8;
}

.price-text {
  color: #6366f1;
  font-weight: 600;
}

.action-card {
  margin-bottom: 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.action-card :deep(.el-card__body) {
  padding: 12px 16px;
  display: flex;
  gap: 12px;
}

.product-info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

.product-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
}

.product-meta {
  font-size: 12px;
  color: #64748b;
}
</style>
