export default function LoadingSpinner({ size = 'md' }) {
  const s = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
  return (
    <div className="flex justify-center items-center p-4">
      <div className={`${s} animate-spin rounded-full border-4 border-primary-500 border-t-transparent`} />
    </div>
  );
}
