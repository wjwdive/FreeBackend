const avatarService = require('../services/avatarService');
const { asyncHandler } = require('../middleware/errorHandler');

class AvatarController {
  /**
   * 获取所有可用头像列表
   * GET /api/avatars
   */
  getAvatars = asyncHandler(async (req, res) => {
    const result = await avatarService.getAvailableAvatars();
    
    res.status(result.statusCode).json(result);
  });

  /**
   * 获取随机默认头像
   * GET /api/avatars/random
   */
  getRandomAvatar = asyncHandler(async (req, res) => {
    const avatarUrl = await avatarService.getRandomDefaultAvatar();
    
    res.status(200).json({
      statusCode: 200,
      message: '随机头像获取成功',
      data: {
        avatarUrl: avatarUrl,
        fullUrl: `${req.protocol}://${req.get('host')}${avatarUrl}`
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 根据性别获取随机头像
   * GET /api/avatars/random/:gender
   */
  getRandomAvatarByGender = asyncHandler(async (req, res) => {
    const { gender } = req.params;
    
    // 验证性别参数
    const validGenders = ['male', 'female'];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({
        statusCode: 400,
        message: '无效的性别参数，请使用 male 或 female',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const avatarUrl = await avatarService.getRandomAvatarByGender(gender);
    
    res.status(200).json({
      statusCode: 200,
      message: `${gender}性别随机头像获取成功`,
      data: {
        avatarUrl: avatarUrl,
        fullUrl: `${req.protocol}://${req.get('host')}${avatarUrl}`,
        gender: gender
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 检查头像是否存在
   * GET /api/avatars/check
   */
  checkAvatarExists = asyncHandler(async (req, res) => {
    const { avatarUrl } = req.query;
    
    if (!avatarUrl) {
      return res.status(400).json({
        statusCode: 400,
        message: '缺少头像URL参数',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const exists = avatarService.checkAvatarExists(avatarUrl);
    const avatarInfo = exists ? avatarService.getAvatarInfo(avatarUrl) : null;
    
    res.status(200).json({
      statusCode: 200,
      message: exists ? '头像文件存在' : '头像文件不存在',
      data: {
        exists: exists,
        avatarUrl: avatarUrl,
        info: avatarInfo
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 获取头像文件信息
   * GET /api/avatars/info
   */
  getAvatarInfo = asyncHandler(async (req, res) => {
    const { avatarUrl } = req.query;
    
    if (!avatarUrl) {
      return res.status(400).json({
        statusCode: 400,
        message: '缺少头像URL参数',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const avatarInfo = avatarService.getAvatarInfo(avatarUrl);
    
    if (!avatarInfo) {
      return res.status(404).json({
        statusCode: 404,
        message: '头像文件不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: '头像文件信息获取成功',
      data: avatarInfo,
      timestamp: new Date().toISOString()
    });
  });
}

const avatarController = new AvatarController();

module.exports = {
  getAvatars: avatarController.getAvatars,
  getRandomAvatar: avatarController.getRandomAvatar,
  getRandomAvatarByGender: avatarController.getRandomAvatarByGender,
  checkAvatarExists: avatarController.checkAvatarExists,
  getAvatarInfo: avatarController.getAvatarInfo
};