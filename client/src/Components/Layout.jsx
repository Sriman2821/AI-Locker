export default function Layout({ children }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col">
      {children}
    </div>
  );
}