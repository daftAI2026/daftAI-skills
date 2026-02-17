#!/usr/bin/env python3
"""
烧录字幕到视频
支持字体检测、自动回退、H.264 编码
"""

import sys
import os
import shutil
import subprocess
import tempfile
import platform
from pathlib import Path
from typing import Dict, Optional

from utils import format_file_size


# 默认参数
DEFAULT_FONT_SIZE = 21
DEFAULT_OUTLINE = 0.75
DEFAULT_MARGIN_V = 15
DEFAULT_CRF = 18

# 水印默认参数
DEFAULT_WATERMARK_OPACITY = 0.7
DEFAULT_WATERMARK_FONTSIZE_RATIO = 0.025  # 相对于视频高度的比例

# 素材来源默认参数
DEFAULT_SOURCE_OPACITY = 0.7
DEFAULT_SOURCE_FONTSIZE_RATIO = 0.025

# 字体优先级
FONT_PRIORITY = [
    "Alibaba PuHuiTi 3.0",
    "Alibaba PuHuiTi 3.0 55 Regular",
    "AlibabaPuHuiTi-3-55-Regular",
    "Noto Sans CJK SC",
    "Noto Sans CJK",
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
]


def get_video_height(video_path: str, ffprobe_path: str = None) -> int:
    """获取视频高度（像素）"""
    if ffprobe_path is None:
        ffprobe_path = shutil.which('ffprobe')
    if ffprobe_path is None:
        return 1080  # 默认假设 1080p
    try:
        result = subprocess.run(
            [ffprobe_path, '-v', 'error', '-select_streams', 'v:0',
             '-show_entries', 'stream=height', '-of', 'csv=p=0',
             str(video_path)],
            capture_output=True, text=True, timeout=10
        )
        return int(result.stdout.strip())
    except Exception:
        return 1080


def detect_available_font() -> str:
    """
    检测可用字体（按优先级）
    
    Returns:
        str: 可用的字体名称
    """
    print("🔍 检测可用字体...")
    
    if platform.system() == 'Darwin':
        # macOS: 检查字体文件
        font_dirs = [
            Path.home() / "Library/Fonts",
            Path("/Library/Fonts"),
            Path("/System/Library/Fonts"),
        ]
        
        for font_name in FONT_PRIORITY:
            for font_dir in font_dirs:
                # 检查阿里普惠
                if "Alibaba" in font_name or "alibaba" in font_name.lower():
                    matches = list(font_dir.glob("*alibaba*")) + list(font_dir.glob("*Alibaba*"))
                    if matches:
                        print(f"   找到字体: {font_name}")
                        return "Alibaba PuHuiTi 3.0"
                
                # 检查 Noto Sans CJK
                if "Noto" in font_name:
                    matches = list(font_dir.glob("*Noto*CJK*")) + list(font_dir.glob("*NotoSansCJK*"))
                    if matches:
                        print(f"   找到字体: {font_name}")
                        return font_name
    
    # 默认使用系统字体
    default_font = "PingFang SC" if platform.system() == 'Darwin' else "sans-serif"
    print(f"   使用系统默认字体: {default_font}")
    return default_font


def detect_ffmpeg_variant() -> Dict:
    """
    检测 FFmpeg 版本和 libass 支持
    """
    print("🔍 检测 FFmpeg 环境...")

    # 检查标准 FFmpeg
    standard_path = shutil.which('ffmpeg')
    if standard_path:
        has_libass = check_libass_support(standard_path)
        print(f"   找到 FFmpeg: {standard_path}")
        print(f"   libass 支持: {'✅ 是' if has_libass else '❌ 否'}")
        return {
            'path': standard_path,
            'has_libass': has_libass
        }

    print("   ❌ 未找到 FFmpeg")
    return {
        'path': None,
        'has_libass': False
    }


