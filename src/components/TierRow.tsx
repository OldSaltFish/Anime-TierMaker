import { type Component, createSignal, For, Show } from 'solid-js';
import type { Tier } from '../types';
import { BangumiItem } from './BangumiItem';

interface TierRowProps {
  tier: Tier;
  onDrop: (itemId: string, sourceContainerId: string, targetContainerId: string, targetIndex?: number) => void;
  onEditName: (tierId: string, newName: string) => void;
  onColorChange: (tierId: string, newColor: string) => void;
  isEditingName: boolean;
  onStartEditName: () => void;
  onCancelEditName: () => void;
  onOpenColorPicker?: () => void;
  showColorPicker?: boolean;
  onCloseColorPicker?: () => void;
  isWideScreen: boolean;
}

export const TierRow: Component<TierRowProps> = (props) => {
  const [editName, setEditName] = createSignal(props.tier.name);



  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    // 安全解析JSON数据
    let data;
    try {
      const jsonData = e.dataTransfer!.getData('application/json');
      if (!jsonData) {
        console.error('No drag data found');
        return;
      }
      data = JSON.parse(jsonData);
    } catch (error) {
      console.error('Failed to parse drag data:', error);
      return;
    }

    // 处理梯度拖动
    if (data.type === 'TIER') {
      const dropTarget = e.currentTarget as HTMLElement;
      dropTarget.classList.remove('tier-drop-indicator');
      console.log(`梯度拖放: ${data.id} 从 ${data.sourceContainerId || 'tier'} 到 ${props.tier.id}`);
      props.onDrop(data.id, 'tier', props.tier.id);
      return;
    }

    // 计算拖放位置的索引
    if (data.type === 'BANGUMI') {
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
        if (item.getAttribute('data-id') === data.id) continue; // 跳过自己(比如说虚影)

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

          // 根据屏幕方向决定插入位置
          if ((props.isWideScreen && mouseX < itemCenterX) ||
            (!props.isWideScreen && mouseY > itemCenterY)) {
            targetIndex = i;
          } else {
            targetIndex = i + 1;
          }
        }
      }


      props.onDrop(data.id, data.sourceContainerId, props.tier.id, targetIndex);
    } else {
      props.onDrop(data.id, data.sourceContainerId, props.tier.id);
    }
  };

  const handleNameChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setEditName(target.value);
  };

  const handleNameSubmit = () => {
    props.onEditName(props.tier.id, editName());
    props.onCancelEditName();
  };

  const handleColorChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    props.onColorChange(props.tier.id, target.value);
  };

  return (
    <div class={`flex ${props.isWideScreen ? 'flex-row' : 'flex-col'} border-b border-gray-300 tier-container`}>
      <div
        class={`${props.isWideScreen ? 'w-24 min-w-24' : 'w-full'} flex group ${props.isWideScreen ? 'flex-col justify-center items-center' : 'flex-row items-center'} p-2 relative`}
        style={{ "background-color": props.tier.color }}
      >
        <Show
          when={props.isEditingName}
          fallback={
            <div
              class="font-bold text-black text-lg cursor-pointer flex-1 text-center"
              onClick={props.onStartEditName}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer!.setData('application/json', JSON.stringify({
                  id: props.tier.id,
                  type: 'TIER'
                }));
                e.stopPropagation();
              }}
            >
              {props.tier.name}
            </div>
          }
        >
          <div class={`flex ${props.isWideScreen ? 'flex-col' : 'flex-row'} items-center flex-1 gap-2`}>
            <input
              type="text"
              value={editName()}
              onInput={handleNameChange}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameSubmit();
                } else if (e.key === 'Escape') {
                  props.onCancelEditName();
                }
              }}
              class="border border-gray-300 rounded px-2 py-1 flex-1 w-full text-center"
              autofocus
            />
          </div>
        </Show>

        <button
          onClick={props.onOpenColorPicker}
          class="hidden group-hover:block text-gray-400 w-6 h-6 rounded-full border border-white mt-2 flex items-center justify-center overflow-hidden"
          title="更改颜色"
        >
          <div class="w-full h-full" style={{ "background-color": props.tier.color }}></div>
        </button>

        {props.showColorPicker && (
          <div class="absolute z-10 bg-gray-800 shadow-lg rounded-md p-3 mt-2 border border-gray-700 text-white">
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium">选择颜色</span>
              <button
                onClick={props.onCloseColorPicker}
                class="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div class="flex flex-col gap-2">
              {/* 颜色列表 */}
              <div class="grid grid-cols-5 gap-2 mb-2">
                {[
                  '#c62828', '#e65100', '#f57f17', '#2e7d32', '#1565c0',
                  '#6a1b9a', '#8e0000', '#bf360c', '#ff6f00', '#1b5e20',
                  '#0d47a1', '#4a148c', '#b71c1c', '#e64a19', '#ffa000',
                  '#33691e', '#01579b', '#424242', '#616161', '#757575'
                ].map((color) => (
                  <button
                    onClick={() => {
                      props.onColorChange(props.tier.id, color);
                      props.onCloseColorPicker?.();
                    }}
                    class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                    style={{ "background-color": color }}
                    title={color}
                  />
                ))}
              </div>

              {/* 保留自定义颜色选择器 */}
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  value={props.tier.color}
                  onInput={handleColorChange}
                  class="w-8 h-8 cursor-pointer"
                  title="自定义颜色"
                />
                <input
                  type="text"
                  value={props.tier.color}
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(target.value)) {
                      props.onColorChange(props.tier.id, target.value);
                    }
                  }}
                  class="border border-gray-300 rounded px-2 py-1 flex-1"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        class={`flex flex-wrap min-h-128px bg-gray-800 ${props.isWideScreen ? 'flex-1' : 'w-full'}`}
        onDragOver={e=>e.preventDefault()}
        onDrop={handleDrop}
        data-container-id={props.tier.id}
        onDragEnter={(e) => {
          const data = e.dataTransfer?.getData('application/json');
          if (data && JSON.parse(data).type === 'TIER') {
            e.currentTarget.classList.add('tier-drop-indicator');
          }
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('tier-drop-indicator');
        }}
      >
        <For each={props.tier.items}>
          {(item) => (
            <BangumiItem
              item={item}
              containerId={props.tier.id}
            />
          )}
        </For>
      </div>
    </div>
  );
};