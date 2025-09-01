import { useRef } from "react";
import { getAudioSource } from "../utils/audio";
import { getRangesAndNextTextElement, highlightText } from "../utils/highlight";

interface Audio {
  getNewSource: () => AudioBufferSourceNode;
  duration: number;
}

export const useSocket = (getNextPage: () => void) => {
  const socket = useRef<WebSocket>(null);
  const play = useRef(false);
  const free = useRef(true);
  const htmlTextElement = useRef<HTMLElement | ChildNode>(null);
  const ranges = useRef<[Range[]]>(null);
  const currentAudio = useRef<{
    audio: Audio;
    range: Range[];
    timeoutId: number | null;
    offset: number;
    startTime: number;
    source: AudioBufferSourceNode | null;
  }>(null);
  const audioQueue = useRef(new Array<Audio>());
  const audioEventSetup = useRef(new Event("setup-next"));

  const playPause = (play: boolean) => {
    if (
      ranges.current &&
      ranges.current?.length < 10 &&
      htmlTextElement.current
    ) {
      sendText(htmlTextElement.current, false);
    }

    if (!currentAudio.current) {
      return;
    }
    if (play) {
      const { audio, range, offset } = currentAudio.current;
      if (!audio || !range) return;
      highlightText(range);
      currentAudio.current.source = audio.getNewSource();
      currentAudio.current.source.start(0, offset / 1000);
      currentAudio.current.startTime = Date.now() - offset;
      currentAudio.current.timeoutId = setTimeout(() => {
        free.current = true;
        if (
          // @ts-ignore
          ranges.current?.length == 0 &&
          htmlTextElement.current == null
        ) {
          getNextPage();
        }
        window.dispatchEvent(audioEventSetup.current);
      }, audio.duration - offset);
    } else {
      if (!currentAudio.current) return;
      const { timeoutId, startTime, source } = currentAudio.current;
      source && source.stop();
      currentAudio.current.offset = Date.now() - startTime;
      timeoutId && clearTimeout(timeoutId);
    }
  };

  const setupNext = () => {
    if (!(play.current && free.current)) return;
    const audio = audioQueue.current.shift();
    if (!audio) return;
    let range = ranges.current?.shift();
    if (!range) return;
    free.current = false;
    currentAudio.current = {
      audio,
      range,
      timeoutId: null,
      startTime: Date.now(),
      offset: 0,
      source: null,
    };
    playPause(play.current);
  };

  window.addEventListener("setup-next", setupNext);

  const handleMessage = async (event: MessageEvent<any>) => {
    const { getNewSource, duration } = await getAudioSource(event.data);
    audioQueue.current.push({ getNewSource, duration });
    if (play.current && free.current) {
      window.dispatchEvent(audioEventSetup.current);
    }
  };

  const sendText = (
    element: HTMLElement | ChildNode | null,
    newSocket: boolean,
  ) => {
    if (newSocket) {
      playPause(false);
      free.current = true;
      ranges.current = null;
      currentAudio.current = null;
      audioQueue.current = new Array<Audio>();
      currentAudio.current = null;
      ranges.current = null;
      socket.current?.removeEventListener("message", handleMessage);
      socket.current?.close();
      window.removeEventListener("setup-next", setupNext);
      socket.current = new WebSocket("ws://localhost:8000/kokoro");
      socket.current.addEventListener("message", handleMessage);
    }

    if (!socket.current) return;
    let result = getRangesAndNextTextElement(element);
    if (!result) return;
    // skip blank pages
    if (
      element?.textContent == "" &&
      result?.text == "" &&
      result.span == null &&
      //  @ts-ignore
      result.ranges.length == 0 &&
      audioQueue.current.length == 0 &&
      //  @ts-ignore
      ranges.current?.length == 0
    ) {
      getNextPage();
      return;
    }
    htmlTextElement.current = result?.span || null;
    if (
      ranges.current &&
      ranges.current?.length > 0 &&
      ranges?.current[0].length > 0
    ) {
      //  @ts-ignore
      ranges.current = [...ranges.current, ...result.ranges];
    } else {
      ranges.current = result?.ranges || null;
    }
    if (socket.current.readyState != socket.current.OPEN) {
      socket.current.onopen = () => {
        socket.current?.send(result?.text);
      };
    } else {
      socket.current.send(result?.text);
    }
  };

  return { socket, sendText, play, playPause };
};
