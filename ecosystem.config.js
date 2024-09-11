module.exports = {
    apps: [
        {
            name: "Messenger-BackEnd",
            script: "./bin/www.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                NODE_ENV: "development",
                PORT: 5000
            },
            env_production: {
                NODE_ENV: "production",
                PORT: 5000
            }
        }
    ]
};
