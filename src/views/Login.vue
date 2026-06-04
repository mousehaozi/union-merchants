<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { Connection, Iphone, Key, Lock, Message, User, Shop, Loading } from '@element-plus/icons-vue'

import { getCaptcha, login } from '@/api/authApi'
import { getImageUrl } from '@/utils/getimage.js'
import { setToken } from '@/utils/token'

import loginBg from '@/assets/login_bg.png'
import loginBgRural2 from '@/assets/login_bg_rural2.png'
import logoImg from '@/assets/logo.png'

defineOptions({
  name: 'LoginView',
})

const router = useRouter()
const route = useRoute()

const PHONE_REGEX = /^1[3-9]\d{9}$/
const SMS_COUNTDOWN_TIME = 60

const captchaImage = ref('')
const isMockMode = ref(false)
const loginLoading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  captchaKey: '',
})

const currentBackgroundIndex = ref(0)
const isBackgroundEntering = ref(true)

let backgroundTimer = null

const verificationImageSrc = computed(() => captchaImage.value || '')
const backgroundImages = [loginBg, loginBgRural2]
const loginNotes = [
  {
    title: '登录方式',
    description: '支持账号密码、手机短信等登录方式。',
  },
  {
    title: '使用提示',
    description: '商户入驻请点击下方按钮进行申请。',
  },
  {
    title: '遇到问题',
    description: '如无法登录，可联系平台管理员处理。',
  },
]

const validatePasswordForm = () => {
  if (!loginForm.username.trim()) {
    ElMessage({ message: '请输入账号', type: 'warning' })
    return false
  }
  if (!loginForm.password.trim()) {
    ElMessage({ message: '请输入密码', type: 'warning' })
    return false
  }
  if (!loginForm.captcha.trim()) {
    ElMessage({ message: '请输入验证码', type: 'warning' })
    return false
  }
  return true
}


const handleLoginSuccess = async () => {
  ElMessage({ message: '登录成功', type: 'success' })
  const redirect = route.query.redirect || '/'
  await router.push({ path: redirect })
}

const loadCaptcha = async () => {
  try {
    const res = await getCaptcha()
    if (res && (res.code === 200 || res.code === 0) && res.data) {
      loginForm.captchaKey = res.data.captchaKey || res.data.key || ''
      captchaImage.value = res.data.captchaImage || res.data.image || res.data.img || res.data.captcha || ''
      isMockMode.value = false
    } else {
      ElMessage.error(res?.message || '获取验证码失败')
    }
  } catch (err) {
    console.error('获取验证码错误:', err)
    isMockMode.value = true
    loginForm.captchaKey = 'mock-captcha-key'
    captchaImage.value = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="110" height="40" viewBox="0 0 110 40"><rect width="110" height="40" fill="%23f5f7fa"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23008b57" font-weight="bold">MOCK</text></svg>'
  }
}

const onSubmit = async () => {
  if (!validatePasswordForm()) {
    return
  }

  loginLoading.value = true
  try {
    if (isMockMode.value) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setToken('mock-token')
      await handleLoginSuccess()
      return
    }
    const res = await login({
      username: loginForm.username,
      password: loginForm.password,
      captcha: loginForm.captcha,
      captchaKey: loginForm.captchaKey
    })
    
    if (res && (res.code === 200 || res.code === 0) && res.data) {
      const token = res.data.token
      setToken(token)
      await handleLoginSuccess()
    } else {
      ElMessage.error(res?.message || '登录失败')
      loginForm.captcha = ''
      await loadCaptcha().catch(() => {})
    }
  } catch (error) {
    console.warn('登录失败，启用本地 Mock 仿真演示模式：', error)
    isMockMode.value = true
    ElMessage.warning('已自动登录到本地 Mock 仿真模式')
    setToken('mock-token')
    await handleLoginSuccess()
  } finally {
    loginLoading.value = false
  }
}


const startBackgroundRotation = () => {
  backgroundTimer = setInterval(() => {
    currentBackgroundIndex.value = (currentBackgroundIndex.value + 1) % backgroundImages.length
  }, 3000)
}

const goToApply = () => {
  router.push('/merchant-apply')
}

const handleBackgroundEnterEnd = () => {
  isBackgroundEntering.value = false
}

const parseImgSrc = (src) => {
  if (!src) return ''
  if (src.startsWith('data:')) return src
  return getImageUrl(src)
}

