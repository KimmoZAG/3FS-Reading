# 3FS-Reading

[打开中文学习手册](https://kimmozag.github.io/3FS-Reading/)

从一次文件读写入手，学习 DeepSeek 的 Fire-Flyer File System（3FS）。手册包含六章课程、十二个可搜索的知识点、三个浏览器实验和一套章节测验。课程引用固定在上游提交 [`2dcbff5`](https://github.com/deepseek-ai/3FS/tree/2dcbff518ea53be75c9702d2736134c021f9643d)，方便按文件和行号核对。

- [知识索引](https://kimmozag.github.io/3FS-Reading/#concepts)
- [跨块与条带、CRAQ、故障切换实验](https://kimmozag.github.io/3FS-Reading/#lab)
- [章节测验](https://kimmozag.github.io/3FS-Reading/#quiz)

| 章节 | 内容 |
| --- | --- |
| 01 认识 3FS | 共享存储、AI 负载与性能指标 |
| 02 系统架构 | FUSE / USRBIO、Meta、Storage 与 Mgmtd |
| 03 文件与数据布局 | inode、chunk、条带与副本链 |
| 04 读写与 CRAQ | 写入传播、提交确认、未提交读和链变更 |
| 05 从源码读起 | 跟踪元数据、读、写三条路径 |
| 06 动手复盘 | 跨块练习、测试方案与集群部署资料 |

## 本地预览

可直接打开 `docs/index.html`，也可以在仓库根目录运行以下命令，访问 `http://localhost:8000`。

```bash
python -m http.server 8000 --directory docs
```

网站使用原生 HTML、CSS 和 JavaScript。实验使用简化的教学模型，在浏览器内运行。学习进度保存在当前浏览器。

## GitHub Pages

Pages 的发布源为 GitHub Actions。推送网站、发布工作流或静态检查脚本的变更到 `main` 后，工作流先检查本地链接、资源和 JavaScript 语法，再部署 `docs/`。也可以在 [发布工作流](https://github.com/KimmoZAG/3FS-Reading/actions/workflows/deploy-pages.yml) 中选择 **Run workflow**，手动发布 `main`。
