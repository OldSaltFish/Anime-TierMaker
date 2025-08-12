import { type Component, type JSX, createSignal } from 'solid-js';
import type { Bangumi } from '../types';

interface BangumiItemProps {
  item: Bangumi;
  containerId: string;
  onDelete?: (id: string) => void;
}

/**
 * 表示番剧项目的组件，支持拖放操作
 */
export const BangumiItem: Component<BangumiItemProps> = (props) => {
  // 创建悬停状态
  const [isHovered, setIsHovered] = createSignal(false);
  /**
   * 处理拖动开始事件
   * @param e 拖动事件对象
   */
  const handleDragStart = (e: DragEvent & { currentTarget: HTMLDivElement; target: Element }) => {
    // 确保dataTransfer存在
    if (!e.dataTransfer) return;
    
    const data = {
      id: props.item.id,
      sourceContainerId: props.containerId,
      type: 'BANGUMI'
    };
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
    
    // 创建拖动时的自定义图像
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    
    // 使用元素自身作为拖动图像，并设置偏移量使其跟随鼠标
    if (e.dataTransfer.setDragImage) {
      e.dataTransfer.setDragImage(target, rect.width / 2, rect.height / 2);
    }
    
    // 添加拖动时的视觉效果
    setTimeout(() => {
      target.classList.add('dragging');
    }, 0);
    target.dataset.hasPlaceholder = 'true';
  };
  
  /**
   * 处理拖动结束事件
   * @param e 拖动事件对象
   */
  const handleDragEnd = (e: DragEvent & { currentTarget: HTMLDivElement; target: Element }) => {
    // 移除拖动时的视觉效果
    const target = e.currentTarget;
    target.classList.remove('dragging');
  };

  // 默认的占位符图像
  const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

  /**
   * 处理图片加载错误
   * @param e 错误事件
   */
  const handleImageError: JSX.EventHandlerUnion<HTMLImageElement, Event> = (e) => {
    if (e.target instanceof HTMLImageElement) {
      e.target.src = DEFAULT_PLACEHOLDER;
    }
  };

  // 处理删除按钮点击
  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (props.onDelete) {
      props.onDelete(props.item.id);
    }
  };

  return (
    <div 
      class="w-24 m-1 flex flex-col items-center cursor-move bg-white rounded-md shadow-md overflow-hidden relative"
      draggable={true}
      onDragStart={handleDragStart as unknown as JSX.EventHandlerUnion<HTMLDivElement, DragEvent>}
      onDragEnd={handleDragEnd as unknown as JSX.EventHandlerUnion<HTMLDivElement, DragEvent>}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={props.item.title}
      data-id={props.item.id}
    >
      {/* 删除按钮 - 仅在悬停时显示 */}
      {isHovered() && props.onDelete && (
        <button 
          class="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-bl-md z-10 opacity-90 hover:opacity-100"
          onClick={handleDelete as unknown as JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>}
          title="删除"
        >
          ×
        </button>
      )}
      
      <div class="w-full h-24 overflow-hidden">
        <img 
          src={props.item.coverBase64 || DEFAULT_PLACEHOLDER} 
          alt={props.item.title} 
          class="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>
      <div class="p-1 text-center text-xs w-full truncate">
        {props.item.title}
      </div>
    </div>
  );
};