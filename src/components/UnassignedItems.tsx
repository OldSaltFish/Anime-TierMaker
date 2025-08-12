import { type Component, For } from 'solid-js';
import type { Bangumi } from '../types';
import { BangumiItem } from './BangumiItem';

interface UnassignedItemsProps {
  items: Bangumi[];
  onDrop: (itemId: string, sourceContainerId: string, targetContainerId: string, targetIndex?: number) => void;
  allowReordering?: boolean;
}

export const UnassignedItems: Component<UnassignedItemsProps> = (props) => {
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer!.getData('application/json'));

    if (props.allowReordering && data.sourceContainerId === 'unassigned') {
      // 计算拖放位置的索引
      const container = e.currentTarget as HTMLElement;
      const items = container.querySelectorAll('[draggable=true]');
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      let targetIndex: number | undefined = undefined;
      let closestDistance = Infinity;
      let closestItem: HTMLElement | null = null;

      // 找到最近的项目
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as HTMLElement;
        if (item.getAttribute('data-id') === data.id) continue; // 跳过自己

        const rect = item.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const itemCenterY = rect.top + rect.height / 2;

        // 计算鼠标与项目中心点的距离
        const distance = Math.sqrt(
          Math.pow(mouseX - itemCenterX, 2) +
          Math.pow(mouseY - itemCenterY, 2)
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestItem = item;

          // 如果鼠标在项目的左侧，则插入到该项目之前
          if (mouseX < itemCenterX) {
            targetIndex = i;
          } else {
            targetIndex = i + 1;
          }
        }
      }

      props.onDrop(data.id, data.sourceContainerId, 'unassigned', targetIndex);
    } else {
      props.onDrop(data.id, data.sourceContainerId, 'unassigned');
    }
  };

  return (
    <div class="h-full">
      <h2 class="text-xl font-bold mb-2 text-gray-100">未分类番剧</h2>
      <div
        class="flex flex-wrap min-h-32 border border-gray-600 rounded-md bg-gray-800 max-h-[70vh] overflow-y-auto"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-container-id="unassigned"
      >
        <For each={props.items}>
          {(item,index) => (
            <BangumiItem
              item={item}
              containerId="unassigned"
              onDelete={()=>props.items.splice(index(), 1)}
            />
          )}
        </For>
        {props.items.length === 0 && (
          <div class="w-full text-center text-gray-500 py-4">
            没有未分类的番剧
          </div>
        )}
      </div>
    </div>
  );
};