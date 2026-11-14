import { act, fireEvent, render, screen } from "@testing-library/react";
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
    document.documentElement.classList.remove("dark");
    window.localStorage.clear();
  });

  it("exibe progresso e arquivo atual sem botoes sequenciais de navegacao", () => {
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
    expect(screen.queryByText("Arquivo Anterior")).not.toBeInTheDocument();
    expect(screen.queryByText("Próximo Arquivo")).not.toBeInTheDocument();
  });

  it("exibe o nome completo do arquivo como hint", () => {
    render(<NavigationPanelClient files={files} bookmarks={[]} />);

    expect(screen.getByText("Apostila B.md")).toHaveAttribute(
      "title",
      "Apostila B.md"
    );
  });

  it("mostra estado vazio sem progresso persistido como zero", () => {
    render(<NavigationPanelClient files={[]} bookmarks={[]} />);
    expect(screen.getByText("Nenhum arquivo encontrado")).toBeInTheDocument();
  });

  it("atualiza o percentual da sidebar em tempo real", () => {
    render(<NavigationPanelClient files={files} bookmarks={[]} />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("mdview:bookmark-progress", {
          detail: { fileId: "file-b", scrollPercent: 73 },
        })
      );
    });

    expect(screen.getByText("73%")).toBeInTheDocument();
  });

  it("exibe upload e sair como ações apenas com ícones", () => {
    render(<NavigationPanelClient files={files} bookmarks={[]} />);

    const uploadButton = screen.getByRole("button", {
      name: "Enviar arquivo Markdown",
    });
    const themeButton = screen.getByRole("button", { name: "Ativar modo escuro" });
    const logoutButton = screen.getByRole("button", { name: "Sair" });

    expect(uploadButton.querySelector("svg")).toBeInTheDocument();
    expect(logoutButton.querySelector("svg")).toBeInTheDocument();
    expect(uploadButton).not.toHaveTextContent("Enviar arquivo Markdown");
    expect(logoutButton).not.toHaveTextContent("Sair");
    expect(
      Array.from(
        screen
          .getByRole("complementary", { name: "Painel de navegação" })
          .querySelectorAll("button")
      )
        .slice(0, 3)
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Enviar arquivo Markdown", "Ativar modo escuro", "Sair"]);
    expect(uploadButton.parentElement).toBe(themeButton.parentElement);
    expect(themeButton.parentElement).toBe(logoutButton.parentElement);
  });

  it("alterna e persiste o tema entre claro e escuro", () => {
    render(<NavigationPanelClient files={files} bookmarks={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Ativar modo escuro" }));

    expect(document.documentElement.classList).toContain("dark");
    expect(window.localStorage.getItem("mdview-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Ativar modo claro" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ativar modo claro" }));

    expect(document.documentElement.classList).not.toContain("dark");
    expect(window.localStorage.getItem("mdview-theme")).toBe("light");
  });

  it("abre e fecha o drawer mobile", () => {
    render(<NavigationPanelClient files={files} bookmarks={[]} />);

    const openButton = screen.getByRole("button", { name: "Abrir painel de navegação" });
    expect(openButton.querySelector("svg")).toBeInTheDocument();
    expect(openButton).not.toHaveTextContent("Menu");
    fireEvent.click(openButton);
    expect(screen.getByRole("complementary", { name: "Painel de navegação" })).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: "Fechar painel" });
    expect(closeButton.querySelector("svg")).toBeInTheDocument();
    expect(closeButton).not.toHaveTextContent("Fechar");
    fireEvent.click(closeButton);

    fireEvent.click(screen.getByRole("button", { name: "Abrir painel de navegação" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar painel tocando fora" }));
  });
});
