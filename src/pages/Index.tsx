
import Chat from "@/components/Chat";
import { ThemeProvider } from "@/components/ThemeProvider";

const Index = () => {
  return (
    <ThemeProvider defaultTheme="system">
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <Chat />
      </div>
    </ThemeProvider>
  );
};

export default Index;
