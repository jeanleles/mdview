import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NavigationPanelClient from "../NavigationPanelClient";
import type { LocalFile } from "@/lib/files";

let pathname = "/files/file-b";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const files: LocalFile[] = [
  { id: "file-a", name: "Apostila A.md", mimeType: "text/markdown", modifiedTime: "", size: 100 },
  { id: "file-b", name: "Apostila B.md", mimeType: "text/markdown", modifiedTime: "", size: 100 },
  { id: "file-c", name: "Apostila C.md", mimeType: "text/markdown", modifiedTime: "", size: 100 },
];

describe("NavigationPanelClient", () => {
  beforeEach(() => {
    pathname = "/files/file-b";
  });

  it("exibe progresso, arquivo atual e dois botoes de navegacao", () => {
    render(
      <NavigationPanelClient
        files={files}
        bookmarks={[
          { fileId: "file-a", scrollPercent: 25 },
          { fileId: "file-b", scrollPercent: 50 },
        ]}
      />
    );

    expect(screen.getAllByText("25%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
    expect(screen.getByText("Apostila B.md").closest("a")).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByText("Arquivo Anterior").closest("a")).toHaveAttribute(
      "href",
      "/files/file-a"
    );
    expect(screen.getByText("Próximo Arquivo").closest("a")).toHaveAttribute(
      "href",
      "/files/file-c"
    );
  });

  it("mostra estado vazio sem progresso persistido como zero", () => {
    render(<NavigationPanelClient files={[]} bookmarks={[]} />);
    expect(screen.getByText("Nenhum arquivo encontrado")).toBeInTheDocument();
  });

  it("abre e fecha o drawer mobile", () => {
    render(<NavigationPanelClient files={files} bookmarks={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir painel de navegação" }));
    expect(screen.getByRole("complementary", { name: "Painel de navegação" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fechar painel" }));

    fireEvent.click(screen.getByRole("button", { name: "Abrir painel de navegação" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar painel tocando fora" }));
  });
});
