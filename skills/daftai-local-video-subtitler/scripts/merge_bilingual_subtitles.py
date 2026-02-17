#!/usr/bin/env python3
"""
合并中文和英文字幕为双语 SRT 文件
中文在上，英文在下
"""

import sys
import re
from pathlib import Path


def parse_srt_file(file_path):
    """解析 SRT 文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 分割字幕块
    blocks = content.strip().split('\n\n')
    subtitles = []

    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) >= 3:
            index = lines[0]
            time = lines[1]
            text = '\n'.join(lines[2:])
            subtitles.append({
                'index': index,
                'time': time,
                'text': text
            })

    return subtitles


def merge_bilingual_subtitles(primary_file, secondary_file, output_file, primary_on_top=True):
    """
    合并双语字幕
    
    Args:
        primary_file: 主字幕文件（默认显示在上方）
        secondary_file: 次字幕文件（默认显示在下方）
        output_file: 输出文件路径
        primary_on_top: 主字幕是否在上方
    """
    primary_name = Path(primary_file).name
    secondary_name = Path(secondary_file).name
    
    print(f"📝 合并双语字幕...")
    print(f"   上方字幕: {primary_name}")
    print(f"   下方字幕: {secondary_name}")

    # 解析两个字幕文件
    primary_subs = parse_srt_file(primary_file)
    secondary_subs = parse_srt_file(secondary_file)

    if len(primary_subs) != len(secondary_subs):
        print(f"⚠️  警告: 字幕数量不匹配 ({len(primary_subs)} vs {len(secondary_subs)})")

    # 合并字幕（主字幕在上，次字幕在下）
    bilingual_subs = []
    for i in range(min(len(primary_subs), len(secondary_subs))):
        if primary_on_top:
            combined_text = f"{primary_subs[i]['text']}\n{secondary_subs[i]['text']}"
        else:
            combined_text = f"{secondary_subs[i]['text']}\n{primary_subs[i]['text']}"
        
        bilingual_subs.append({
            'index': primary_subs[i]['index'],
            'time': primary_subs[i]['time'],
            'text': combined_text
        })

    # 写入双语字幕文件
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for sub in bilingual_subs:
            f.write(f"{sub['index']}\n")
            f.write(f"{sub['time']}\n")
            f.write(f"{sub['text']}\n")
            f.write("\n")

    print(f"✅ 双语字幕生成完成")
    print(f"   输出文件: {output_file}")
    print(f"   字幕条数: {len(bilingual_subs)}")
    
    return str(output_path)


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("用法: python merge_bilingual_subtitles.py <上方字幕> <下方字幕> <输出文件>")
        print("\n示例（中文在上，英文在下）:")
        print("  python merge_bilingual_subtitles.py subtitles_zh.srt subtitles_en.srt bilingual.srt")
        sys.exit(1)

    primary_file = sys.argv[1]    # 上方字幕
    secondary_file = sys.argv[2]  # 下方字幕
    output_file = sys.argv[3]

    merge_bilingual_subtitles(primary_file, secondary_file, output_file)
