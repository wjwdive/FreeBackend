# 用户头像API使用说明

## 概述

本系统提供了完整的用户头像管理功能，包括静态头像文件服务和API接口。头像文件存储在 `public/avatars/` 目录下，可以通过HTTP直接访问，无需身份验证。

## 目录结构

```
public/avatars/
├── default/           # 默认头像
│   ├── avatar1.jpg    # 默认头像1
│   ├── avatar2.jpg    # 默认头像2
│   └── README.md      # 说明文档
├── male/              # 男性头像
│   └── user1.jpg      # 男性用户头像1
├── female/            # 女性头像
│   └── user1.jpg      # 女性用户头像1
├── custom/            # 自定义头像
│   └── custom1.jpg    # 自定义头像1
└── README.md          # 主说明文档
```

## 静态文件访问

头像文件可以通过以下URL直接访问：

```
# 默认头像
http://localhost:3001/avatars/default/avatar1.jpg
http://localhost:3001/avatars/default/avatar2.jpg
# 可以从 aratar001.png 取到aratar039.png
http://localhost:3001/avatars/avatar001.png

# 男性头像
http://localhost:3000/avatars/male/user1.jpg

# 女性头像
http://localhost:3000/avatars/female/user1.jpg

# 自定义头像
http://localhost:3000/avatars/custom/custom1.jpg
```

## API接口

### 1. 获取所有可用头像列表

**GET** `/api/avatars`

获取系统中所有可用的头像文件列表，按分类组织。

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "头像列表获取成功",
  "data": {
    "default": [
      {
        "filename": "avatar1.jpg",
        "url": "/avatars/default/avatar1.jpg",
        "category": "default"
      },
      {
        "filename": "avatar2.jpg",
        "url": "/avatars/default/avatar2.jpg",
        "category": "default"
      }
    ],
    "male": [
      {
        "filename": "user1.jpg",
        "url": "/avatars/male/user1.jpg",
        "category": "male"
      }
    ],
    "female": [
      {
        "filename": "user1.jpg",
        "url": "/avatars/female/user1.jpg",
        "category": "female"
      }
    ],
    "custom": [
      {
        "filename": "custom1.jpg",
        "url": "/avatars/custom/custom1.jpg",
        "category": "custom"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 获取随机默认头像

**GET** `/api/avatars/random`

随机返回一个默认头像的URL。

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "随机头像获取成功",
  "data": {
    "avatarUrl": "/avatars/default/avatar1.jpg",
    "fullUrl": "http://localhost:3000/avatars/default/avatar1.jpg"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. 根据性别获取随机头像

**GET** `/api/avatars/random/{gender}`

根据性别返回随机头像URL。

**参数：**
- `gender` (路径参数): `male` 或 `female`

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "male性别随机头像获取成功",
  "data": {
    "avatarUrl": "/avatars/male/user1.jpg",
    "fullUrl": "http://localhost:3000/avatars/male/user1.jpg",
    "gender": "male"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. 检查头像是否存在

**GET** `/api/avatars/check?avatarUrl={url}`

检查指定的头像文件是否存在。

**参数：**
- `avatarUrl` (查询参数): 头像URL路径

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "头像文件存在",
  "data": {
    "exists": true,
    "avatarUrl": "/avatars/default/avatar1.jpg",
    "info": {
      "filename": "avatar1.jpg",
      "path": "j:\\Projects25\\Express\\FreeBackend\\public\\avatars\\default\\avatar1.jpg",
      "size": 1024,
      "modified": "2024-01-01T00:00:00.000Z",
      "url": "/avatars/default/avatar1.jpg"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5. 获取头像文件信息

**GET** `/api/avatars/info?avatarUrl={url}`

获取指定头像文件的详细信息。

**参数：**
- `avatarUrl` (查询参数): 头像URL路径

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "头像文件信息获取成功",
  "data": {
    "filename": "avatar1.jpg",
    "path": "j:\\Projects25\\Express\\FreeBackend\\public\\avatars\\default\\avatar1.jpg",
    "size": 1024,
    "modified": "2024-01-01T00:00:00.000Z",
    "url": "/avatars/default/avatar1.jpg"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 使用示例

### 前端使用示例

```javascript
// 获取随机默认头像
async function getRandomAvatar() {
  try {
    const response = await fetch('/api/avatars/random');
    const result = await response.json();
    if (result.statusCode === 200) {
      return result.data.avatarUrl;
    }
  } catch (error) {
    console.error('获取随机头像失败:', error);
  }
  return '/avatars/default/avatar1.jpg'; // 默认回退
}

// 根据用户性别获取头像
async function getUserAvatar(gender) {
  try {
    const response = await fetch(`/api/avatars/random/${gender}`);
    const result = await response.json();
    if (result.statusCode === 200) {
      return result.data.avatarUrl;
    }
  } catch (error) {
    console.error('获取用户头像失败:', error);
  }
  return await getRandomAvatar(); // 回退到随机默认头像
}

// 直接使用头像URL
const avatarUrl = '/avatars/default/avatar1.jpg';
const imgElement = document.createElement('img');
imgElement.src = avatarUrl;
imgElement.alt = '用户头像';
```

### 后端使用示例

```javascript
const avatarService = require('./services/avatarService');

// 为用户分配随机头像
async function assignRandomAvatar(user) {
  try {
    const avatarUrl = await avatarService.getRandomDefaultAvatar();
    user.avatar = avatarUrl;
    await user.save();
  } catch (error) {
    console.error('分配头像失败:', error);
    user.avatar = '/avatars/default/avatar1.jpg'; // 默认头像
  }
}

// 根据性别分配头像
async function assignAvatarByGender(user) {
  try {
    const avatarUrl = await avatarService.getRandomAvatarByGender(user.gender);
    user.avatar = avatarUrl;
    await user.save();
  } catch (error) {
    console.error('分配性别头像失败:', error);
    await assignRandomAvatar(user); // 回退到随机头像
  }
}
```

## 图片规范

- **格式**: JPG, JPEG, PNG, WebP, GIF
- **尺寸**: 建议 128x128 到 512x512 像素
- **大小**: 单个文件不超过 2MB
- **命名**: 使用英文小写字母、数字和下划线

## 扩展建议

1. **添加更多头像**: 在相应目录下添加更多头像文件
2. **头像上传**: 实现用户自定义头像上传功能
3. **头像裁剪**: 添加头像自动裁剪和缩放功能
4. **CDN支持**: 集成CDN服务提高头像加载速度
5. **缓存策略**: 实现头像文件的缓存机制

## 注意事项

- 头像文件通过静态文件服务直接访问，无需身份验证
- 建议在生产环境中配置适当的缓存策略
- 定期清理未使用的头像文件以节省存储空间
- 确保头像文件符合版权和内容规范