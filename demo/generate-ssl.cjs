const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 证书目录
const certDir = path.join(__dirname, 'certs');

// 确保证书目录存在
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const keyPath = path.join(certDir, 'server.key');
const certPath = path.join(certDir, 'server.crt');

// 检查证书是否已存在
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('SSL证书已存在，跳过生成。');
  process.exit(0);
}

console.log('正在生成自签名SSL证书...');

try {
  // 使用OpenSSL生成自签名证书
  const opensslCommand = `openssl req -x509 -newkey rsa:2048 -nodes -keyout "${keyPath}" -out "${certPath}" -days 365 -subj "/C=CN/ST=State/L=City/O=Development/OU=Dev/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1,IP:0.0.0.0"`;
  
  execSync(opensslCommand, { stdio: 'inherit' });
  
  console.log('SSL证书生成成功！');
  console.log(`证书文件位置: ${certPath}`);
  console.log(`私钥文件位置: ${keyPath}`);
  console.log('\n注意：这是自签名证书，浏览器会显示安全警告，这是正常现象。');
  console.log('在手机端访问时，请手动接受证书风险。');
  
} catch (error) {
  console.error('生成SSL证书失败:', error.message);
  
  // 如果OpenSSL不可用，尝试使用Node.js内置方法
  console.log('\n尝试使用Node.js内置方法生成证书...');
  
  try {
    const selfsigned = require('selfsigned');
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const options = {
      days: 365,
      keySize: 2048,
      extensions: [
        {
          name: 'subjectAltName',
          altNames: [
            { type: 2, value: 'localhost' },
            { type: 2, value: '127.0.0.1' },
            { type: 7, ip: '127.0.0.1' },
            { type: 7, ip: '0.0.0.0' }
          ]
        }
      ]
    };
    
    const pems = selfsigned.generate(attrs, options);
    
    fs.writeFileSync(certPath, pems.cert);
    fs.writeFileSync(keyPath, pems.private);
    
    console.log('使用Node.js生成SSL证书成功！');
    console.log(`证书文件位置: ${certPath}`);
    console.log(`私钥文件位置: ${keyPath}`);
    
  } catch (nodeError) {
    console.error('使用Node.js生成证书也失败:', nodeError.message);
    console.log('\n请安装OpenSSL或运行: npm install selfsigned');
    process.exit(1);
  }
}