# 动作序列帧资源

将小鸟 PNG 帧图片放在这里，目录结构：

```
animations/
  动作1/
    frame_01.png
    frame_02.png
    ...（共 6 帧，fps 10）
  动作2/   （共 7 帧，fps 10）
  动作3/   （共 6 帧，fps 10）
  动作4/   （共 7 帧，fps 8）
  动作5/   （共 5 帧，fps 6）
  动作6/   （共 5 帧，fps 8）  ← 默认待机
  动作7/   （共 5 帧，fps 8）
```

Web 版迁移路径：将同名帧放到  
`apps/web/public/sprites/动作N/frame_NN.png`  
即可在浏览器的 Canvas 渲染器中直接使用。
