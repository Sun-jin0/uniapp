#!/usr/bin/env python3
"""Generate PNG icons for checkin page"""

import os
from PIL import Image, ImageDraw

def create_icon(size, draw_func, color=(102, 126, 234), bg_color=None):
    """Create an icon with given size and draw function"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0) if bg_color is None else bg_color)
    draw = ImageDraw.Draw(img)
    draw_func(draw, size, color)
    return img

def draw_back_arrow(draw, size, color):
    """Draw back arrow icon"""
    margin = size // 4
    x1, y1 = margin, size // 2
    x2, y2 = size - margin, margin
    x3, y3 = size - margin, size - margin
    draw.polygon([(x1, y1), (x2, y2), (x3, y3)], fill=color)

def draw_user(draw, size, color):
    """Draw user icon"""
    center = size // 2
    head_radius = size // 5
    body_width = size // 3
    body_height = size // 4
    
    # Head
    draw.ellipse([center - head_radius, size // 6, 
                  center + head_radius, size // 6 + head_radius * 2], 
                 outline=color, width=2)
    
    # Body
    draw.arc([center - body_width, size // 2,
              center + body_width, size // 2 + body_height * 2],
             start=0, end=180, fill=color, width=2)

def draw_clock(draw, size, color):
    """Draw clock icon"""
    center = size // 2
    radius = size // 2 - 4
    
    # Circle
    draw.ellipse([center - radius, center - radius,
                  center + radius, center + radius],
                 outline=color, width=2)
    
    # Hands
    draw.line([(center, center), (center, center - radius + 6)], fill=color, width=2)
    draw.line([(center, center), (center + radius - 8, center)], fill=color, width=2)

def draw_heart(draw, size, color):
    """Draw heart icon"""
    # Simplified heart using polygon
    center = size // 2
    points = [
        (center, size - 4),
        (4, size // 3),
        (center - size // 4, 4),
        (center, size // 3),
        (center + size // 4, 4),
        (size - 4, size // 3),
    ]
    draw.polygon(points, fill=color)

def draw_heart_outline(draw, size, color):
    """Draw heart outline icon"""
    center = size // 2
    margin = 4
    
    # Draw heart outline
    points = [
        (center, size - margin),
        (margin, size // 3),
        (center - size // 4, margin),
        (center, size // 3),
        (center + size // 4, margin),
        (size - margin, size // 3),
    ]
    draw.polygon(points, outline=color, fill=None)

def draw_comment(draw, size, color):
    """Draw comment icon"""
    margin = 4
    
    # Bubble body
    draw.rounded_rectangle([margin, margin, size - margin, size - margin - 4],
                           radius=4, outline=color, width=2)
    
    # Tail
    points = [(size // 3, size - margin - 4),
              (size // 3, size - margin),
              (size // 3 + 6, size - margin - 4)]
    draw.polygon(points, fill=color)

def draw_check(draw, size, color):
    """Draw check icon"""
    margin = 6
    # Check mark
    draw.line([(margin, size // 2), (size // 2 - 2, size - margin)], fill=color, width=3)
    draw.line([(size // 2 - 2, size - margin), (size - margin, margin)], fill=color, width=3)

def draw_close(draw, size, color):
    """Draw close icon"""
    margin = 6
    draw.line([(margin, margin), (size - margin, size - margin)], fill=color, width=2)
    draw.line([(size - margin, margin), (margin, size - margin)], fill=color, width=2)

def draw_plus(draw, size, color):
    """Draw plus icon"""
    center = size // 2
    margin = 8
    draw.line([(center, margin), (center, size - margin)], fill=color, width=2)
    draw.line([(margin, center), (size - margin, center)], fill=color, width=2)

def draw_book(draw, size, color):
    """Draw book icon"""
    margin = 4
    # Book cover
    draw.rectangle([margin, margin, size - margin, size - margin], outline=color, width=2)
    # Book spine
    draw.line([(size // 2, margin), (size // 2, size - margin)], fill=color, width=2)
    # Pages
    draw.line([(size // 2 + 2, margin + 4), (size // 2 + 2, size - margin - 4)], fill=color, width=1)

def main():
    output_dir = "f:\\Code\\uniapp\\demo\\uni-preset-vue-vite-mp-weixin\\src\\static\\icons"
    
    icons = {
        'back.png': (draw_back_arrow, (255, 255, 255)),
        'user.png': (draw_user, (255, 255, 255)),
        'clock.png': (draw_clock, (153, 153, 153)),
        'heart.png': (draw_heart, (255, 107, 107)),
        'heart-outline.png': (draw_heart_outline, (153, 153, 153)),
        'comment.png': (draw_comment, (153, 153, 153)),
        'check.png': (draw_check, (255, 255, 255)),
        'close.png': (draw_close, (153, 153, 153)),
        'plus.png': (draw_plus, (153, 153, 153)),
        'book.png': (draw_book, (255, 152, 0)),
    }
    
    size = 48  # Icon size
    
    for filename, (draw_func, color) in icons.items():
        img = create_icon(size, draw_func, color)
        img.save(os.path.join(output_dir, filename))
        print(f"Generated: {filename}")
    
    print("All icons generated successfully!")

if __name__ == '__main__':
    main()
