import { createSignal, For, Show } from 'solid-js';
import './App.css';
import type { AppState, Bangumi, Tier } from './types';
import { TierRow } from './components/TierRow';
import { UnassignedItems } from './components/UnassignedItems';
import { ImportExport } from './components/ImportExport';
import { AddBangumiModal } from './components/AddBangumiModal';
import { createMediaQuery } from '@solid-primitives/media';
// 默认的梯度配置 - 使用更柔和的暗色配色
const defaultTiers: Tier[] = [
  { id: 'tier-s', name: 'S', color: '#FC7D82', items: [] }, // 暗红色
  { id: 'tier-a', name: 'A', color: '#BCFF81', items: [] }, // 暗橙色
  { id: 'tier-b', name: 'B', color: '#FBFF82', items: [] }, // 暗黄色
  { id: 'tier-c', name: 'C', color: '#FCC082', items: [] }, // 暗绿色
  { id: 'tier-d', name: 'D', color: '#FBE182', items: [] }, // 暗蓝色
  { id: 'tier-f', name: 'F', color: '#6a1b9a', items: [] }, // 暗紫色
];

// 移除预设配色方案

const App = () => {
  const isWideScreen = createMediaQuery('(min-width: 1024px)');

  // 应用状态
  const [state, setState] = createSignal<AppState>({
    tiers: [...defaultTiers],
    unassignedItems: [],
    isEditingTierName: null,
    showColorPicker: false,
    editingTierColor: null,
  });

  // 悬浮按钮展开状态
  const [isFloatingMenuExpanded, setIsFloatingMenuExpanded] = createSignal(false);

  // 悬浮按钮位置状态
  const [floatingMenuPosition, setFloatingMenuPosition] = createSignal({
    right: '1rem',
    bottom: '33%'
  });

  // 添加番剧模态框状态
  const [isAddBangumiModalOpen, setIsAddBangumiModalOpen] = createSignal(false);

  // 处理导入数据
  const handleImport = (data: Bangumi[]) => {
    setState(prev => {
      // 创建新的 tiers 数组，每个 tier 的 items 初始为空
      const newTiers = prev.tiers.map(tier => ({ ...tier, items: [] as Bangumi[] }));
      
      // 根据评分分配番剧到对应的梯度
      const unassignedItems: Bangumi[] = [];
      
      data.forEach(bangumi => {
        // 如果有评分且评分在有效范围内（0-5）
        if (bangumi.rating !== undefined && bangumi.rating >= 0 && bangumi.rating <= 5) {
          // 计算对应的 tier 索引（反向对应：rating 5 -> index 0, rating 0 -> index 5）
          const tierIndex = 5 - bangumi.rating;
          
          // 确保索引在有效范围内
          if (tierIndex >= 0 && tierIndex < newTiers.length) {
            newTiers[tierIndex].items.push(bangumi);
          } else {
            unassignedItems.push(bangumi);
          }
        } else {
          // 没有评分或评分超出范围的番剧放入未分配区域
          unassignedItems.push(bangumi);
        }
      });
      
      return {
        ...prev,
        unassignedItems,
        tiers: newTiers,
      }
    });
  };

  // 处理拖放
  const handleDrop = (itemId: string, sourceContainerId: string, targetContainerId: string, targetIndex?: number) => {
    if (sourceContainerId === targetContainerId && targetIndex === undefined) return;

    setState(prev => {
      // 找到要移动的项目
      let item: Bangumi | undefined;

      if (sourceContainerId === 'unassigned') {
        item = prev.unassignedItems.find(i => i.id === itemId);
      } else {
        const sourceTier = prev.tiers.find(t => t.id === sourceContainerId);
        item = sourceTier?.items.find(i => i.id === itemId);
      }

      if (!item) return prev;

      // 创建项目的副本，以便更新评分
      const updatedItem = { ...item };
      
      // 如果目标容器是某个梯度，更新番剧的评分
      if (targetContainerId !== 'unassigned') {
        // 找到目标梯度的索引
        const targetTierIndex = prev.tiers.findIndex(t => t.id === targetContainerId);
        if (targetTierIndex !== -1) {
          // 根据梯度索引反向计算评分（索引 0 -> 评分 5，索引 5 -> 评分 0）
          updatedItem.rating = 5 - targetTierIndex;
        }
      } else {
        // 如果拖到未分配区域，可以选择保留或重置评分
        // 这里选择保留评分，如果需要重置可以取消注释下一行
        // updatedItem.rating = undefined;
      }

      // 从源容器中移除项目
      let updatedState = { ...prev };

      if (sourceContainerId === 'unassigned') {
        updatedState.unassignedItems = prev.unassignedItems.filter(i => i.id !== itemId);
      } else {
        updatedState.tiers = prev.tiers.map(tier => {
          if (tier.id === sourceContainerId) {
            return {
              ...tier,
              items: tier.items.filter(i => i.id !== itemId)
            };
          }
          return tier;
        });
      }

      // 将项目添加到目标容器
      if (targetContainerId === 'unassigned') {
        if (targetIndex !== undefined) {
          // 插入到指定位置
          const newItems = [...updatedState.unassignedItems];
          newItems.splice(targetIndex, 0, updatedItem);
          updatedState.unassignedItems = newItems;
        } else {
          updatedState.unassignedItems = [...updatedState.unassignedItems, updatedItem];
        }
      } else {
        updatedState.tiers = updatedState.tiers.map(tier => {
          if (tier.id === targetContainerId) {
            if (targetIndex !== undefined) {
              // 插入到指定位置
              const newItems = [...tier.items];
              newItems.splice(targetIndex, 0, updatedItem);
              return {
                ...tier,
                items: newItems
              };
            } else {
              return {
                ...tier,
                items: [...tier.items, updatedItem]
              };
            }
          }
          return tier;
        });
      }

      return updatedState;
    });
  };

  // 处理梯度拖动
  const handleTierDrop = (draggedTierId: string, targetTierId: string) => {
    console.log(`拖动梯度: ${draggedTierId} 到 ${targetTierId}`);
    setState(prev => {
      const draggedTierIndex = prev.tiers.findIndex(t => t.id === draggedTierId);
      const targetTierIndex = prev.tiers.findIndex(t => t.id === targetTierId);

      if (draggedTierIndex === -1 || targetTierIndex === -1 || draggedTierIndex === targetTierIndex) {
        return prev;
      }

      const newTiers = [...prev.tiers];
      const [draggedTier] = newTiers.splice(draggedTierIndex, 1);
      newTiers.splice(targetTierIndex, 0, draggedTier);

      return {
        ...prev,
        tiers: newTiers
      };
    });
  };

  // 处理梯度名称编辑
  const handleEditTierName = (tierId: string, newName: string) => {
    setState(prev => ({
      ...prev,
      tiers: prev.tiers.map(tier => {
        if (tier.id === tierId) {
          return { ...tier, name: newName };
        }
        return tier;
      }),
    }));
  };

  // 处理梯度颜色更改
  const handleTierColorChange = (tierId: string, newColor: string) => {
    setState(prev => ({
      ...prev,
      tiers: prev.tiers.map(tier => {
        if (tier.id === tierId) {
          return { ...tier, color: newColor };
        }
        return tier;
      }),
    }));
  };

  // 打开颜色选择器
  const handleOpenColorPicker = (tierId: string) => {
    setState(prev => ({
      ...prev,
      showColorPicker: true,
      editingTierColor: tierId,
    }));
  };

  // 关闭颜色选择器
  const handleCloseColorPicker = () => {
    setState(prev => ({
      ...prev,
      showColorPicker: false,
      editingTierColor: null,
    }));
  };

  // 移除应用预设配色方法

  // 开始编辑梯度名称
  const handleStartEditTierName = (tierId: string) => {
    setState(prev => ({
      ...prev,
      isEditingTierName: tierId,
    }));
  };

  // 取消编辑梯度名称
  const handleCancelEditTierName = () => {
    setState(prev => ({
      ...prev,
      isEditingTierName: null,
    }));
  };

  // 添加新梯度
  const handleAddTier = () => {
    const newTierId = `tier-${Date.now()}`;
    setState(prev => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        { id: newTierId, name: '新梯度', color: '#808080', items: [] }
      ],
    }));
  };

  // 删除梯度
  const handleDeleteTier = (tierId: string) => {
    setState(prev => {
      // 找到要删除的梯度
      const tierToDelete = prev.tiers.find(t => t.id === tierId);

      if (!tierToDelete) return prev;

      // 将梯度中的项目移到未分配区域
      const updatedUnassignedItems = [
        ...prev.unassignedItems,
        ...tierToDelete.items
      ];

      return {
        ...prev,
        tiers: prev.tiers.filter(t => t.id !== tierId),
        unassignedItems: updatedUnassignedItems,
      };
    });
  };

  // 处理添加新番剧
  const handleAddBangumi = (newBangumi: Bangumi) => {
    setState(prev => ({
      ...prev,
      unassignedItems: [...prev.unassignedItems, newBangumi]
    }));
  };

  // 处理删除番剧
  const handleDeleteBangumi = (id: string) => {
    setState(prev => {
      // 从未分类区域删除
      const updatedUnassigned = prev.unassignedItems.filter(item => item.id !== id);

      // 从所有梯度中删除
      const updatedTiers = prev.tiers.map(tier => ({
        ...tier,
        items: tier.items.filter(item => item.id !== id)
      }));

      return {
        ...prev,
        unassignedItems: updatedUnassigned,
        tiers: updatedTiers
      };
    });
  };

  return (
    <div class="mx-auto px-1 py-2 bg-gray-900 rounded-lg">
      <div class='flex'>
        <img class='h-42px' src={require('./assets/logo.avif')} alt="" />
        <h1 class="text-2xl font-bold mb-1 text-gray-200 bg-gray-800 p-2 rounded">Anime TierMaker</h1>
      </div>

      {/* 悬浮按钮 */}
      <div
        class="fixed z-50"
        style={{
          right: floatingMenuPosition().right,
          bottom: floatingMenuPosition().bottom
        }}
      >
        <div
          class="flex flex-col items-end gap-2 floating-menu-container"
          style={{ cursor: 'move' }}
        >
          {/* 展开的菜单 */}
          <Show when={isFloatingMenuExpanded()}>
            <div class="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700 flex flex-col gap-2 mb-2 floating-menu-content">
              <ImportExport
                onImport={handleImport}
                tiers={state().tiers}
              />

              <button
                onClick={handleAddTier}
                class="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm w-full"
              >
                添加梯度
              </button>

              {/* 移除预设配色选择器 */}
            </div>
          </Show>

          {/* 展开/收起按钮 */}
          <button
            onClick={() => setIsFloatingMenuExpanded(!isFloatingMenuExpanded())}
            class="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg floating-menu-button"
            title={isFloatingMenuExpanded() ? "收起菜单" : "展开菜单"}
            id="expand-menu-button"
          >
            {isFloatingMenuExpanded() ? "×" : "≡"}
          </button>

          {/* 添加番剧按钮 */}
          <button
            onClick={() => setIsAddBangumiModalOpen(true)}
            class="bg-green-600 hover:bg-green-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg floating-menu-button mt-2"
            title="添加番剧"
            id="add-bangumi-button"
          >
            +
          </button>
        </div>
      </div>

      <div class={isWideScreen() ? "flex gap-4" : "flex flex-col gap-4"}>
        <div class={isWideScreen() ? "w-228px sticky top-2 self-start bg-gray-800 rounded" : "w-full bg-gray-800 p-2 rounded"}>
          <UnassignedItems
            items={state().unassignedItems}
            onDrop={handleDrop}
            allowReordering={true}
          />
        </div>
        <div id='tiers' class={isWideScreen() ? "flex-1" : "w-full"}>
          <For each={state().tiers}>
            {(tier, index) => (
              <div
                class="relative"
              >
                <TierRow
                  tier={tier}
                  onDrop={(itemId, sourceContainerId, targetContainerId, targetIndex) => {
                    if (sourceContainerId === 'tier') {
                      // 处理梯度之间的拖动
                      handleTierDrop(itemId, targetContainerId);
                    } else {
                      // 处理普通项目的拖动
                      handleDrop(itemId, sourceContainerId, targetContainerId, targetIndex);
                    }
                  }}
                  onEditName={handleEditTierName}
                  onColorChange={handleTierColorChange}
                  isEditingName={state().isEditingTierName === tier.id}
                  onStartEditName={() => handleStartEditTierName(tier.id)}
                  onCancelEditName={handleCancelEditTierName}
                  onOpenColorPicker={() => handleOpenColorPicker(tier.id)}
                  showColorPicker={state().showColorPicker && state().editingTierColor === tier.id}
                  onCloseColorPicker={handleCloseColorPicker}
                  isWideScreen={isWideScreen()}
                />
                <button
                  onClick={() => handleDeleteTier(tier.id)}
                  class="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600"
                  title="删除梯度"
                >
                  ×
                </button>
              </div>
            )}
          </For>
        </div>

      </div>

      {/* 添加番剧模态框 */}
      <AddBangumiModal
        isOpen={isAddBangumiModalOpen()}
        onClose={() => setIsAddBangumiModalOpen(false)}
        onAdd={handleAddBangumi}
      />
    </div>
  );
};

export default App;