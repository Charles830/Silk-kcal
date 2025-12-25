import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Keyboard } from 'lucide-react';

interface CameraViewProps {
  onImageSelected: (base64: string) => void;
  isAnalyzing: boolean;
  onShutterClick?: () => boolean;
  onManualInputClick: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onImageSelected, isAnalyzing, onShutterClick, onManualInputClick }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onImageSelected(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCamera = () => {
    if (isAnalyzing) return;
    
    // Allow parent to block access
    if (onShutterClick) {
      const canProceed = onShutterClick();
      if (!canProceed) return;
    }

    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
      if (isAnalyzing) return;
      if (onShutterClick) {
          const canProceed = onShutterClick();
          if (!canProceed) return;
      }
      galleryInputRef.current?.click();
  }

  return (
    <div className="relative h-full w-full flex flex-col bg-stone-100 overflow-hidden">
      {/* Viewfinder Area */}
      <div className="flex-1 relative overflow-hidden">
        {preview ? (
          <img 
            src={preview} 
            alt="Food preview" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-avocado-600/40 bg-avocado-50">
            <ImageIcon size={64} className="mb-4 opacity-50" />
            <p className="font-medium text-lg">准备拍照</p>
          </div>
        )}
        
        {/* Overlay Grid for aesthetics */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-full border-[20px] border-white/30 box-border"></div>
            <div className="absolute top-1/3 left-0 w-full h-px bg-white/30"></div>
            <div className="absolute top-2/3 left-0 w-full h-px bg-white/30"></div>
            <div className="absolute left-1/3 top-0 h-full w-px bg-white/30"></div>
            <div className="absolute left-2/3 top-0 h-full w-px bg-white/30"></div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      {/* Camera Input (forces camera on mobile) */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Gallery Input (allows selection) */}
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Controls Area */}
      <div className="bg-white px-6 pb-12 pt-8 rounded-t-[2rem] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex justify-center items-center relative z-10 gap-8">
        
        {/* Gallery Button */}
        <button
            onClick={triggerGallery}
            disabled={isAnalyzing}
            className={`
                w-14 h-14 rounded-full bg-stone-100 text-stone-500
                flex items-center justify-center
                transition-all duration-200
                ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-stone-200 active:scale-95'}
            `}
            aria-label="从相册选择"
        >
            <ImageIcon size={24} />
        </button>

        {/* Shutter Button */}
        <button
          onClick={triggerCamera}
          disabled={isAnalyzing}
          className={`
            relative group
            w-20 h-20 rounded-full border-4 border-avocado-200 
            flex items-center justify-center
            transition-all duration-300 ease-out
            ${isAnalyzing ? 'scale-90 opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 shadow-lg hover:shadow-avocado-200/50'}
          `}
          aria-label="拍照"
        >
           <div className={`
             absolute inset-1 rounded-full bg-avocado-600 
             flex items-center justify-center text-white
             transition-transform duration-500
             ${isAnalyzing ? 'animate-pulse' : ''}
           `}>
             {isAnalyzing ? (
               <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
             ) : (
               <Camera size={32} />
             )}
           </div>
        </button>
        
        {/* Manual Input Button */}
        <button
            onClick={onManualInputClick}
            disabled={isAnalyzing}
            className={`
                w-14 h-14 rounded-full bg-stone-100 text-stone-500
                flex items-center justify-center
                transition-all duration-200
                ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-stone-200 active:scale-95'}
            `}
            aria-label="手动输入"
        >
            <Keyboard size={24} />
        </button>

      </div>
    </div>
  );
};