-- FreeBackend 数据库初始化脚本
-- 创建数据库表结构和初始数据

USE freebackend;

-- 创建用户表（如果使用Sequelize同步，此表会自动创建）
-- 这里提供SQL脚本作为备份和手动部署使用

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `email` varchar(100) NOT NULL COMMENT '邮箱地址',
  `password` varchar(255) NOT NULL COMMENT '加密后的密码',
  `role` enum('user','admin') DEFAULT 'user' COMMENT '用户角色',
  `status` enum('active','inactive','banned') DEFAULT 'active' COMMENT '用户状态',
  `lastLoginAt` datetime DEFAULT NULL COMMENT '最后登录时间',
  `loginCount` int(11) DEFAULT '0' COMMENT '登录次数',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_role` (`role`),
  KEY `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建默认管理员用户（密码：admin123）
INSERT IGNORE INTO `users` (`username`, `email`, `password`, `role`, `status`) VALUES
('admin', 'admin@freebackend.com', '$2a$12$LQv3c1yqBWVHrnG6Y1n8e.F6L9L7L8L9L0L1L2L3L4L5L6L7L8L9L0L1', 'admin', 'active');

-- 创建操作日志表（可选）
CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL COMMENT '用户ID',
  `action` varchar(100) NOT NULL COMMENT '操作类型',
  `resource` varchar(100) DEFAULT NULL COMMENT '操作资源',
  `details` text COMMENT '操作详情',
  `ipAddress` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `userAgent` text COMMENT '用户代理',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_action` (`action`),
  KEY `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 创建文件记录表（可选）
CREATE TABLE IF NOT EXISTS `file_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL COMMENT '用户ID',
  `filename` varchar(255) NOT NULL COMMENT '文件名',
  `originalName` varchar(255) NOT NULL COMMENT '原始文件名',
  `filePath` varchar(500) NOT NULL COMMENT '文件路径',
  `fileSize` bigint(20) NOT NULL COMMENT '文件大小',
  `mimeType` varchar(100) DEFAULT NULL COMMENT 'MIME类型',
  `uploadedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` datetime DEFAULT NULL COMMENT '过期时间',
  `status` enum('active','deleted') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_uploadedAt` (`uploadedAt`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件记录表';

SET FOREIGN_KEY_CHECKS = 1;

-- 创建存储过程示例（可选）
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `GetUserStatistics`()
BEGIN
    SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as activeUsers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as adminUsers,
        MAX(createdAt) as lastUserCreated
    FROM users;
END //
DELIMITER ;

-- 创建视图示例（可选）
CREATE OR REPLACE VIEW `user_summary_view` AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.status,
    u.lastLoginAt,
    u.loginCount,
    u.createdAt,
    COUNT(DISTINCT fl.id) as fileCount
FROM users u
LEFT JOIN file_records fl ON u.id = fl.userId AND fl.status = 'active'
GROUP BY u.id;