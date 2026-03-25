const mongoose = require('mongoose');
const roleModel = require('./schemas/roles');

async function main() {
    await mongoose.connect('mongodb://localhost:27017/NNPTUD-S3');
    try {
        await roleModel.create({ name: 'user', description: 'User role' });
        console.log('✅ Đã tạo role "user"');
    } catch (e) {
        if (e.code === 11000) console.log('⚠️ Role "user" đã tồn tại');
        else console.log(e);
    }
    
    try {
        await roleModel.create({ name: 'admin', description: 'Admin role' });
        console.log('✅ Đã tạo role "admin"');
    } catch (e) {
        if (e.code === 11000) console.log('⚠️ Role "admin" đã tồn tại');
        else console.log(e);
    }
    
    await mongoose.disconnect();
}

main().catch(console.error);
