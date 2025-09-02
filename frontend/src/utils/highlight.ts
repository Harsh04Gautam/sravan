export const getRangesAndNextTextElement = (
  span: HTMLElement | ChildNode | null,
  startIndex: number,
): {
  ranges: [Range[]];
  span: HTMLElement | ChildNode | null;
  text: string;
  endIndex: number;
} | null => {
  if (!span) return null;
  const allTextNodes = [];
  let text = "";
  let startIndexCopy = true;
  let lineEndChar = "";
  let i = 0;
  let maxLines = 3;
  let endIndex = 0;

  while (span && i < maxLines) {
    const treeWalker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
    let currentNode = treeWalker.nextNode();

    while (currentNode && i < maxLines) {
      allTextNodes.push(currentNode);
      let index = currentNode?.textContent?.indexOf(".") || -1;
      index > -1 && i++;
      endIndex = Math.max(index, 0);

      if (startIndexCopy) {
        text += currentNode.textContent?.slice(startIndex);
        startIndexCopy = false;
      } else if (i == maxLines && index > -1) {
        text += currentNode?.textContent?.slice(0, index + 1);
      } else {
        text += currentNode.textContent;
      }
      currentNode = treeWalker.nextNode();
    }

    if (span.textContent && span.textContent.length > 0) {
      lineEndChar = span.textContent[span?.textContent?.length - 1];
    }

    if (lineEndChar == "-" && span.textContent?.length != 0) {
      text = text.slice(0, -1);
    } else if (
      (!(span.nextSibling instanceof HTMLSpanElement) ||
        span.textContent == "" ||
        span.textContent == null) &&
      lineEndChar != "-"
    ) {
      text += " ";
    }
    if (i < maxLines) {
      span = span?.nextSibling;
    }
  }

  let str = ".";
  if (allTextNodes.length == 0) return null;

  if (span == null) {
    endIndex =
      (allTextNodes[allTextNodes.length - 1].textContent?.length || 0) - 1;
    endIndex = Math.max(endIndex, 0);
  }

  let rn = [[]] as [Range[]];
  let range_num = 0;
  allTextNodes
    .map((el) => ({ el, text: el?.textContent?.toLowerCase() }))
    .map(({ text, el }, i) => {
      if (!(text && el.textContent)) return;
      let startPos = 0;
      if (i == 0) {
        startPos = startIndex;
      }
      let end = i == allTextNodes.length - 1 ? endIndex : text.length;
      while (startPos < end) {
        const index = text.indexOf(str, startPos);
        if (index === -1) {
          const range = new Range();
          range.setStart(el, startPos);
          range.setEnd(el, el.textContent?.length);
          rn[range_num].push(range);
          break;
        }
        const range = new Range();
        range.setStart(el, startPos);
        range.setEnd(el, index);
        rn[range_num++].push(range);
        startPos = index + str.length;
        rn.push([]);
      }
    });
  if (rn[rn.length - 1].length == 0) rn.pop();
  return { ranges: rn, span, text, endIndex: endIndex + 1 };
};

export const highlightText = (range: Range[] | null) => {
  if (!range) return;
  const searchResultsHighlight = new Highlight(...range.flat());
  CSS.highlights.set("search-results", searchResultsHighlight);
};
