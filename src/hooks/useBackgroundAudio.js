import { useEffect, useRef, useState } from 'react';

/**
 * カスタムフック: 動画ファイルから音声のみを抽出してバックグラウンドで再生
 * @param {string} videoSrc - 動画ファイルのパス
 * @param {object} options - オプション設定
 * @param {boolean} options.autoPlay - 自動再生するかどうか（デフォルト: true）
 * @param {boolean} options.loop - ループ再生するかどうか（デフォルト: true）
 * @param {number} options.volume - 音量（0.0～1.0、デフォルト: 0.5）
 * @returns {object} - play, pause, setVolume, isPlaying 関数とステートを含むオブジェクト
 */
export const useBackgroundAudio = (videoSrc, options = {}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { autoPlay = true, loop = true, volume = 0.5 } = options;

  useEffect(() => {
    // 動画ファイルから音声要素を作成
    const audio = new Audio(videoSrc);
    audio.loop = loop;
    audio.volume = volume;
    audioRef.current = audio;

    // 自動再生が有効な場合
    if (autoPlay) {
      audio.play().catch(err => {
        console.warn('Autoplay blocked by browser:', err);
      });
      setIsPlaying(true);
    }

    // コンポーネントのアンマウント時にクリーンアップ
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [videoSrc, loop, volume, autoPlay]);

  // 再生開始
  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.warn('Play failed:', err);
      });
      setIsPlaying(true);
    }
  };

  // 一時停止
  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // 音量設定（0.0～1.0）
  const setVolume = (vol) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, vol));
    }
  };

  return { play, pause, setVolume, isPlaying };
};
