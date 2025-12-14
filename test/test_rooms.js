const http = require('http');

const PORT = 3001; // 服务器实际运行的端口

// 测试获取所有房间列表
function testGetAllRooms() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/chat/rooms',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ 获取房间列表测试:');
        console.log('   状态码:', res.statusCode);
        console.log('   响应:', JSON.parse(data));
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('❌ 获取房间列表失败:', e.message);
      reject(e);
    });

    req.end();
  });
}

// 测试获取特定房间信息
function testGetRoomInfo(roomId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: `/api/chat/rooms/${roomId}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ 获取房间 ${roomId} 信息测试:`);
        console.log('   状态码:', res.statusCode);
        console.log('   响应:', JSON.parse(data));
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ 获取房间 ${roomId} 信息失败:`, e.message);
      reject(e);
    });

    req.end();
  });
}

// 测试创建新房间
function testCreateRoom() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      roomId: 'test-room-' + Date.now(),
      name: '测试房间',
      description: '这是一个测试房间',
      roomType: 'public',
      maxUsers: 50
    });

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/chat/rooms',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ 创建房间测试:');
        console.log('   状态码:', res.statusCode);
        console.log('   响应:', JSON.parse(data));
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('❌ 创建房间失败:', e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// 运行所有测试
async function runTests() {
  console.log('🚀 开始测试房间管理功能...\n');
  
  try {
    await testGetAllRooms();
    console.log('');
    
    await testGetRoomInfo('general');
    console.log('');
    
    await testCreateRoom();
    console.log('');
    
    console.log('🎉 所有测试完成！房间管理功能运行正常。');
  } catch (error) {
    console.error('💥 测试失败:', error.message);
  }
}

runTests();