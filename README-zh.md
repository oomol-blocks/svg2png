# SVG 转 PNG 转换器

[English](./README.md) | [中文](./README-zh.md)

将 SVG 文件转换为 PNG 格式的高质量图像处理工具。

## 功能特性

* 支持任意尺寸的 SVG 文件转换
* 可自定义输出尺寸和质量
* 支持透明背景或自定义背景色
* 自动生成唯一文件名，避免冲突
* 提供详细的转换日志信息

## 输入参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `svg` | string | ✓ | - | SVG 文件路径 |
| `outputDir` | string | ✓ | - | 输出目录路径 |
| `width` | number | - | - | 输出宽度（像素） |
| `height` | number | - | - | 输出高度（像素） |
| `quality` | number | - | 90 | PNG 质量 (1-100) |
| `background` | string | - | 'transparent' | 背景色或 'transparent' |

## 输出结果

| 参数 | 类型 | 说明 |
|------|------|------|
| `png` | string | 生成的 PNG 文件路径 |
