# 阿里云部署说明

## 服务器信息
- **IP**: 47.109.107.69
- **用户**: root
- **项目目录**: /root/daily-task-tracker-prod
- **GitHub**: https://github.com/power-8341/daily-task-tracker

## 部署步骤

### 方法1：使用SSH密钥（推荐）
1. 将本地SSH公钥添加到阿里云服务器
2. 运行 `./deploy-to-aliyun.sh`

### 方法2：手动部署
```bash
# 1. SSH连接到服务器
ssh root@47.109.107.69

# 2. 拉取代码
cd /root/daily-task-tracker-prod
git pull origin main

# 3. 安装依赖
npm install

# 4. 构建
npm run build

# 5. 重启服务
pm2 restart daily-task-tracker
```

### 方法3：使用GitHub Actions（自动化）
需要在GitHub仓库配置：
- ALIYUN_SSH_KEY
- ALIYUN_HOST
- ALIYUN_USER

## 访问地址
部署完成后访问：http://47.109.107.69:3000/v2

## 问题排查
```bash
# 检查服务状态
pm2 status
pm2 logs daily-task-tracker

# 检查端口
netstat -tlnp | grep 3000

# 重启服务
pm2 restart daily-task-tracker
```
