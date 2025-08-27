export const readPdfText = (span: Readonly<HTMLSpanElement | ChildNode>) => {
  let text = "";
  let lines = 0;
  let currentSpan: HTMLSpanElement | ChildNode | null = span;
  while (lines < 5) {
    if (!currentSpan) break;
    if (currentSpan instanceof HTMLSpanElement) {
      text += currentSpan.textContent;
      currentSpan = currentSpan.nextSibling;
    } else if (currentSpan instanceof HTMLBRElement) {
      lines++;
      currentSpan = currentSpan.nextSibling;
      text += " ";
    } else if (currentSpan instanceof HTMLElement) {
      currentSpan = currentSpan.nextSibling;
    } else break;
  }
  return text;
};
