# 用户头像目录

此目录用于存储系统用户头像图片。

## 目录结构
- `default/` - 默认头像
- `male/` - 男性用户头像
- `female/` - 女性用户头像
- `custom/` - 用户自定义头像

## 访问方式
头像可以通过以下URL直接访问：
- `http://localhost:3000/avatars/default/avatar1.jpg`
- `http://localhost:3000/avatars/male/user1.jpg`
- `http://localhost:3000/avatars/female/user2.jpg`

## 图片规范
- 格式：JPG、PNG、WebP
- 尺寸：建议200x200像素
- 大小：不超过2MB
- 命名：使用英文和数字，避免特殊字符