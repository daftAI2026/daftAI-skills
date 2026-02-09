#!/usr/bin/env python3
"""
将 VTT 字幕转换为 SRT 格式
"""

import sys
import re
from pathlib import Path


def vtt_to_srt(vtt_path: str, srt_path: str) -> str:
    """
    将 VTT 字幕转换为 SRT 格式
    """
    vtt_path = Path(vtt_path)
    srt_path = Path(srt_path)
    
    if not vtt_path.exists():
        raise FileNotFoundError(f"VTT file not found: {vtt_path}")
    
    print(f"🔄 转换 VTT → SRT...")
    print(f"   输入: {vtt_path}")
    print(f"   输出: {srt_path}")
    
    with open(vtt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 分割成块
    blocks = content.strip().split('\n\n')
    
    srt_blocks = []
    index = 1
    
    for block in blocks:
        lines = block.strip().split('\n')
        
        # 跳过 WEBVTT 头部和元数据
        if any(line.startswith(('WEBVTT', 'Kind:', 'Language:', 'X-TIMESTAMP')) for line in lines):
            continue
        
        # 查找时间戳
        timestamp_line = None
        timestamp_idx = -1
        
        for idx, line in enumerate(lines):
            if '-->' in line:
                timestamp_line = line
                timestamp_idx = idx
                break
        
        if timestamp_line is None:
            continue
        
        # 获取文本（时间戳之后的所有行）
        text_lines = []
        for line in lines[timestamp_idx + 1:]:
            # 移除 VTT 样式标签
            clean_line = re.sub(r'<[^>]+>', '', line).strip()
            if clean_line:
                text_lines.append(clean_line)
        
        if not text_lines:
            continue
        
        # 转换时间戳格式
        # VTT: 00:00:00.000 --> 00:00:03.500
        # SRT: 00:00:00,000 --> 00:00:03,500
        
        # 先移除位置信息 (如 align:start position:0%)，在替换点号之前
        srt_timestamp = re.sub(r'\s+(align|position|line|size|vertical):\S+', '', timestamp_line)
        # 再替换点号为逗号
        srt_timestamp = srt_timestamp.replace('.', ',').strip()
        
        # 构建 SRT 块
        srt_block = f"{index}\n{srt_timestamp}\n" + '\n'.join(text_lines)
        srt_blocks.append(srt_block)
        index += 1
    
    # 写入 SRT 文件
    srt_path.parent.mkdir(parents=True, exist_ok=True)
    with open(srt_path, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(srt_blocks) + '\n')
    
    print(f"✅ 转换完成，共 {index - 1} 条字幕")
    return str(srt_path)


def main():
    if len(sys.argv) < 3:
        print("用法: python convert_vtt_to_srt.py <input.vtt> <output.srt>")
        sys.exit(1)
    
    vtt_path = sys.argv[1]
    srt_path = sys.argv[2]
    
    try:
        result = vtt_to_srt(vtt_path, srt_path)
        print(f"\n✨ 完成！输出文件: {result}")
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
