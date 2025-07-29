/**
 * Utility functions for handling and debugging image data
 */

/**
 * Validate if a base64 string is a valid image
 */
export const validateImageBase64 = (base64Data, mimeType) => {
  try {
    // Check if base64 is valid format
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(base64Data)) {
      return { valid: false, error: 'Invalid base64 format' };
    }

    // Check mime type
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(mimeType)) {
      return { valid: false, error: 'Unsupported image type' };
    }

    // Check base64 size (approximate file size)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (sizeInBytes > maxSize) {
      return { valid: false, error: 'Image too large' };
    }

    return { valid: true, size: sizeInBytes };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Create a data URL from base64 and mime type
 */
export const createDataUrl = (base64Data, mimeType) => {
  return `data:${mimeType};base64,${base64Data}`;
};

/**
 * Extract metadata from image file
 */
export const getImageMetadata = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        displaySize: `${img.naturalWidth}x${img.naturalHeight}`
      });
    };
    
    img.onerror = () => {
      resolve({
        width: 0,
        height: 0,
        aspectRatio: 1,
        displaySize: 'Unknown'
      });
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Compress image if it's too large
 */
export const compressImage = (file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Debug image processing
 */
export const debugImageProcessing = (images) => {
  console.group('🖼️ Image Processing Debug');
  
  images.forEach((image, index) => {
    console.log(`Image ${index + 1}:`, {
      name: image.name,
      type: image.type,
      size: `${(image.size / 1024).toFixed(2)} KB`,
      base64Length: image.base64?.length || 0,
      base64Sample: image.base64?.substring(0, 50) + '...',
      hasDataUrl: !!image.dataUrl
    });
    
    const validation = validateImageBase64(image.base64, image.type);
    if (!validation.valid) {
      console.error(`❌ Image ${index + 1} validation failed:`, validation.error);
    } else {
      console.log(`✅ Image ${index + 1} is valid`);
    }
  });
  
  console.groupEnd();
};
