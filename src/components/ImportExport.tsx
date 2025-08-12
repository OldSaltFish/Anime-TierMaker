import { type Component, createSignal } from 'solid-js';
import type { Bangumi, BangumiData, Tier } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas-pro';

interface ImportExportProps {
  onImport: (data: Bangumi[]) => void;
  tiers: Tier[];
}

export const ImportExport: Component<ImportExportProps> = (props) => {
  const [error, setError] = createSignal<string | null>(null);
  const [isExporting, setIsExporting] = createSignal(false);

  const handleFileChange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      let data = JSON.parse(text) as Bangumi[];
      // 验证数据格式
      if (!data || !Array.isArray(data)) {
        throw new Error('无效的数据格式：缺少bangumis数组');
      }
      data = data.filter(bangumi => {
        return bangumi.id && bangumi.title && bangumi.coverBase64
      })
      props.onImport(data);
      setError(null);

      // 重置文件输入
      target.value = '';
    } catch (err) {
      console.error('导入错误:', err);
      setError(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleExport = async () => {
    try {
      const zip = new JSZip();

      // 创建一个包含所有梯度信息的JSON文件
      const tierData = {
        tiers: props.tiers.map(tier => ({
          id: tier.id,
          name: tier.name,
          color: tier.color,
          items: tier.items.map(item => item.id)
        }))
      };

      zip.file('tiers.json', JSON.stringify(tierData, null, 2));

      // 为每个梯度创建一个HTML文件
      props.tiers.forEach(tier => {
        if (tier.items.length === 0) return;

        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tier.name} - TierMaker</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    .tier-header {
      background-color: ${tier.color};
      color: white;
      padding: 10px;
      font-size: 24px;
      font-weight: bold;
      border-radius: 5px 5px 0 0;
    }
    .tier-content {
      display: flex;
      flex-wrap: wrap;
      padding: 10px;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 5px 5px;
    }
    .bangumi-item {
      width: 120px;
      margin: 10px;
      background: white;
      border-radius: 5px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .bangumi-cover {
      width: 100%;
      height: 160px;
      object-fit: cover;
    }
    .bangumi-title {
      padding: 5px;
      text-align: center;
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div class="tier-header">${tier.name}</div>
  <div class="tier-content">
    ${tier.items.map(item => `
      <div class="bangumi-item">
        <img class="bangumi-cover" src="${item.coverBase64}" alt="${item.title}">
        <div class="bangumi-title">${item.title}</div>
      </div>
    `).join('')}
  </div>
</body>
</html>
        `;

        zip.file(`${tier.name}.html`, html);
      });

      // 生成并下载ZIP文件
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'tier-maker-export.zip');

      setError(null);
    } catch (err) {
      console.error('导出错误:', err);
      setError(`导出失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  // 导出截图功能
  const handleExportScreenshot = async () => {
    try {
      setIsExporting(true);
      setError(null);
      // 获取所有梯度容器
      // const tierContainers = document.querySelectorAll('.tier-container');

      // if (tierContainers.length === 0) {
      //   throw new Error('未找到梯度容器');
      // }

      // // 创建一个临时容器来组合所有梯度
      // const tempContainer = document.createElement('div');
      // tempContainer.style.position = 'absolute';
      // tempContainer.style.left = '-9999px';
      // tempContainer.style.background = '#f5f5f5';
      // tempContainer.style.padding = '20px';
      // document.body.appendChild(tempContainer);

      // // 克隆所有梯度到临时容器
      // tierContainers.forEach(container => {
      //   const clone = container.cloneNode(true) as HTMLElement;
      //   // 移除操作按钮
      //   const buttons = clone.querySelectorAll('button');
      //   buttons.forEach(button => button.remove());
      //   tempContainer.appendChild(clone);
      // });
      const tiers = document.querySelector('#tiers') as HTMLElement;
      // 暂时隐藏所有操作按钮
      const buttons = tiers.querySelectorAll('button');
      const prevDisplay: string[] = [];
      buttons.forEach(button => {
        prevDisplay.push(button.style.display);
        button.style.display = 'none';
      });

      // 使用html2canvas捕获
      const canvas = await html2canvas(tiers, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      // 恢复按钮可见性
      buttons.forEach((button, idx) => {
        button.style.display = prevDisplay[idx] ?? '';
      });

      // 下载图片
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'tier-maker-screenshot.png';
      link.href = image;
      link.click();

      setIsExporting(false);
    } catch (err) {
      console.error('截图导出错误:', err);
      setError(`截图导出失败: ${err instanceof Error ? err.message : '未知错误'}`);
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div class="flex flex-col gap-2">
        <div>
          <label
            for="import-file"
            class="bg-blue-500 text-white px-3 py-1 rounded cursor-pointer hover:bg-blue-600 block text-center text-sm"
          >
            导入JSON
          </label>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            class="hidden"
          />
        </div>

        <button
          onClick={handleExport}
          class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
          disabled={props.tiers.every(tier => tier.items.length === 0)}
        >
          导出为ZIP
        </button>

        <button
          onClick={handleExportScreenshot}
          class="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-sm"
          disabled={props.tiers.every(tier => tier.items.length === 0) || isExporting()}
        >
          {isExporting() ? '导出中...' : '导出截图'}
        </button>
      </div>

      {error() && (
        <div class="mt-2 text-red-500 text-sm">
          {error()}
        </div>
      )}
    </div>
  );
};