def check_libass_support(ffmpeg_path: str) -> bool:
    """
    检查 FFmpeg 是否支持 libass
    """
    try:
        result = subprocess.run(
            [ffmpeg_path, '-filters'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return 'subtitles' in result.stdout.lower()
    except Exception:
        return False


def get_subtitle_extension(path: Path) -> str:
    """获取字幕文件扩展名"""
    return path.suffix.lower()


def is_supported_subtitle(path: Path) -> bool:
    """检查是否为支持的字幕格式"""
    supported = {'.srt', '.vtt', '.ass', '.ssa'}
    return get_subtitle_extension(path) in supported


def get_drawtext_position(position: str, margin: int = 20) -> str:
    """
    根据位置名称生成 FFmpeg drawtext 的 x:y 坐标
    
    Args:
        position: 位置名称 (top-right, top-left, bottom-right, bottom-left)
        margin: 边距像素
    
    Returns:
        str: "x=...:y=..." 格式的坐标字符串
    """
    positions = {
        'top-right': f'x=w-tw-{margin}:y={margin}',
        'top-left': f'x={margin}:y={margin}',
        'bottom-right': f'x=w-tw-{margin}:y=h-th-{margin}',
        'bottom-left': f'x={margin}:y=h-th-{margin}',
    }
    return positions.get(position, positions['top-right'])


def build_drawtext_filter(
    text: str,
    position: str,
    opacity: float,
    font_name: str,
    font_size: int,
    margin: int = 20
) -> str:
    """
    构建 FFmpeg drawtext 滤镜字符串
    
    Args:
        text: 显示的文字
        position: 位置 (top-right, top-left, bottom-right, bottom-left)
        opacity: 透明度 (0.0-1.0)
        font_name: 字体名称
        font_size: 字体大小
        margin: 边距像素
    
    Returns:
        str: drawtext 滤镜字符串
    """
    pos = get_drawtext_position(position, margin)
    # 转义特殊字符
    escaped_text = text.replace("'", "'\\''").replace(":", "\\:")
    alpha = opacity
    
    return (
        f"drawtext=text='{escaped_text}':"
        f"fontfile='':"
        f"font='{font_name}':"
        f"fontsize={font_size}:"
        f"fontcolor=white@{alpha}:"
        f"{pos}"
    )


def burn_subtitles(
    video_path: str,
    subtitle_path: str,
    output_path: str,
    ffmpeg_path: str = None,
    font_name: str = None,
    font_size: int = DEFAULT_FONT_SIZE,
    outline: float = DEFAULT_OUTLINE,
    margin_v: int = DEFAULT_MARGIN_V,
    crf: int = DEFAULT_CRF,
    watermark_text: str = None,
    watermark_position: str = "top-right",
    watermark_opacity: float = DEFAULT_WATERMARK_OPACITY,
    source_text: str = None,
    source_position: str = "top-left",
    source_opacity: float = DEFAULT_SOURCE_OPACITY,
) -> str:
    """
    烧录字幕到视频
    
    支持格式：SRT、VTT、ASS、SSA（直接使用，无需转换）
    
    Args:
        video_path: 输入视频路径
        subtitle_path: 字幕文件路径（支持 .srt/.vtt/.ass/.ssa）
        output_path: 输出视频路径
        ffmpeg_path: FFmpeg 路径（可选）
        font_name: 字体名称（可选，自动检测）
        font_size: 字体大小
        outline: 描边粗细
        margin_v: 底部边距
        crf: 视频质量（越小越好）
        watermark_text: 水印文字（可选）
        watermark_position: 水印位置 (top-right, top-left, bottom-right, bottom-left)
        watermark_opacity: 水印透明度 (0.0-1.0)
        source_text: 素材来源标注文字（可选）
        source_position: 来源标注位置 (top-right, top-left, bottom-right, bottom-left)
        source_opacity: 来源标注透明度 (0.0-1.0)
    
    Returns:
        str: 输出视频路径
    """
    video_path = Path(video_path)
    subtitle_path = Path(subtitle_path)
    output_path = Path(output_path)

    # 验证输入文件
    if not video_path.exists():
        raise FileNotFoundError(f"视频文件不存在: {video_path}")
    if not subtitle_path.exists():
        raise FileNotFoundError(f"字幕文件不存在: {subtitle_path}")
    
    # 检查字幕格式
    if not is_supported_subtitle(subtitle_path):
        raise ValueError(f"不支持的字幕格式: {subtitle_path.suffix}（支持 .srt/.vtt/.ass/.ssa）")

    # 检测 FFmpeg
    if ffmpeg_path is None:
        ffmpeg_info = detect_ffmpeg_variant()
        if ffmpeg_info['path'] is None:
            raise RuntimeError("未找到 FFmpeg，请先安装")
        if not ffmpeg_info['has_libass']:
            raise RuntimeError("FFmpeg 不支持 libass，无法烧录字幕")
        ffmpeg_path = ffmpeg_info['path']

    # 检测字体
    if font_name is None:
        font_name = detect_available_font()

    print(f"\n🎬 烧录字幕到视频...")
    print(f"   视频: {video_path.name}")
    print(f"   字幕: {subtitle_path.name}")
    print(f"   输出: {output_path.name}")
    print(f"   字体: {font_name}")
    print(f"   字号: {font_size}, 描边: {outline}, 边距: {margin_v}")

    # 创建临时目录（解决路径空格问题）
    temp_dir = tempfile.mkdtemp(prefix='video_subtitler_')
    print(f"   临时目录: {temp_dir}")

    try:
        # 复制文件到临时目录（保留原始扩展名）
        subtitle_ext = get_subtitle_extension(subtitle_path)
        temp_video = os.path.join(temp_dir, 'video.mp4')
        temp_subtitle = os.path.join(temp_dir, f'subtitle{subtitle_ext}')
        temp_output = os.path.join(temp_dir, 'output.mp4')

        print(f"   复制文件...")
        shutil.copy(video_path, temp_video)
        shutil.copy(subtitle_path, temp_subtitle)

        # 构建字幕滤镜
        subtitle_filter = (
            f"subtitles={temp_subtitle}:"
            f"force_style='FontName={font_name},"
            f"FontSize={font_size},"
            f"PrimaryColour=&H00FFFFFF,"
            f"OutlineColour=&H00000000,"
            f"Outline={outline},"
            f"MarginV={margin_v}'"
        )

        # 构建复合视频滤镜链
        vf_filters = [subtitle_filter]

        # 获取视频高度，用于计算水印/来源字号
        video_height = get_video_height(video_path)

        # 添加水印
        if watermark_text:
            wm_fontsize = int(video_height * DEFAULT_WATERMARK_FONTSIZE_RATIO)
            wm_filter = build_drawtext_filter(
                text=watermark_text,
                position=watermark_position,
                opacity=watermark_opacity,
                font_name=font_name,
                font_size=wm_fontsize,
            )
            vf_filters.append(wm_filter)
            print(f"   水印: '{watermark_text}' ({watermark_position}, 透明度 {watermark_opacity})")

        # 添加素材来源标注
        if source_text:
            src_fontsize = int(video_height * DEFAULT_SOURCE_FONTSIZE_RATIO)
            src_filter = build_drawtext_filter(
                text=source_text,
                position=source_position,
                opacity=source_opacity,
                font_name=font_name,
                font_size=src_fontsize,
            )
            vf_filters.append(src_filter)
            print(f"   来源: '{source_text}' ({source_position}, 透明度 {source_opacity})")

        # 合并滤镜
        combined_filter = ','.join(vf_filters)

        # 构建 FFmpeg 命令（H.264 编码）
        cmd = [
            ffmpeg_path,
            '-i', temp_video,
            '-vf', combined_filter,
            '-c:v', 'libx264',
            '-crf', str(crf),
            '-preset', 'medium',
            '-c:a', 'copy',
            '-y',
            temp_output
        ]

        print(f"   执行 FFmpeg...")

        # 执行 FFmpeg
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print(f"\n❌ FFmpeg 执行失败:")
            print(result.stderr[-1000:] if len(result.stderr) > 1000 else result.stderr)
            raise RuntimeError(f"FFmpeg 失败，返回码: {result.returncode}")

        # 验证输出文件
        if not Path(temp_output).exists():
            raise RuntimeError("输出文件未创建")

        # 移动到目标位置
        print(f"   移动输出文件...")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(temp_output, output_path)

        # 显示结果
        output_size = output_path.stat().st_size
        print(f"✅ 字幕烧录完成")
        print(f"   输出文件: {output_path}")
        print(f"   文件大小: {format_file_size(output_size)}")

        return str(output_path)

    finally:
        # 清理临时目录
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
            print(f"   清理临时目录")
        except Exception:
            pass


def main():
    """命令行入口"""
    if len(sys.argv) < 4:
        print("用法: python burn_subtitles.py <视频> <字幕> <输出> [字号] [描边] [边距]")
        print("\n参数:")
        print("  视频   - 输入视频文件路径")
        print("  字幕   - 字幕文件路径（SRT/ASS）")
        print("  输出   - 输出视频文件路径")
        print(f"  字号   - 字体大小，默认 {DEFAULT_FONT_SIZE}")
        print(f"  描边   - 描边粗细，默认 {DEFAULT_OUTLINE}")
        print(f"  边距   - 底部边距，默认 {DEFAULT_MARGIN_V}")
        print("\n水印和来源标注通过 Python API 调用传入，命令行暂不支持。")
        print("  watermark_text     - 水印文字")
        print("  watermark_position - 水印位置 (top-right/top-left/bottom-right/bottom-left)")
        print("  watermark_opacity  - 水印透明度 (0.0-1.0)")
        print("  source_text        - 素材来源标注文字")
        print("  source_position    - 来源位置 (top-right/top-left/bottom-right/bottom-left)")
        print("  source_opacity     - 来源透明度 (0.0-1.0)")
        print("\n示例:")
        print("  python burn_subtitles.py video.mp4 subtitle.srt output.mp4")
        print("  python burn_subtitles.py video.mp4 subtitle.srt output.mp4 24 0.75 15")
        sys.exit(1)

    video_path = sys.argv[1]
    subtitle_path = sys.argv[2]
    output_path = sys.argv[3]
    font_size = int(sys.argv[4]) if len(sys.argv) > 4 else DEFAULT_FONT_SIZE
    outline = float(sys.argv[5]) if len(sys.argv) > 5 else DEFAULT_OUTLINE
    margin_v = int(sys.argv[6]) if len(sys.argv) > 6 else DEFAULT_MARGIN_V

    try:
        result_path = burn_subtitles(
            video_path,
            subtitle_path,
            output_path,
            font_size=font_size,
            outline=outline,
            margin_v=margin_v
        )
        print(f"\n✨ 完成！输出文件: {result_path}")

    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
