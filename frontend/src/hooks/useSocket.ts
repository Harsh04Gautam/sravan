import { useRef } from "react";

export const useSocket = () => {
  const socket = useRef(new WebSocket("ws://localhost:8000/kokoro"));
  const spanRef = useRef<HTMLElement | ChildNode>(null);
  let ranges: [Range[]] | null = null;
  let lastTime = Date.now();

  socket.current.addEventListener("message", async (event) => {
    const array = await event.data.arrayBuffer();
    const data = new Float32Array(array);
    const audioContext = new AudioContext();
    const audioBuffer = audioContext.createBuffer(2, data.length, 24000);

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      audioBuffer.copyToChannel(data, channel);
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    setTimeout(() => {
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

      source.start();
      source.stop;

      if (ranges && ranges?.length < 5) sendText(spanRef.current);
    }, lastTime - Date.now());

    lastTime =
      Date.now() +
      Math.max(lastTime - Date.now(), 0) +
      audioBuffer.duration * 1000;
  });

  const getRanges = (
    spanRef: React.RefObject<HTMLElement | ChildNode | null>,
  ): [Range[]] | null => {
    if (!spanRef.current) return null;
    const allTextNodes = [];
    let i = 0;
    while (spanRef.current && i < 5) {
      const treeWalker = document.createTreeWalker(
        spanRef.current,
        NodeFilter.SHOW_TEXT,
      );
      let currentNode = treeWalker.nextNode();
      while (currentNode) {
        allTextNodes.push(currentNode);
        currentNode = treeWalker.nextNode();
      }
      if (spanRef.current instanceof HTMLBRElement) {
        i++;
      }
      spanRef.current = spanRef.current?.nextSibling as HTMLElement;
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
        // rn.push([]);
      });

    return rn;
  };

  const sendText = (span: HTMLSpanElement | ChildNode | null) => {
    let text = "";
    let lines = 0;
    let currentSpan = span;
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

    if (!socket.current) return;
    spanRef.current = span;
    if (ranges) {
      //  @ts-ignore
      ranges = [...ranges, ...getRanges(spanRef)];
    } else {
      ranges = getRanges(spanRef);
    }
    socket.current.send(text);
  };

  return { socket, sendText };
};
