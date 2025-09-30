import type { Context } from "@oomol/types/oocana";
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';


//#region generated meta
type Inputs = {
    svg: string;
    outputDir: string;
    width: number | null;
    height: number | null;
    quality: number | null;
    background: string | null;
};
type Outputs = {
    png: any;
};
//#endregion

export default async function (
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {
    try {
        // 验证输入
        validateInputs(params);

        const options = {
            width: params.width,
            height: params.height,
            quality: params.quality ?? 90,
            background: params.background ?? 'transparent'
        };

        // Handle batch processing
        if (Array.isArray(params.svg)) {
            const outputPaths: string[] = [];
            const conversionResults: Array<{
                input: string;
                output: string;
                fileSize: string;
                dimensions: string;
                format?: string;
            }> = [];

            for (let i = 0; i < params.svg.length; i++) {
                const svgInput = params.svg[i];
                const outputPath = prepareOutput(params.outputDir, i);

                await convertSvgToPng(svgInput, outputPath, options);

                if (!fs.existsSync(outputPath)) {
                    throw new Error(`Failed to create PNG file for input ${i + 1}`);
                }

                const stats = fs.statSync(outputPath);
                const metadata = await sharp(outputPath).metadata();

                outputPaths.push(outputPath);
                conversionResults.push({
                    input: svgInput.length > 100 ? `${svgInput.substring(0, 100)}...` : svgInput,
                    output: outputPath,
                    fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
                    dimensions: `${metadata.width}x${metadata.height}`,
                    format: metadata.format
                });
            }

            context.logJSON({
                batchResults: conversionResults,
                totalProcessed: outputPaths.length
            });

            return { png: outputPaths };
        } else {
            // Single file processing
            const outputPath = prepareOutput(params.outputDir);

            await convertSvgToPng(params.svg, outputPath, options);

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
            });

            return { png: outputPath };
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        context.logJSON({
            error: errorMessage,
            inputParams: {
                svgType: Array.isArray(params.svg) ? 'batch' : 'single',
                svgCount: Array.isArray(params.svg) ? params.svg.length : 1,
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

    if (!params.outputDir || params.outputDir.trim() === '') {
        throw new Error('Output directory is required');
    }

    // Validate SVG content format
    if (Array.isArray(params.svg)) {
        if (params.svg.length === 0) {
            throw new Error('At least one SVG file is required for batch processing');
        }
        if (params.svg.length > 100) {
            throw new Error('Batch processing is limited to 100 files maximum');
        }
        for (let i = 0; i < params.svg.length; i++) {
            const svg = params.svg[i];
            if (!svg || svg.trim() === '') {
                throw new Error(`SVG content at index ${i} is empty`);
            }
            if (!fs.existsSync(svg) && !svg.includes('<svg')) {
                throw new Error(`Invalid SVG content or file path at index ${i}`);
            }
        }
    } else {
        if (params.svg.trim() === '') {
            throw new Error('SVG content is required');
        }
        if (!fs.existsSync(params.svg) && !params.svg.includes('<svg')) {
            throw new Error('Invalid SVG content or file path');
        }
    }

    // Validate dimensions
    if (params.width !== null && (params.width <= 0 || params.width > 10000)) {
        throw new Error('Width must be between 1 and 10000 pixels');
    }

    if (params.height !== null && (params.height <= 0 || params.height > 10000)) {
        throw new Error('Height must be between 1 and 10000 pixels');
    }

    // Validate quality
    if (params.quality !== null && (params.quality < 1 || params.quality > 100)) {
        throw new Error('Quality must be between 1 and 100');
    }

    // Validate background color format
    if (params.background !== null && params.background !== 'transparent') {
        const colorRegex = /^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\(.*\)|rgba\(.*\)|[a-zA-Z]+)$/;
        if (!colorRegex.test(params.background)) {
            throw new Error('Invalid background color format');
        }
    }
}

function prepareOutput(outputDir: string, index?: number): string {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const suffix = index !== undefined ? `-${index + 1}` : '';
    const fileName = `svg-to-png-${uuidv4()}${suffix}.png`;
    return path.join(outputDir, fileName);
}

async function convertSvgToPng(
    svgContent: string,
    outputPath: string,
    options: { width?: number | null; height?: number | null; quality: number; background: string }
): Promise<void> {
    // Handle both file path and direct SVG content
    let svgBuffer: Buffer;

    if (fs.existsSync(svgContent)) {
        // Input is a file path
        svgBuffer = fs.readFileSync(svgContent);
    } else {
        // Input is SVG content string
        svgBuffer = Buffer.from(svgContent, 'utf8');
    }

    let sharpInstance = sharp(svgBuffer);

    // Get SVG metadata for better processing
    const metadata = await sharpInstance.metadata();

    // 调整尺寸
    if (options.width || options.height) {
        const bgColor = options.background === 'transparent'
            ? { r: 0, g: 0, b: 0, alpha: 0 }
            : options.background;

        sharpInstance = sharpInstance.resize(options.width, options.height, {
            fit: 'contain',
            background: bgColor,
            withoutEnlargement: false, // Allow enlargement for better quality
            kernel: sharp.kernel.lanczos3 // Better resampling algorithm
        });
    }

    // 设置背景
    if (options.background !== 'transparent') {
        sharpInstance = sharpInstance.flatten({ background: options.background });
    }

    // Optimize PNG settings based on content
    const pngOptions: sharp.PngOptions = {
        quality: options.quality,
        compressionLevel: 9, // Maximum compression
        progressive: true, // Enable progressive loading
        palette: metadata.channels === 1, // Use palette for grayscale images
        effort: 10 // Maximum effort for better compression
    };

    // 转换并保存
    await sharpInstance
        .png(pngOptions)
        .toFile(outputPath);
}
