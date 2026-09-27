# 模块规格：`containerized-runtime`

## 目标

用 Docker 构建并通过 Docker Compose 一键启动完整生产应用。

## 规则

- 使用多阶段构建：依赖安装、构建和最小运行镜像分离。
- 生产容器以非 root 用户运行，仅复制运行所需产物和生产依赖。
- Compose 暴露单一应用端口并配置健康检查；不引入数据库或外部服务。
- `.dockerignore` 排除 `node_modules`、测试产物、Git 元数据、日志和本地 Secrets。
- 容器停止后状态丢失符合内存存储约束。

## 验收条件

- `CR-01`：`docker compose up --build` 从仓库内容构建并启动健康服务。
- `CR-02`：宿主机无需安装 Node.js 即可访问页面、API 和 WebSocket。
- `CR-03`：容器健康检查能够区分就绪与进程失败。
- `CR-04`：运行镜像不包含源测试缓存、开发服务器或明文 Secrets。
- `CR-05`：`docker compose down` 能正常停止并清理本项目容器和网络，不删除其他资源。

## 非目标

不提供 Kubernetes、镜像仓库发布、TLS 终止或生产编排方案。