onMounted(async () => {
  startBackgroundRotation()
  try {
    await loadCaptcha()
  } catch (error) {
    ElMessage({ message: error.message || '验证码加载失败', type: 'error' })
  }
  setTimeout(() => {
    isBackgroundEntering.value = false
  }, 2400)
})

onBeforeUnmount(() => {
  if (backgroundTimer) {
    clearInterval(backgroundTimer)
  }
})
</script>

<template>
  <div class="login-shell">
    <div class="login-shell__glow login-shell__glow--left" />
    <div class="login-shell__glow login-shell__glow--right" />

    <div class="login-background">
      <div
        v-for="(image, index) in backgroundImages"
        :key="image"
        class="login-background__image"
        :class="{
          'login-background__image--active': currentBackgroundIndex === index,
          'login-background__image--enter':
            index === 0 && currentBackgroundIndex === 0 && isBackgroundEntering,
        }"
        :style="{ backgroundImage: `url(${image})` }"
        @animationend="handleBackgroundEnterEnd"
      />
      <div class="login-background__overlay" />

      <div class="login-background__content">
        <div class="brand-mark">
          <div class="brand-mark__logo">
            <img :src="logoImg" alt="智慧商品管理系统" />
          </div>
          <div class="brand-mark__text">
            <span class="brand-mark__eyebrow login-text-enter">智慧工会平台</span>
            <h1 class="brand-mark__title login-text-enter">智慧商品管理系统</h1>
            <p class="brand-mark__subtitle login-text-enter">Smart Merchant Management System</p>
          </div>
        </div>

        <div class="login-background__info">
          <p class="login-aside__description login-text-enter">专注工会服务，提升商家运营与发展</p>

          <div class="login-notes">
            <article
              v-for="item in loginNotes"
              :key="item.title"
              class="login-note login-text-enter"
            >
              <h2 class="login-note__title">{{ item.title }}</h2>
              <p class="login-note__description">
                {{ item.description }}
              </p>
            </article>
          </div>
        </div>
      </div>
    </div>

    <section class="login-panel">
      <div class="login-card login-card--enter">
        <div class="login-card__header">
          <span class="login-card__eyebrow">欢迎登录</span>
          <h2 class="login-card__title">账号密码登录</h2>
          <p class="login-card__description">
            请输入账号、密码和图形验证码完成登录。
          </p>
        </div>

        <div class="mock-alert-banner" v-if="isMockMode" style="margin-bottom: 16px;">
          <el-alert
            title="提示：启用本地 Mock 仿真演示模式，任意账号密码即可登录。"
            type="warning"
            show-icon
            :closable="false"
          />
        </div>

        <div class="form-stage">
          <el-form
            :model="loginForm"
            label-position="top"
            class="login-form"
          >
            <el-form-item label="账号">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入账号"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                size="large"
                :prefix-icon="Lock"
              />
            </el-form-item>
            <el-form-item label="验证码">
              <div class="code-box">
                <el-input
                  v-model="loginForm.captcha"
                  placeholder="请输入验证码"
                  size="large"
                  :prefix-icon="Key"
                  @keydown.enter="onSubmit"
                />
                <button type="button" class="captcha-trigger" @click="loadCaptcha">
                  <img v-if="verificationImageSrc" :src="parseImgSrc(verificationImageSrc)" alt="验证码" class="verification-img" />
                  <span v-else style="color: #666; font-size: 13px;">加载中</span>
                </button>
              </div>
            </el-form-item>
            <el-form-item>
              <button
                type="button"
                class="login-button"
                :disabled="loginLoading"
                @click="onSubmit"
              >
                <el-icon v-if="!loginLoading"><User /></el-icon>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
                <span>登 录</span>
              </button>
            </el-form-item>
          </el-form>
        </div>

        <div class="other-login-methods">
          <div class="other-login-methods__divider">
            <span>其他选项</span>
          </div>
          <button type="button" class="other-login-methods__entry" @click="goToApply">
            <span class="other-login-methods__icon">
              <el-icon size="20"><Shop /></el-icon>
            </span>
            <span class="other-login-methods__label">
              <span>商家入驻申请</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-shell {
  position: relative;
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  padding: 0;
  background:
    radial-gradient(circle at top left, rgba(16, 185, 129, 0.08), transparent 35%),
    radial-gradient(circle at bottom right, rgba(5, 150, 105, 0.06), transparent 40%),
    linear-gradient(180deg, #f7faf8 0%, #f0f5f2 100%);
}

.login-shell__glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(22px);
}

