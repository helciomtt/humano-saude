'use client';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div
        className={`${sizes[size]} animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent`}
      />
    </div>
  );
}

interface PageLoadingProps {
  text?: string;
}

export function PageLoading({ text }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
      {text && <p className="mt-4 text-sm text-gray-500">{text}</p>}
    </div>
  );
}
