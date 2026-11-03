const promptEl = document.querySelector<HTMLDivElement>("#prompt");
const dialogEl = document.querySelector<HTMLDivElement>("#dialog");
const titleEl = document.querySelector<HTMLElement>("#dialog-title");
const bodyEl = document.querySelector<HTMLElement>("#dialog-body");
const closeEl = document.querySelector<HTMLButtonElement>("#dialog-close");

export function showPrompt(text: string): void {
  if (!promptEl) return;
  promptEl.textContent = text;
  promptEl.classList.remove("hidden");
}

export function hidePrompt(): void {
  promptEl?.classList.add("hidden");
}

export function showDialog(title: string, body: string): void {
  if (!dialogEl || !titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.textContent = body;
  dialogEl.classList.remove("hidden");
}

export function hideDialog(): void {
  dialogEl?.classList.add("hidden");
}

closeEl?.addEventListener("click", hideDialog);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideDialog();
});
