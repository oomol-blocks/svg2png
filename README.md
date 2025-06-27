# SVG to PNG Converter

[English](./README.md) | [中文](./README-zh.md)

A high-quality image processing tool that converts SVG files to PNG format.

## Features

* Supports SVG file conversion with any dimensions
* Customizable output size and quality
* Supports transparent background or custom background colors
* Automatically generates unique filenames to avoid conflicts
* Provides detailed conversion log information

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `svg` | string | ✓ | - | SVG file path |
| `outputDir` | string | ✓ | - | Output directory path |
| `width` | number | - | - | Output width (pixels) |
| `height` | number | - | - | Output height (pixels) |
| `quality` | number | - | 90 | PNG quality (1-100) |
| `background` | string | - | 'transparent' | Background color or 'transparent' |

## Output Result

| Parameter | Type | Description |
|-----------|------|-------------|
| `png` | string | Generated PNG file path |
