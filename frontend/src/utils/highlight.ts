export const getRangesAndNextTextElement = (
  span: HTMLElement | ChildNode | null,
): {
  ranges: [Range[]];
  span: HTMLElement | ChildNode | null;
} | null => {
  if (!span) return null;
  const allTextNodes = [];
  let i = 0;
  while (span && i < 5) {
    const treeWalker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
      allTextNodes.push(currentNode);
      currentNode = treeWalker.nextNode();
    }
    if (span instanceof HTMLBRElement) {
      i++;
    }
    span = span?.nextSibling;
  }

  let str = ".";
  if (allTextNodes.length < 0) return null;

  let rn = [[]] as [Range[]];
  let range_num = 0;
  allTextNodes
    .map((el) => ({ el, text: el?.textContent?.toLowerCase() }))
    .map(({ text, el }) => {
      if (!(text && el.textContent)) return;
      let startPos = 0;
      while (startPos < text.length) {
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

  return { ranges: rn, span };
};

export const highlightText = (ranges: [Range[]] | null) => {
  if (ranges && ranges.length > 0) {
    let currentRange = ranges.shift();
    while (currentRange?.length == 0) {
      currentRange = ranges.shift();
    }
    if (currentRange) {
      const searchResultsHighlight = new Highlight(...currentRange.flat());
      CSS.highlights.set("search-results", searchResultsHighlight);
    }
  }
};
