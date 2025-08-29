import { useEffect, useRef, useState } from "react";
import { getAudioSource } from "../utils/audio";
import { getRangesAndNextTextElement, highlightText } from "../utils/highlight";
import { readPdfText } from "../utils/readText";

interface Audio {
  getNewSource: () => AudioBufferSourceNode;
  duration: number;
}

export const useSocket = () => {
  const socket = useRef<WebSocket>(null);
  const sendText =
    useRef<(span: Readonly<HTMLElement | ChildNode | null>) => void>(null);
  const [play, setPlay] = useState(false);
  const [free, setFree] = useState(true);
  const htmlTextElement = useRef<HTMLElement | ChildNode>(null);
  const ranges = useRef<[Range[]]>(null);
  const refresh = useRef(true);
  const currentAudio = useRef<{
    audio: Audio;
    range: Range[];
    timeoutId: number | null;
    offset: number;
    startTime: number;
    source: AudioBufferSourceNode | null;
  }>(null);

  const audioQueue = useRef(new Array<Audio>());
  const audioEvent = useRef(new Event("play-next"));

  useEffect(() => {
    if (
      ranges.current &&
      ranges.current?.length < 10 &&
      sendText.current &&
      htmlTextElement.current
    ) {
      sendText.current(htmlTextElement.current);
    }

    if (!currentAudio.current) return;
    if (play) {
      const { audio, range, offset } = currentAudio.current;
      if (!audio || !range) return;
      highlightText(range);
      currentAudio.current.source = audio.getNewSource();
      currentAudio.current.source.start(0, offset / 1000);
      currentAudio.current.startTime = Date.now() - offset;
      currentAudio.current.timeoutId = setTimeout(() => {
        setFree(true);
        window.dispatchEvent(audioEvent.current);
      }, audio.duration - offset);
    } else {
      if (!currentAudio.current) return;
      const { timeoutId, startTime, source } = currentAudio.current;
      source && source.stop();
      currentAudio.current.offset = Date.now() - startTime;
      timeoutId && clearTimeout(timeoutId);
    }
  }, [currentAudio.current, play]);

  useEffect(() => {
    const wsCurrent = new WebSocket("ws://localhost:8000/kokoro");
    socket.current = wsCurrent;

    return () => {
      wsCurrent?.close();
    };
  }, []);

  useEffect(() => {
    if (!socket.current) return;

    const playNext = () => {
      if (!play || !free) return;
      const audio = audioQueue.current.shift();
      if (!audio) return;
      const range = ranges.current?.shift();
      if (!range) return;
      setFree(false);
      currentAudio.current = {
        audio,
        range,
        timeoutId: null,
        startTime: Date.now(),
        offset: 0,
        source: null,
      };
    };

    const handleMessage = async (event: MessageEvent<any>) => {
      const { getNewSource, duration } = await getAudioSource(event.data);
      audioQueue.current.push({ getNewSource, duration });
      if (play && free) {
        window.dispatchEvent(audioEvent.current);
      }
    };

    window.addEventListener("play-next", playNext);
    socket.current && socket.current.addEventListener("message", handleMessage);

    sendText.current = (span: Readonly<HTMLElement | ChildNode | null>) => {
      if (!span) return;
      const text = readPdfText(span);

      if (!socket) return;
      let result = getRangesAndNextTextElement(span);
      htmlTextElement.current = result?.span || null;
      if (ranges.current) {
        //  @ts-ignore
        ranges.current = [...ranges.current, ...result.ranges];
      } else {
        ranges.current = result?.ranges || null;
      }
      if (!socket.current) return;
      if (socket.current.readyState != socket.current.OPEN) {
        socket.current.onopen = () => {
          if (!socket.current) return;
          socket.current.send(text);
        };
      } else {
        socket.current.send(text);
      }
    };

    return () => {
      socket.current &&
        socket.current.removeEventListener("message", handleMessage);
      window.removeEventListener("play-next", playNext);
    };
  }, [socket.current, play, free, htmlTextElement.current, refresh.current]);

  return { sendText, play, setPlay, refresh };
};
