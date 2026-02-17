#!/usr/bin/env python3
"""
检测字幕文件的语言
支持从文件名和内容检测
"""

import sys
import re
from pathlib import Path
from typing import Optional


# 语言代码映射
LANGUAGE_CODES = {
    'zh': '中文',
    'en': '英文',
    'ja': '日文',
    'ko': '韩文',
    'fr': '法文',
    'de': '德文',
    'es': '西班牙文',
    'pt': '葡萄牙文',
    'ru': '俄文',
    'ar': '阿拉伯文',
}


def detect_from_filename(filename: str) -> Optional[str]:
    """
    从文件名检测语言
    
    Examples:
        subtitles_zh.srt -> zh
        video.en.srt -> en
        subtitle_chinese.srt -> zh
    """
    filename_lower = filename.lower()
    
    # 常见语言标识模式
    patterns = {
        'zh': [r'[._-]zh[._-]?', r'[._-]chs[._-]?', r'[._-]cht[._-]?', r'chinese', r'中文'],
        'en': [r'[._-]en[._-]?', r'[._-]eng[._-]?', r'english', r'英文'],
        'ja': [r'[._-]ja[._-]?', r'[._-]jp[._-]?', r'[._-]jpn[._-]?', r'japanese', r'日文'],
        'ko': [r'[._-]ko[._-]?', r'[._-]kor[._-]?', r'korean', r'韩文'],
        'fr': [r'[._-]fr[._-]?', r'[._-]fra[._-]?', r'french', r'法文'],
        'de': [r'[._-]de[._-]?', r'[._-]deu[._-]?', r'german', r'德文'],
        'es': [r'[._-]es[._-]?', r'[._-]spa[._-]?', r'spanish', r'西班牙文'],
    }
    
    for lang_code, lang_patterns in patterns.items():
        for pattern in lang_patterns:
            if re.search(pattern, filename_lower):
                return lang_code
    
    return None


def detect_from_content(content: str, sample_size: int = 1000) -> Optional[str]:
    """
    从内容检测语言（基于字符类型）
    
    Args:
        content: 字幕内容
        sample_size: 采样大小
    """
    # 只检查前 N 个字符
    sample = content[:sample_size]
    
    # 移除时间戳和数字
    sample = re.sub(r'\d+:\d+:\d+[,\.]\d+', '', sample)
    sample = re.sub(r'^\d+$', '', sample, flags=re.MULTILINE)
    sample = re.sub(r'-->', '', sample)
    
    # 统计各类字符
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', sample))
    japanese_chars = len(re.findall(r'[\u3040-\u309f\u30a0-\u30ff]', sample))  # 平假名 + 片假名
    korean_chars = len(re.findall(r'[\uac00-\ud7af]', sample))
    latin_chars = len(re.findall(r'[a-zA-Z]', sample))
    
    total_chars = chinese_chars + japanese_chars + korean_chars + latin_chars
    
    if total_chars == 0:
        return None
    
    # 判断语言
    if chinese_chars / total_chars > 0.3:
        return 'zh'
    elif japanese_chars / total_chars > 0.1:
        return 'ja'
    elif korean_chars / total_chars > 0.3:
        return 'ko'
    elif latin_chars / total_chars > 0.5:
        return 'en'  # 默认拉丁字符为英文
    
    return None


def detect_language(file_path: str) -> str:
    """
    检测字幕文件语言
    
    Args:
        file_path: 字幕文件路径
    
    Returns:
        str: 语言代码（如 zh、en、ja）
    """
    path = Path(file_path)
    
    print(f"🔍 检测语言: {path.name}")
    
    # 1. 先从文件名检测
    lang = detect_from_filename(path.name)
    if lang:
        print(f"   从文件名检测: {lang} ({LANGUAGE_CODES.get(lang, lang)})")
        return lang
    
    # 2. 从内容检测
    try:
        content = path.read_text(encoding='utf-8')
        lang = detect_from_content(content)
        if lang:
            print(f"   从内容检测: {lang} ({LANGUAGE_CODES.get(lang, lang)})")
            return lang
    except Exception as e:
        print(f"   读取文件失败: {e}")
    
    # 3. 默认返回未知
    print(f"   无法检测，默认: unknown")
    return 'unknown'


def main():
    if len(sys.argv) < 2:
        print("用法: python detect_language.py <字幕文件>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    lang = detect_language(file_path)
    print(f"\n语言代码: {lang}")


if __name__ == "__main__":
    main()
