# 基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 生产环境默认端口
ENV NODE_ENV=production
ENV PORT=3000

# 复制运行所需文件
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

# 使用非 root 用户运行
USER node

# 暴露服务端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/healthz').then((response) => { if (!response.ok) { process.exit(1); } }).catch(() => process.exit(1));"

  # 启动命令
CMD ["node", "src/server.js"]
