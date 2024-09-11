module.exports = {
    apps: [
        {
            name: "Messenger-BackEnd", // نام اپلیکیشن شما
            script: "./bin/www.js",  // مسیر فایل اصلی برنامه Node.js
            instances: "max",    // اجرا در حالت Cluster با حداکثر تعداد CPU
            exec_mode: "cluster", // حالت اجرای Cluster
            env: {
                NODE_ENV: "development", // تنظیمات محیطی برای توسعه
                PORT: 5000
            },
            env_production: {
                NODE_ENV: "production", // تنظیمات محیطی برای تولید
                PORT: 5000
            }
        }
    ]
};
