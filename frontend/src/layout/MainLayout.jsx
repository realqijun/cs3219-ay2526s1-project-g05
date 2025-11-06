import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

function MainLayout({ children }) {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Navbar />
      <div className="h-full overflow-y-auto pb-10">{children}</div>
    </div>
  );
}

export default MainLayout;
