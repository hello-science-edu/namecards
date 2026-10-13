/**
 * Hello Science Edu – QR Code Generator Script (Node.js)
 * 
 * Tạo mã QR vĩnh viễn (Static QR Code) chất lượng cao cho Danh thiếp điện tử.
 * 
 * Cách dùng:
 *   1. Chạy cơ bản (tạo file ảnh PNG):
 *      node generate-qr.js "<URL>" [đường_dẫn_file_ảnh.png]
 *      Ví dụ:
 *      node generate-qr.js "https://www.linkedin.com/in/kien-dao-693017136/" kenny/qr.png
 * 
 *   2. Chạy nâng cao (vừa tạo ảnh vừa tự động cập nhật vào file index.html):
 *      node generate-qr.js "<URL>" [đường_dẫn_file_ảnh.png] [đường_dẫn_index.html]
 *      Ví dụ:
 *      node generate-qr.js "https://www.linkedin.com/in/ngoc-tran-866492426/" ruby/qr.png ruby/index.html
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function main() {
  const args = process.argv.slice(2);
  let url = args[0];
  let outputPath = args[1];
  let htmlPath = args[2];

  if (!url) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const ask = (q) => new Promise(resolve => rl.question(q, resolve));

    console.log('\n=========================================');
    console.log('   HELLO SCIENCE EDU – QR GENERATOR');
    console.log('=========================================\n');

    url = await ask('1. Nhập đường link (VD: https://www.linkedin.com/in/...): ');
    if (!url || !url.trim()) {
      console.log('Chưa nhập URL. Đã hủy.');
      rl.close();
      return;
    }
    url = url.trim();

    outputPath = await ask('2. Tên/đường dẫn lưu ảnh QR (mặc định: qr.png): ');
    outputPath = outputPath && outputPath.trim() ? outputPath.trim() : 'qr.png';

    htmlPath = await ask('3. Đường dẫn file HTML cần cập nhật base64 (bỏ trống nếu không cần): ');
    htmlPath = htmlPath && htmlPath.trim() ? htmlPath.trim() : null;

    rl.close();
  }

  console.log(`\nĐang tạo mã QR cho: ${url}`);

  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=1&format=png&data=${encodeURIComponent(url)}`;

  https.get(apiUrl, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Lỗi từ máy chủ tạo QR: HTTP ${res.statusCode}`);
      return;
    }

    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
      const qrBuffer = Buffer.concat(chunks);
      console.log(`✔ Đã tạo thành công ảnh QR (${qrBuffer.length} bytes, độ phân giải 1000x1000px).`);

      // 1. Lưu file ảnh PNG
      if (!outputPath) {
        outputPath = 'qr.png';
      }
      const resolvedOutputPath = path.resolve(process.cwd(), outputPath);
      const outputDir = path.dirname(resolvedOutputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(resolvedOutputPath, qrBuffer);
      console.log(`✔ Đã lưu file ảnh tại: ${resolvedOutputPath}`);

      // 2. Chuyển đổi sang base64 data URI
      const base64Data = 'data:image/png;base64,' + qrBuffer.toString('base64');

      // 3. Nếu có file HTML, tự động cập nhật thẻ <img class="qr" src="...">
      if (htmlPath) {
        const resolvedHtmlPath = path.resolve(process.cwd(), htmlPath);
        if (fs.existsSync(resolvedHtmlPath)) {
          const content = fs.readFileSync(resolvedHtmlPath, 'utf8');
          const lines = content.split('\n');
          let replacedCount = 0;

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('<img class="qr"') && lines[i + 1] && lines[i + 1].includes('src="data:image/png;base64,')) {
              lines[i + 1] = `      src="${base64Data}"`;
              replacedCount++;
            } else if (lines[i].includes('<img class="qr" src="data:image/png;base64,')) {
              lines[i] = lines[i].replace(/src="data:image\/png;base64,[^"]+"/, `src="${base64Data}"`);
              replacedCount++;
            }
          }

          if (replacedCount > 0) {
            fs.writeFileSync(resolvedHtmlPath, lines.join('\n'), 'utf8');
            console.log(`✔ Đã tự động cập nhật ${replacedCount} vị trí QR code trong: ${resolvedHtmlPath}`);
          } else {
            console.log(`⚠ Không tìm thấy thẻ <img class="qr"> trong ${resolvedHtmlPath} để thay thế.`);
          }
        } else {
          console.warn(`⚠ Không tìm thấy file HTML tại: ${resolvedHtmlPath}`);
        }
      }

      console.log('\nChuỗi Base64 Data URI (nếu cần copy thủ công):');
      console.log(`${base64Data.slice(0, 100)}... (${base64Data.length} ký tự)\n`);
      console.log('Hoàn tất! Mã QR này là mã tĩnh, vĩnh viễn không bao giờ hết hạn.');
    });
  }).on('error', (err) => {
    console.error('Lỗi khi tải mã QR:', err.message);
  });
}

main();
