import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { 
  ImagePlus, 
  X, 
  Loader2,
  ZoomIn,
  Trash2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { filesAPI } from '../services/api';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Reusable component for uploading reference images
 * Used in Equipment, Safety Precautions, and SOP Steps
 */
export const ReferenceImageUpload = ({ 
  imageUrl, 
  onImageChange, 
  category, // 'equipment', 'safety', or 'sop_step'
  testId = '',
  disabled = false,
  size = 'default' // 'default' or 'small'
}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await filesAPI.uploadTestDefinitionImage(file, category, testId);
      onImageChange(result.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!imageUrl) return;

    try {
      await filesAPI.deleteTestDefinitionImage(imageUrl);
      onImageChange(null);
      toast.success('Image removed');
    } catch (error) {
      console.error('Delete error:', error);
      // Still remove from UI even if delete fails
      onImageChange(null);
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  const isSmall = size === 'small';

  if (imageUrl) {
    return (
      <>
        <div className={`relative group ${isSmall ? 'w-12 h-12' : 'w-20 h-20'}`}>
          <img
            src={getFullImageUrl(imageUrl)}
            alt="Reference"
            className="w-full h-full object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setPreviewOpen(true)}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={() => setPreviewOpen(true)}
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-red-500/50"
              onClick={handleRemoveImage}
              disabled={disabled}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Image Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reference Image</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={getFullImageUrl(imageUrl)}
                alt="Reference"
                className="max-h-[70vh] object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        variant="outline"
        size={isSmall ? 'icon' : 'sm'}
        className={isSmall ? 'h-8 w-8' : 'h-8 gap-1'}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        title="Add reference image"
      >
        {isUploading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <ImagePlus className="w-3 h-3" />
            {!isSmall && <span className="text-xs">Add Image</span>}
          </>
        )}
      </Button>
    </>
  );
};

/**
 * Component for multiple reference images (used in SOP Steps)
 * Allows up to 5 images per step
 */
export const MultipleReferenceImages = ({
  images = [],
  onImagesChange,
  category = 'sop_step',
  testId = '',
  disabled = false,
  maxImages = 5
}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await filesAPI.uploadTestDefinitionImage(file, category, testId);
      onImagesChange([...images, result.url]);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (index) => {
    const imageUrl = images[index];
    try {
      await filesAPI.deleteTestDefinitionImage(imageUrl);
    } catch (error) {
      console.error('Delete error:', error);
    }
    // Remove from array regardless of delete success
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 items-center">
        {images.map((url, index) => (
          <div key={index} className="relative group w-16 h-16">
            <img
              src={getFullImageUrl(url)}
              alt={`Reference ${index + 1}`}
              className="w-full h-full object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setPreviewImage(url)}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-white hover:bg-white/20"
                onClick={() => setPreviewImage(url)}
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-white hover:bg-red-500/50"
                onClick={() => handleRemoveImage(index)}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {images.length < maxImages && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-16 w-16 flex-col gap-1 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-[10px]">{images.length}/{maxImages}</span>
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reference Image</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {previewImage && (
              <img
                src={getFullImageUrl(previewImage)}
                alt="Reference"
                className="max-h-[70vh] object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferenceImageUpload;
