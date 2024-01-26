module.exports = {
  apps: [
    {
      name: '文件读写',
      script: './src/listener.js',
      instances: 1,
    },
    {
      name: '离线计算',
      script: './src/calculater.js',
      instances: 2,
    },
    {
      name: '答案消费',
      script: './src/sender.js',
      instances: 1,
    },
  ],
}
