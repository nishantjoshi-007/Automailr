/** Shared class strings for the wizard (reference `.card`, `.drop`, `.linkish`, `.chip`…). */
export const card = "rounded-[18px] border border-line bg-surface";
export const cardTitle = "font-display text-[1.1rem] font-[750] font-stretch-[104%] tracking-[-0.01em]";
export const dropZone =
  "grid w-full justify-items-center gap-2 rounded-md border-[1.5px] border-dashed border-line-strong px-4 text-center text-[15px] text-ink-2 transition-colors duration-150 hover:border-accent-ink";
export const dropOver = "border-accent bg-accent-soft";
export const linkish = "font-semibold text-accent-ink underline underline-offset-[3px]";
export const chip =
  "inline-flex min-h-9 items-center rounded-sm border border-line bg-surface px-3 font-mono text-[13.5px] text-ink-2 transition-[background-color,border-color,color] duration-150";
export const chipActive = "border-accent-hover bg-accent-soft text-accent-ink";
export const lbl = "mb-2 block text-[14.5px] font-semibold text-ink";
export const lblSm = "mb-2.5 block text-[13.5px] text-ink-3";
export const hint = "text-[14px] text-ink-3";
export const seg = "inline-flex rounded-[11px] border border-line bg-surface-2 p-[3px]";
export const segBtn =
  "rounded-[8px] px-3.5 py-[7px] text-[14px] font-[550] text-ink-2 transition-colors duration-150 aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-[0_0_0_1px_var(--color-line),0_1px_2px_oklch(0.2_0.012_220/0.08)]";
/** The space between the stepper and the bottom bar, with its one card centred both ways (`.stage`). */
export const stage = "grid flex-1 place-items-center pb-8 [&>*]:w-full";
