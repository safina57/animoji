"""Image utility functions."""

from io import BytesIO
from PIL import Image


def detect_image_mime_type(image_data: bytes) -> str:
    """
    Detect MIME type from image bytes.
    
    Args:
        image_data: Raw image bytes
        
    Returns:
        MIME type string (e.g., 'image/jpeg', 'image/png')
    """
    try:
        with Image.open(BytesIO(image_data)) as image:
            format_lower = image.format.lower() if image.format else 'jpeg'
            
            # Map PIL format to MIME type
            mime_map = {
                'jpeg': 'image/jpeg',
                'jpg': 'image/jpeg',
                'png': 'image/png',
            }
            
            return mime_map.get(format_lower, 'image/jpeg')
    except Exception:
        # Default to JPEG if detection fails
        return 'image/jpeg'
