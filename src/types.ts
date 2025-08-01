// 番剧数据类型
export interface Bangumi {
  id: string;
  title: string;
  coverBase64: string;
  // 可以添加更多字段，如评分、季度等
}

// 梯度类型
export interface Tier {
  id: string;
  name: string;
  color: string;
  items: Bangumi[];
}

// 应用状态类型
export interface AppState {
  tiers: Tier[];
  unassignedItems: Bangumi[];
  isEditingTierName: string | null;
  showColorPicker: boolean;
  editingTierColor: string | null;
}

// 导入数据类型
export interface BangumiData {
  bangumis: Bangumi[];
}