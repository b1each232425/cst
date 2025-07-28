<!-- /*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-05-03 09:42:21
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-05-03 09:42:57
 * @FilePath: /tutorial-platform-fe/src/lib/component/WaterMark.svelte
 * @Description: 水印组件
 */ -->
<script>
    //@ts-nocheck
    import { onMount } from 'svelte';
    let backgroundImage = '';
  
    onMount(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 150;
  
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.rotate(-20 * Math.PI / 180);
      ctx.fillText(`3min`, 10, 100);
  
      backgroundImage = canvas.toDataURL('image/png');
    });
  </script>
  
  <style>
    .watermark {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      background-repeat: repeat;
      background-position: 0 0;
    }
  </style>
  
  <div class="watermark" style="background-image: url({backgroundImage});"></div>