# nano-banana-2 使用指南 🎨

**nano-banana-2** 是一个强大的 AI 图像生成工具，已为饭否项目配置。可以轻松生成高质量的活动封面、头像、社交图片等。

## ⚠️ 重要提示

**生成图片时请遵循以下原则：**
- ✅ **尽量少的文字** - 避免过多的英文或中文文本
- ✅ **使用中文汉字** - 如果必须加文字，使用中文而非英文
- ✅ **多样性人物** - 优先展示少数民族和中国时尚年轻人
- ✅ **现代审美** - 体现年轻、潮、多元的气质
- ✅ **强调视觉设计** - 重点放在色彩、构图、氛围上
- ✅ **保持简洁** - 最多1-3个汉字，位置靠边

## ✨ 快速开始

```bash
# 基础用法 - 生成 1K 分辨率图片
nano-banana "你的图片描述"

# 带输出名称
nano-banana "社交活动海报设计" -o my-poster

# 高分辨率（4K）
nano-banana "高清活动封面" -s 4K

# 宽屏比例（16:9）
nano-banana "活动横幅设计" -a 16:9
```

## 📸 为饭否生成的示例

### 1. 活动封面（推荐）
```bash
# ✅ 好的提示词 - 简洁、无文字、强调视觉
nano-banana "Modern social event photograph, gradient from pink #FF2D55 to orange #FF6B35, young people laughing and connecting, warm candlelit atmosphere, no text, minimal Chinese characters" -o event-cover -s 1K -a 16:9

# ❌ 避免这样做
# nano-banana "Social gathering event with big title and descriptions" 
```

### 2. 用户头像
```bash
# ✅ 好的提示词 - 纯视觉，无文字
nano-banana "Minimalist avatar portrait, modern flat design, warm color palette pink orange, friendly expression, no text, no characters" -o avatar -s 512 -a 1:1
```

### 3. 品牌视觉资产
```bash
# ✅ 好的提示词 - 只有Logo，最少汉字
nano-banana "Abstract modern logo design, gradient pink to orange, geometric shapes, no text, clean minimalist style" -o brand-logo -s 512 -a 1:1

# 如果需要品牌字
nano-banana "Modern social app branding visual, gradient pink #FF2D55 to orange #FF6B35, abstract shapes, small Chinese text '饭否' in corner, minimal characters" -o brand-visual -s 1K -a 16:9
```

### 4. Dashboard 装饰图
```bash
# ✅ 好的提示词 - 纯装饰，无文字
nano-banana "Abstract colorful gradient background, pink orange palette, flowing shapes, modern aesthetic, no text, no characters" -o dashboard-bg -s 1K -a 16:9
```

### 5. 透明背景元素
```bash
# ✅ 好的提示词 - 清晰主体，无背景文字
nano-banana "Cute friendly mascot character sitting position, modern style, colorful, cheerful expression, no text" -t -o mascot
```

## 🎨 饭否定制提示词模板（优化版）

### 活动海报（最推荐）
```
Modern social event scene, gradient pink #FF2D55 to orange #FF6B35, 
diverse young Chinese people with stylish fashion, minorities included, 
laughing and connecting in trendy setting, warm inviting atmosphere, 
NO TEXT, NO CHARACTERS, professional photography, high quality
```

### 活动卡片背景（带最少文字，多元人物）
```
Vibrant social event background, warm pink orange gradient aesthetic,
diverse young people with fashionable style, inclusive representation,
abstract design with human silhouettes, minimal and clean,
small Chinese text "活动" in corner if needed, mostly visual focus
```

### 品牌视觉
```
Minimalist social networking brand identity, color palette pink orange,
diverse youth culture inspiration, modern geometric shapes, 
contemporary fashion-forward aesthetic, no text, clean premium feel
```

### 头像背景（多样化）
```
Friendly portrait background showcasing diverse young people,
modern flat design, warm colors, stylish fashion sense,
inclusive representation, no text, simple and inviting
```

### 首页 Hero 图（时尚多元）
```
Energetic social gathering scene with diverse young Chinese people,
stylish modern fashion, minorities and different backgrounds represented,
pink orange gradient, happy and connected atmosphere,
warm lighting, NO TEXT, cinematic quality, trendy vibe
```

## 🎯 常用选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `-o, --output` | 输出文件名 | `-o my-image` |
| `-s, --size` | 分辨率：512, 1K, 2K, 4K | `-s 2K` |
| `-a, --aspect` | 宽高比：1:1, 16:9, 9:16 等 | `-a 16:9` |
| `-m, --model` | 模型：flash（快速便宜）, pro（高质量） | `-m pro` |
| `-d, --dir` | 输出目录 | `-d ~/Pictures` |
| `-t, --transparent` | 生成透明背景 | `-t` |
| `-r, --ref` | 参考图片（可用多次） | `-r style.png` |

## 💰 成本追踪

```bash
# 查看消费总结
nano-banana --costs
```

## 📁 生成的图片位置

项目生成的示例图片保存在：
```
generated-images/
├── event-cover-1.jpeg
├── avatar.jpeg
├── brand-logo.png
└── ...
```

## 🚀 集成到项目中

可以将生成的图片用于：
- 📅 活动列表封面（1K, 16:9）
- 👤 用户头像背景（512x512, 1:1）
- 🎨 品牌营销素材（2K, 16:9）
- ✨ Dashboard 装饰（1K, 16:9）
- 🌟 应用图标（512x512, 1:1）

## 📋 生成清单

```bash
# 为饭否生成完整的视觉资产（优先多样性和时尚年轻人）
mkdir -p generated-images
cd generated-images

# 活动封面 (16:9) - 多元包容
nano-banana "Modern social event, gradient pink orange, diverse young Chinese people with stylish fashion, minorities included, warm atmosphere, no text, trendy aesthetic" -o event-cover -s 1K -a 16:9 -m flash

# 用户头像背景 (1:1) - 包容性
nano-banana "Minimalist friendly background, diverse young people, modern flat design, warm colors, stylish, no text, inclusive" -o avatar-bg -s 512 -a 1:1 -m flash

# Dashboard 背景 (16:9) - 现代时尚
nano-banana "Abstract gradient background pink orange, inspired by youth fashion trends, modern geometric shapes, contemporary aesthetic, no text" -o dashboard-bg -s 1K -a 16:9 -m flash

# 品牌Logo (1:1) - 多元主题
nano-banana "Abstract modern logo inspired by diverse youth culture, gradient pink to orange, geometric shapes, minimal style, no text, contemporary" -o logo -s 512 -a 1:1 -m flash

# Hero 图 (16:9, 高质量) - 时尚多元
nano-banana "Energetic social scene, diverse young Chinese people with trendy fashion, minorities represented, pink orange aesthetic, warm lighting, happy connecting, no text, cinematic quality" -o hero -s 2K -a 16:9 -m pro

# 额外：透明背景年轻人角色 - 现代风格
nano-banana "Stylish young person character, diverse ethnicity, modern fashion sense, cheerful friendly expression, contemporary design, no text" -t -o character -s 512 -a 1:1 -m pro
```

## 📚 更多资源

- [nano-banana-2 完整文档](https://github.com/kingbootoshi/nano-banana-2-skill)
- [Google Gemini 模型信息](https://ai.google.dev/)

---

**提示**: 
- 使用 `nano-banana "你的描述" --api-key YOUR_KEY` 可以临时使用其他 API 密钥
- 优先使用 `-m flash`（快速便宜），特殊场景用 `-m pro`（高质量）
- 生成透明背景图片需要 FFmpeg 和 ImageMagick（已安装）

