const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    secure: false,
    auth: {
        user: "YOUR_MAILTRAP_USER",   // <-- Thay bằng user Mailtrap của bạn
        pass: "YOUR_MAILTRAP_PASS",   // <-- Thay bằng pass Mailtrap của bạn
    },
});

module.exports = {
    sendMail: async (to, url) => {
        const info = await transporter.sendMail({
            from: 'Admin@hahah.com',
            to: to,
            subject: "request resetpassword email",
            text: "click vao day de reset",
            html: "click vao <a href=" + url + ">day</a> de reset",
        });
        console.log("Message sent:", info.messageId);
    },

    sendPasswordMail: async (to, username, password) => {
        const info = await transporter.sendMail({
            from: '"Admin System" <admin@system.com>',
            to: to,
            subject: "Tài khoản của bạn đã được tạo",
            text: `Xin chào ${username},\n\nTài khoản của bạn đã được tạo thành công.\nMật khẩu: ${password}\n\nVui lòng đổi mật khẩu sau khi đăng nhập.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
                        <h2 style="color: white; margin: 0;">Chào mừng bạn!</h2>
                    </div>
                    <div style="padding: 24px;">
                        <p>Xin chào <strong>${username}</strong>,</p>
                        <p>Tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập:</p>
                        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background:#f9f9f9; width:40%;"><strong>Username</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${username}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background:#f9f9f9;"><strong>Email</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${to}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background:#f9f9f9;"><strong>Mật khẩu</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd; color: #e53935; font-weight: bold; letter-spacing: 1px;">${password}</td>
                            </tr>
                        </table>
                        <p style="color: #e53935;">⚠️ Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu.</p>
                    </div>
                    <div style="background:#f5f5f5; padding: 12px; text-align: center; font-size: 12px; color: #888;">
                        Email này được gửi tự động, vui lòng không reply.
                    </div>
                </div>
            `,
        });
        console.log(`[Mail] Sent to ${to} | MessageId: ${info.messageId}`);
    }
};