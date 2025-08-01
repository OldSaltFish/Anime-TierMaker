import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';
import {presetWind4} from '@unocss/preset-wind4';
import {UnoCSSRspackPlugin} from '@unocss/webpack/rspack';
export default defineConfig({
  html: {
    title: 'Anime TierMaker - 动画梯度制作器',
  },
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
    pluginSolid(),
  ],
  tools: {
    rspack: {
      plugins: [
        UnoCSSRspackPlugin({
          presets: [presetWind4()],
        }),
      ],
      resolve: {
        alias: {
          'html2canvas': 'html2canvas-pro',
        },
      },
    },
  },
});
