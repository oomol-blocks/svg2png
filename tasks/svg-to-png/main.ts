import type { Context } from "@oomol/types/oocana";
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

type Inputs = {
    svg: string;
    outputDir: string;
    width?: number;
    height?: number;
    quality?: number;
    background?: string;
};

type Outputs = {
    png: string;
};

export default async function (
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {
    try {
        // 验证输入
        validateInputs(params);

        // 输出
        const outputPath = prepareOutput(params.outputDir);

        const options = {
            width: params.width,
            height: params.height,
            quality: params.quality ?? 90,
            background: params.background ?? 'transparent'
        };

        // 执行转换
        await convertSvgToPng(params.svg, outputPath, options);

        // 验证结果
        if (!fs.existsSync(outputPath)) {
            throw new Error('Failed to create PNG file');
        }

        const stats = fs.statSync(outputPath);
        const metadata = await sharp(outputPath).metadata();

        context.logJSON({
            outputPath,
            fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
            dimensions: `${metadata.width}x${metadata.height}`,
            format: metadata.format
        })

        return { png: outputPath };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        context.logJSON({
            error: errorMessage,
            inputParams: {
                svgLength: params.svg?.length || 0,
                outputDir: params.outputDir,
                width: params.width,
                height: params.height
            }
        });

        throw new Error(`SVG to PNG conversion failed: ${errorMessage}`);
    }
}


function validateInputs(params: Inputs): void {
    if (!params.svg) {
        throw new Error('SVG content is required');
    }
    if (!params.outputDir) {
        throw new Error('Output directory is required');
    }
}

function prepareOutput(outputDir: string): string {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `svg-to-png-${uuidv4()}.png`;
    return path.join(outputDir, fileName);
}

async function convertSvgToPng(
    svgPath: string,
    outputPath: string,
    options: { width?: number; height?: number; quality: number; background: string }
): Promise<void> {
    const svgBuffer = fs.readFileSync(svgPath);
    let sharpInstance = sharp(svgBuffer);

    // 调整尺寸
    if (options.width || options.height) {
        const bgColor = options.background === 'transparent'
            ? { r: 0, g: 0, b: 0, alpha: 0 }
            : options.background;

        sharpInstance = sharpInstance.resize(options.width, options.height, {
            fit: 'contain',
            background: bgColor
        });
    }

    // 设置背景
    if (options.background !== 'transparent') {
        sharpInstance = sharpInstance.flatten({ background: options.background });
    }

    // 转换并保存
    await sharpInstance
        .png({ quality: options.quality, compressionLevel: 6 })
        .toFile(outputPath);
}
