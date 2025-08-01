import { type Component, createSignal, type JSX, Show } from 'solid-js';
import type { Bangumi } from '../types';

interface AddBangumiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bangumi: Bangumi) => void;
}

export const AddBangumiModal: Component<AddBangumiModalProps> = (props) => {
  const [title, setTitle] = createSignal('');
  const [imageBase64, setImageBase64] = createSignal('');
  const [error, setError] = createSignal('');

  // 处理图片上传
  const handleImageUpload: JSX.EventHandlerUnion<HTMLInputElement, Event> = (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) {
      setError('请选择一个图片文件');
      return;
    }
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择有效的图片文件');
      return;
    }
    
    // 读取文件并转换为Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string);
      setError('');
    };
    reader.onerror = () => {
      setError('读取图片失败，请重试');
    };
    reader.readAsDataURL(file);
  };

  // 处理表单提交
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    // 验证图片是否已上传
    if (!imageBase64()) {
      setError('请上传一张图片');
      return;
    }
    
    // 创建新的番剧对象
    const newBangumi: Bangumi = {
      id: `bangumi-${Date.now()}`,
      title: title() || '未命名番剧', // 如果标题为空，使用默认值
      coverBase64: imageBase64()
    };
    
    // 调用父组件的添加方法
    props.onAdd(newBangumi);
    
    // 重置表单并关闭模态框
    setTitle('');
    setImageBase64('');
    setError('');
    props.onClose();
  };

  // 关闭模态框并重置表单
  const handleClose = () => {
    setTitle('');
    setImageBase64('');
    setError('');
    props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4 text-gray-100">添加新番剧</h2>
          
          <form onSubmit={handleSubmit}>
            {/* 标题输入 */}
            <div class="mb-4">
              <label class="block text-gray-300 mb-2" for="title">
                标题 (可选)
              </label>
              <input
                id="title"
                type="text"
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="输入番剧标题"
              />
            </div>
            
            {/* 图片上传 */}
            <div class="mb-4">
              <label class="block text-gray-300 mb-2" for="image">
                封面图片 <span class="text-red-500">*</span>
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              />
              
              {/* 图片预览 */}
              <Show when={imageBase64()}>
                <div class="mt-2 border border-gray-600 rounded overflow-hidden">
                  <img 
                    src={imageBase64()} 
                    alt="预览" 
                    class="w-full h-40 object-contain bg-gray-900"
                  />
                </div>
              </Show>
            </div>
            
            {/* 错误提示 */}
            <Show when={error()}>
              <div class="mb-4 text-red-500">
                {error()}
              </div>
            </Show>
            
            {/* 按钮组 */}
            <div class="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                取消
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                添加
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};