# 哈哈哈

基于 [Taiwan Memory](https://github.com/jia050904/taiwan_memory) 的静态个人网站。沿用模板的复古手账布局和五个栏目，包含带照片的日记、旅行与舞蹈链接、Word 攻略、留言、随手记和背景音乐。

## 本地打开

在仓库目录运行：

```sh
python3 -m http.server 4173
```

访问 http://localhost:4173/。网站无需安装依赖，也兼容 GitHub Pages 从 `main` 分支根目录发布。

## 修改和保存内容

- 在 `index.html` 修改站名、首页介绍和关于弹窗。颜色和排版位于三个 CSS 文件。
- 浏览器通过 IndexedDB 保存日记、照片、收藏、文档和留言。数据随浏览器与网址区分，换设备或清理站点数据后无法读取原来的记录。
- 旅行和舞蹈收藏从分享文字提取标题及链接，可以打开原帖。
- 背景音乐为随站点附带的原创短旋律。要替换音乐，可以把音频放进 `songs/` 并修改 `index.html` 中的 `fallbackPlaylist`。
