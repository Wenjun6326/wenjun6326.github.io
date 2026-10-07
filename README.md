# 欧阳文钧 · 个人站点

一个参考 [apple.com](https://www.apple.com/) 视觉语言制作的多级页面个人站点。

## 在线访问

👉 **https://wenjun6326.github.io/**

## 页面结构

```
index.html              首页 —— 个人主页（欧阳文钧），首屏有“了解更多”入口通往项目页
projects/index.html     二级页面 —— 三个项目详情（含插画与下载按钮）
profile/index.html      旧路径，自动重定向到首页（避免已分享的链接失效）
styles.css              共享样式
app.js                  共享脚本（交互、动效、下载、页面过渡）
```

页面层级只有两层：

1. **首页 = 个人主页**（`/`）：姓名、Token 主题句「Token 就是这么简单 · 感谢李老师的赞助」、
   「了解更多 ›」按钮 → 进入项目页；往下还有简介、数据、Token 控制中心、爱好、配置、联系方式。
2. **项目页**（`/projects/`）：三个项目的完整介绍与下载。

## 三个项目

| 项目 | 内容 | 下载 |
|---|---|---|
| [WiFiSniffer-BLE-Advertiser-ESP32](https://github.com/Wenjun6326/WiFiSniffer-BLE-Advertiser-ESP32) | ESP32-S3 独立无线测试平台：自带热点的 WiFi 监听 + 设备端协议解码 + BLE 近场配对广播器 | 源码 zip |
| [BarbequesDelight](https://github.com/Wenjun6326/BarbequesDelight) | Barbeque's Delight 从 MC 1.20.1 到 26.1 的 Fabric 移植（非官方） | jar 152 KB |
| [Cultural-Delights-1.21](https://github.com/Wenjun6326/Cultural-Delights-1.21) | Cultural Delights 的 1.21.1 NeoForge 适配 + 26.1 Fabric 分支 | jar 302 KB |

> 两个模组均为**移植 / 适配**，原模组的设计与美术版权属于原作者，页面上都做了明确标注。

## 技术特点

- **零依赖**：纯 HTML / CSS / 原生 JS，无需构建，可离线打开
- **丝滑跳转**：跨文档 View Transitions API（`@view-transition`），导航栏与主标题做形变过渡；不支持时降级为淡出遮罩
- **文字磁吸**：鼠标靠近标题时每个字被推开，阻尼弹簧回弹；静止时严格对齐（无初始偏移）
- **累计数字动效**：从 380,000,000 滚到 400,000,000，随后 `+` 放大到 1.78 倍并浮现蓝色渐变光晕
- **手绘 SVG 插画**：三幅原创插画，带 WiFi 波纹、炉火跳动、蒸汽上升等循环动画
- **按下即下载**：`Content-Disposition: attachment` 直链 + 真实 `<a download>` 点击，并有导航兜底，页面不跳转
- **几何图案**：漂移的网格渐变、浮动几何体视差、无缝跑马灯
- **响应式**：360px ~ 1440px 全区间无横向溢出
- **无障碍**：`prefers-reduced-motion` 全面降级，插画带 `aria-label`，拆分字符保留 `aria-label`

## 本地运行

直接双击 `index.html`，或者：

```bash
python -m http.server 8000
# 访问 http://localhost:8000
```

## 部署

仓库即 GitHub Pages 源：`main` 分支根目录，已含 `.nojekyll`。推送到 `main` 后线上自动更新。

## 声明

纯属个人趣味展示，内容为玩笑性质，无任何实际资源获取行为。项目均由李老师的 Token 额度赞助完成。
