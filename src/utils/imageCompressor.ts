export const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      let quality = 0.9;
      const step = 0.1;
      
      const compress = () => {
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          if (blob.size <= 204800 || quality <= 0.1) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            quality -= step;
            compress();
          }
        }, 'image/jpeg', quality);
      };
      
      compress();
    };
    
    img.onerror = () => resolve(file);
    img.src = url;
  });
};