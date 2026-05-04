# 饭否前端视觉资产 — AI 生成图片库

## 📸 生成的高质量图片

### 1. 登录页英雄图 (`/public/login-hero.jpg`)
- **分辨率**: 2K (2048×1152)
- **用途**: 登录页面左侧品牌区背景
- **特点**: 
  - 展现多样化年轻中国人在社交聚餐中的真实互动
  - 温暖的烛光氛围，强调真实连接
  - 时尚现代的视觉风格
  - 无文字，纯视觉设计
- **集成**: `app/(auth)/login/page.tsx` - 已更新为背景图

### 2. 仪表板背景图 (`/public/dashboard-bg.jpg`)
- **分辨率**: 2K (2048×1152)
- **用途**: 首页 Hero Banner 背景
- **特点**:
  - 展现屋顶酒吧社交场景
  - 多样化的年轻人和少数民族
  - 日落黄金时段的温暖光线
  - 强调社交和连接的主题
- **集成**: `app/(main)/dashboard/page.tsx` - 已更新为背景图

### 3. 活动卡片示例图片

#### 3.1 社交聚餐 (`/public/dinner-event.jpg`)
- **分辨率**: 1K (1024×576)
- **用途**: 活动卡片示例、事件列表
- **特点**: 温暖烛光下的真实对话场景

#### 3.2 晨间跑步 (`/public/running-event.jpg`)
- **分辨率**: 1K (1024×576)
- **用途**: 运动/健身活动卡片
- **特点**: 充满活力的晨间运动场景

#### 3.3 艺术文化 (`/public/art-event.jpg`)
- **分辨率**: 1K (1024×576)
- **用途**: 文化/艺术活动卡片
- **特点**: 现代艺术馆中的文化交流

#### 3.4 屋顶酒吧 (`/public/drinks-event.jpg`)
- **分辨率**: 1K (1024×576)
- **用途**: 社交/饮品活动卡片
- **特点**: 日落时分的社交聚集

## 🎨 设计特点

所有图片遵循以下原则：

✅ **最小化文字** - 无文字或极少中文字符
✅ **多样化代表** - 展现少数民族和中国时尚年轻人
✅ **现代审美** - 符合小红书风格的玫红-橙粉色调
✅ **视觉优先** - 强调色彩、构图、氛围而非文字
✅ **真实连接** - 展现真实的社交互动和情感

## 📍 集成位置

| 页面 | 图片 | 状态 |
|------|------|------|
| 登录页 (`/login`) | login-hero.jpg | ✅ 已集成 |
| 仪表板 (`/dashboard`) | dashboard-bg.jpg | ✅ 已集成 |
| 图片库 (`/gallery`) | 所有图片 | ✅ 已创建 |
| 活动卡片 | dinner-event.jpg 等 | 📋 可选集成 |

## 🚀 后续优化建议

1. **事件卡片集成** - 为不同活动类型的卡片设置默认图片
2. **用户头像背景** - 生成透明背景的头像背景图
3. **品牌资产** - 生成 Logo、Icon 等品牌元素
4. **季节性图片** - 根据季节生成不同主题的活动图片
5. **A/B 测试** - 测试不同风格的图片对用户转化的影响

## 💰 成本统计

| 图片 | 模型 | 成本 |
|------|------|------|
| login-hero.jpg | Flash | $0.129 |
| dashboard-bg.jpg | Pro | $0.151 |
| dinner-event.jpg | Pro | $0.152 |
| running-event.jpg | Flash | $0.096 |
| art-event.jpg | Flash | $0.095 |
| drinks-event.jpg | Flash | $0.096 |
| **总计** | - | **$0.719** |

## 📝 提示词模板

所有图片使用以下提示词模板生成：

```
[活动描述] + 多样化年轻中国人和少数民族 + 时尚现代风格 + 
粉橙色调 + NO TEXT + 高质量摄影 + [特定氛围]
```

示例：
```
Energetic social dining scene with diverse young Chinese people 
and minorities, stylish trendy fashion, candlelit warm atmosphere, 
people laughing and connecting genuinely, pink orange gradient 
ambiance, candid lifestyle photography, NO TEXT, premium cinematic quality
```

---

**生成日期**: 2026-05-03
**项目**: 饭否 (Fanfou)
**设计风格**: 小红书美学 + 现代社交
