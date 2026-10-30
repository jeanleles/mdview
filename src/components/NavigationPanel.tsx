import type { LocalFile } from "@/lib/files";
import NavigationPanelClient, { type BookmarkRecord } from "./NavigationPanelClient";

interface NavigationPanelProps {
  files: LocalFile[];
  currentFileId?: string;
  bookmarks: BookmarkRecord[];
  error?: string | null;
}

export default function NavigationPanel(props: NavigationPanelProps) {
  return <NavigationPanelClient {...props} />;
}