.login-shell__glow--left {
  top: 4%;
  left: -8%;
  width: 280px;
  height: 280px;
  background: rgba(52, 211, 153, 0.2);
}

.login-shell__glow--right {
  right: -8%;
  bottom: 3%;
  width: 320px;
  height: 320px;
  background: rgba(16, 185, 129, 0.15);
}

.login-background {
  position: relative;
  z-index: 0;
  flex: 1;
  overflow: hidden;
  color: #fff;
}

.login-background__image {
  position: absolute;
  inset: 0;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  opacity: 0;
  transform: scale(1);
  transition: opacity 1s ease;
  will-change: transform, opacity;
}

.login-background__image--active {
  opacity: 1;
}

.login-background__image--enter {
  animation: login-background-enter 2.4s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

@keyframes login-background-enter {
  0% {
    transform: scale(1.14);
  }

  100% {
    transform: scale(1);
  }
}

.login-background__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(8, 18, 15, 0.46), rgba(5, 10, 8, 0.72)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 45%),
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.08), transparent 35%);
}

.login-background__content {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px min(38vw, 520px) 48px 48px;
  gap: 32px;
}

.login-background__info {
  display: grid;
  gap: 18px;
}

.brand-mark {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark__logo {
  display: flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  padding: 10px;
}

.brand-mark__logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-mark__text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.brand-mark__eyebrow {
  font-size: 13px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.74);
}

.login-text-enter {
  opacity: 0;
  filter: blur(14px);
  transform: translateY(18px);
  animation: login-text-enter 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
  will-change: transform, opacity, filter;
}

.brand-mark__eyebrow.login-text-enter {
  animation-delay: 0.2s;
}

.brand-mark__title.login-text-enter {
  animation-delay: 0.32s;
}

.brand-mark__subtitle.login-text-enter {
  animation-delay: 0.44s;
}

.login-aside__description.login-text-enter {
  animation-delay: 0.56s;
}

.login-note.login-text-enter:nth-child(1) {
  animation-delay: 0.68s;
}

.login-note.login-text-enter:nth-child(2) {
  animation-delay: 0.8s;
}

.login-note.login-text-enter:nth-child(3) {
  animation-delay: 0.92s;
}

@keyframes login-text-enter {
  0% {
    opacity: 0;
    filter: blur(14px);
    transform: translateY(18px);
  }

  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

.brand-mark__title {
  margin: 0;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.22;
}

.brand-mark__subtitle {
  margin: 0;
  font-size: 14px;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.78);
  text-transform: uppercase;
}

.login-aside__description {
  max-width: 560px;
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 18px;
  line-height: 1.8;
}

.login-notes {
  display: grid;
  gap: 12px;
}

.login-note {
  max-width: 430px;
  padding-left: 14px;
  border-left: 2px solid rgba(255, 255, 255, 0.28);
}

.login-note__title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
}

.login-note__description {
  margin: 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 13px;
  line-height: 1.7;
}

.login-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: min(42vw, 500px);
  padding: 32px 32px 32px 0;
  pointer-events: none;
}

.login-card {
  width: min(100%, 340px);
  max-height: calc(100dvh - 64px);
  overflow: auto;
  border: 1px solid rgba(192, 204, 224, 0.7);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 24px 48px rgba(51, 77, 116, 0.12);
  backdrop-filter: blur(14px);
  padding: 32px 28px;
  pointer-events: auto;
}

.login-card--enter {
  opacity: 0;
  filter: blur(18px);
  transform: translateY(24px);
  animation: login-card-enter 0.88s cubic-bezier(0.2, 0.7, 0.2, 1) 0.52s forwards;
  will-change: transform, opacity, filter;
}

