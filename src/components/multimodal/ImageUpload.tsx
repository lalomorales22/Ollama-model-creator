/**
 * Image Upload Component
 * 
 * Drag-and-drop image upload with preview for multimodal conversations
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, X, Upload, Clipboard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 4,
  disabled = false 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Remove the data URL prefix to get just the base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  const addImages = useCallback(async (files: FileList | File[]) => {
    if (disabled || images.length >= maxImages) return;

    setIsProcessing(true);
    const fileArray = Array.from(files);
    const remaining = maxImages - images.length;
    const toProcess = fileArray.slice(0, remaining);

    const newImages: string[] = [];
    for (const file of toProcess) {
      const base64 = await processFile(file);
      if (base64) {
        newImages.push(base64);
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
    setIsProcessing(false);
  }, [disabled, images, maxImages, onImagesChange, processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addImages(e.dataTransfer.files);
    }
  }, [addImages]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImages(e.target.files);
    }
    // Reset input
    e.target.value = '';
  }, [addImages]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], 'pasted-image.png', { type });
            addImages([file]);
            return;
          }
        }
      }
    } catch (err) {
      // Clipboard API not available or no image
      console.log('No image in clipboard');
    }
  }, [addImages]);

  const removeImage = useCallback((index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  }, [images, onImagesChange]);

  const clearAll = useCallback(() => {
    onImagesChange([]);
  }, [onImagesChange]);

  if (images.length === 0 && !disabled) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 transition-all",
          isDragging 
            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" 
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center gap-2 py-2">
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          ) : (
            <>
              <div className="flex items-center gap-2 text-gray-400">
                <Upload className="w-5 h-5" />
                <span className="text-sm">Drop images here or</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-black dark:border-gray-700"
                  disabled={disabled}
                >
                  <Image className="w-4 h-4 mr-1" />
                  Browse
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePaste}
                  className="border-2 border-black dark:border-gray-700"
                  disabled={disabled}
                >
                  <Clipboard className="w-4 h-4 mr-1" />
                  Paste
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Max {maxImages} images
              </p>
            </>
          )}
        </div>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-purple-500/10 rounded-lg flex items-center justify-center"
            >
              <p className="text-purple-600 dark:text-purple-400 font-semibold">
                Drop to add
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Image previews */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {images.map((base64, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group"
            >
              <div className="w-20 h-20 rounded-lg border-2 border-black dark:border-gray-700 overflow-hidden">
                <img
                  src={`data:image/jpeg;base64,${base64}`}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {!disabled && (
                <button
                  onClick={() => removeImage(index)}
                  className={cn(
                    "absolute -top-2 -right-2 w-5 h-5 rounded-full",
                    "bg-red-500 text-white flex items-center justify-center",
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    "hover:bg-red-600"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add more button */}
        {!disabled && images.length < maxImages && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700",
              "flex items-center justify-center hover:border-purple-500 transition-colors"
            )}
          >
            <Upload className="w-5 h-5 text-gray-400" />
          </motion.button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Actions */}
      {!disabled && images.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Clear all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePaste}
            className="text-xs"
          >
            <Clipboard className="w-3 h-3 mr-1" />
            Paste
          </Button>
        </div>
      )}
    </div>
  );
}
