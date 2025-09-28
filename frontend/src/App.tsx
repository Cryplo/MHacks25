import { Shell } from "./components/Shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";

function App() {
  const [tabs, setTabs] = useState<{ id: string; name: string }[]>([
    { id: "1", name: "Tab 1" },
    { id: "2", name: "Tab 2" },
  ]);
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Tabs defaultValue="1" className="w-screen h-screen p-2">
        <TabsList className="h-16">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="w-32">
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <Shell shellId={tab.id} />
          </TabsContent>
        ))}
      </Tabs>
    </ThemeProvider>
  );
}

export default App;