@keyframes login-card-enter {
  0% {
    opacity: 0;
    filter: blur(18px);
    transform: translateY(24px);
  }

  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

.login-card__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.login-card__eyebrow {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  background: #e9f7ee;
  color: #0b784a;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 6px 10px;
}

.login-card__title {
  margin: 0;
  color: #083c27;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.28;
}

.login-card__description {
  margin: 0;
  color: #556c60;
  font-size: 13px;
  line-height: 1.65;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.mode-switch__button {
  margin: 0;
  height: 40px;
  border-radius: 12px;
  border-color: #d8e1ef;
  background: #f8fbff;
  color: #4e6787;
  font-size: 13px;
  font-weight: 500;
}

.mode-switch__button:hover,
.mode-switch__button:focus-visible {
  border-color: #90b0f2;
  color: #234f9c;
  background: #f4f8ff;
}

.mode-switch__button--active {
  border-color: #6ee7b7;
  color: #047857;
  background: #ecfdf5;
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.18);
}

.form-stage {
  min-height: 288px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.login-form :deep(.el-form-item__label) {
  color: #51657f;
  font-weight: 500;
  margin-bottom: 6px;
  font-size: 13px;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 12px;
  box-shadow: 0 0 0 1px #d9e3f1 inset;
}

.login-form :deep(.el-input__inner) {
  font-size: 13px;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #a7f3d0 inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #10b981 inset;
}

.code-box {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.code-box :deep(.el-input) {
  flex: 1;
}

.code-box--sms {
  align-items: stretch;
}

.captcha-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 110px;
  min-width: 110px;
  height: 42px;
  border: 1px solid #d9e3f1;
  border-radius: 12px;
  background: #f8fbff;
  padding: 0;
  cursor: pointer;
}

.captcha-trigger:hover,
.captcha-trigger:focus-visible {
  border-color: #9ab8ef;
}

.verification-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 11px;
}

.sms-code-button {
  min-width: 128px;
  height: 42px;
  border-radius: 12px;
  border-color: #d9e3f1;
  color: #059669;
  background: #f0fdf4;
  font-size: 13px;
}

.sms-code-button:hover,
.sms-code-button:focus-visible {
  border-color: #6ee7b7;
  background: #dcfce7;
  color: #047857;
}

.login-button {
  display: inline-flex;
  width: 100%;
  height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  box-shadow: 0 12px 24px rgba(16, 185, 129, 0.24);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 4px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1.5px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.35);
}

.login-button:active:not(:disabled) {
  transform: translateY(0.5px);
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.2);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.other-login-methods {
  margin-top: 18px;
}

.other-login-methods__divider {
  display: flex;
  align-items: center;
  color: #92a0b3;
  font-size: 12px;
  gap: 10px;
}

.other-login-methods__divider::before,
.other-login-methods__divider::after {
  content: '';
  height: 1px;
  flex: 1;
  background: #dce5f1;
}

.other-login-methods__entry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid #d1ebd8;
  background: #f4faf6;
  color: #0b663e;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s, color 0.2s;
}

.other-login-methods__entry:hover,
.other-login-methods__entry:focus-visible {
  border-color: #34d399;
  background: #ecfdf5;
  color: #047857;
}

.other-login-methods__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0d8c56;
  transition: color 0.2s;
}

.other-login-methods__entry:hover .other-login-methods__icon {
  color: #047857;
}

.other-login-methods__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 1100px) {
  .login-shell {
    display: block;
  }

  .login-background__content {
    min-height: auto;
    padding: 28px 24px 320px;
    justify-content: flex-start;
  }

  .login-panel {
    position: relative;
    z-index: 2;
    width: 100%;
    justify-content: center;
    padding: 0 18px 18px;
    margin-top: -272px;
    pointer-events: none;
  }

  .login-card {
    width: 100%;
    max-height: none;
  }
}

@media (max-width: 640px) {
  .login-shell {
    min-height: auto;
  }

  .login-background__content {
    padding: 20px 16px 240px;
    gap: 24px;
  }

  .brand-mark {
    flex-direction: column;
    align-items: flex-start;
  }

  .brand-mark__title {
    font-size: 28px;
  }

  .login-aside__description {
    font-size: 15px;
  }

  .login-note {
    max-width: none;
    padding-left: 12px;
  }

  .login-panel {
    padding: 0 14px 14px;
    margin-top: -206px;
  }

  .login-card {
    border-radius: 24px;
    padding: 24px 18px;
  }

  .login-card__title {
    font-size: 24px;
  }

  .mode-switch {
    grid-template-columns: 1fr;
  }

  .code-box,
  .code-box--sms {
    flex-direction: column;
    align-items: stretch;
  }

  .captcha-trigger,
  .sms-code-button {
    width: 100%;
    min-width: 0;
  }

  .form-stage {
    min-height: auto;
  }
}
</style>
