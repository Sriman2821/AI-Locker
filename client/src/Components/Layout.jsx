export default function Layout({ children }) {
  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col overflow-auto">
      {children}
    </div>
  );
}