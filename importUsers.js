/**
 * importUsers.js
 * -------------------------------------------------------
 * Hướng dẫn chạy:
 *   node importUsers.js
 *
 * Chức năng:
 *   - Đọc file users_import.csv (cột: username, email)
 *   - Tạo password ngẫu nhiên 16 ký tự cho mỗi user
 *   - Gán role "user" (tìm trong DB theo tên)
 *   - Tạo User trong MongoDB
 *   - Gửi email chứa password về địa chỉ email của user qua Mailtrap
 * -------------------------------------------------------
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Schemas
const userModel = require('./schemas/users');
const roleModel = require('./schemas/roles');

// Mail handler
const { sendPasswordMail } = require('./utils/mailHandler');

// ── Cấu hình ──────────────────────────────────────────
const MONGO_URI = 'mongodb://localhost:27017/NNPTUD-S3';
const CSV_FILE  = path.join(__dirname, 'users_import.csv');
const ROLE_NAME = 'user'; // tên role cần gán
// ──────────────────────────────────────────────────────

/**
 * Tạo chuỗi password ngẫu nhiên 16 ký tự (chữ + số + ký tự đặc biệt an toàn)
 */
function generatePassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
    let password = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        password += charset[bytes[i] % charset.length];
    }
    return password;
}

/**
 * Parse CSV đơn giản (header: username,email)
 */
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
    const [header, ...rows] = lines;
    const headers = header.split(',').map(h => h.trim());

    return rows.map(row => {
        const values = row.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i]; });
        return obj;
    });
}

// ── Main ───────────────────────────────────────────────
async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối MongoDB:', MONGO_URI);

    // Tìm role "user"
    const role = await roleModel.findOne({ name: ROLE_NAME, isDeleted: false });
    if (!role) {
        console.error(`❌ Không tìm thấy role "${ROLE_NAME}" trong database. Hãy tạo role trước.`);
        process.exit(1);
    }
    console.log(`✅ Tìm thấy role "${ROLE_NAME}" (id: ${role._id})`);

    const users = parseCSV(CSV_FILE);
    console.log(`📄 Đọc được ${users.length} user từ file CSV.\n`);

    const results = [];

    for (const { username, email } of users) {
        if (!username || !email) {
            console.warn(`⚠️  Bỏ qua dòng không hợp lệ: username="${username}" email="${email}"`);
            continue;
        }

        // Kiểm tra đã tồn tại chưa
        const existed = await userModel.findOne({
            $or: [{ username }, { email }],
            isDeleted: false
        });
        if (existed) {
            console.warn(`⚠️  Đã tồn tại: username="${username}" hoặc email="${email}" → Bỏ qua`);
            results.push({ username, email, status: 'skipped (existed)' });
            continue;
        }

        // Tạo password ngẫu nhiên
        const plainPassword = generatePassword(16);

        try {
            // Tạo user (password sẽ được hash tự động bởi pre('save') trong schema)
            const newUser = new userModel({
                username,
                email,
                password: plainPassword,
                role: role._id,
                status: true,
            });
            await newUser.save();
            console.log(`✅ Tạo user: ${username} <${email}>`);

            // Gửi email
            await sendPasswordMail(email, username, plainPassword);
            console.log(`📧 Đã gửi email đến: ${email}\n`);

            results.push({ username, email, password: plainPassword, status: 'created & mailed' });
        } catch (err) {
            console.error(`❌ Lỗi khi xử lý ${username}: ${err.message}`);
            results.push({ username, email, status: `error: ${err.message}` });
        }
    }

    // In tổng kết
    console.log('\n─────────── KẾT QUẢ ───────────');
    console.table(results.map(r => ({
        username: r.username,
        email: r.email,
        status: r.status
    })));

    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB.');
}

main().catch(err => {
    console.error('❌ Lỗi không mong muốn:', err);
    process.exit(1);
});
