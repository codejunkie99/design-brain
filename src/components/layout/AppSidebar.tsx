import { useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  Home,
  Network,
  Palette,
  Search,
  Settings,
  LayoutGrid,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", icon: Home, path: "/" },
  { title: "Capture", icon: Camera, path: "/capture" },
  { title: "Knowledge Graph", icon: Network, path: "/knowledge" },
  { title: "Design Tokens", icon: Palette, path: "/tokens" },
  { title: "Moodboard", icon: LayoutGrid, path: "/moodboard" },
  { title: "Search", icon: Search, path: "/search" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-5 w-5 rounded-full bg-cobalt" />
            <div className="h-2 w-2 rounded-full bg-cobalt" />
          </div>
          <span className="text-lg font-bold tracking-tight text-indigo">
            Design Brain
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs lowercase text-muted-foreground">
            navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={location.pathname === "/settings"}
              onClick={() => navigate("/settings")}
              tooltip="Settings"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
