import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, SkipForward, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface Track {
  name: string;
  url: string;
  author: string;
}

const DEFAULT_PLAYLIST: Track[] = [
  {
    name: 'Grandioso És Tu (Instrumental)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    author: 'Harpa Cristã'
  },
  {
    name: 'Porque Ele Vive (Solo de Piano)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    author: 'Adoração e Fé'
  },
  {
    name: 'Quão Grande És Tu (Acústico Suave)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    author: 'Instrumental Gospel'
  }
];

export default function BackgroundMusic() {
  const [playlist, setPlaylist] = useState<Track[]>(() => {
    const saved = localStorage.getItem('id_shop_music_playlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If it still has the old non-devotional playlist, force migrate it to the new Louvores!
        const hasOldSongs = Array.isArray(parsed) && parsed.some(song => song.name.includes('Piano Celestial') || song.name.includes('Lofi'));
        if (hasOldSongs) {
          localStorage.setItem('id_shop_music_playlist', JSON.stringify(DEFAULT_PLAYLIST));
          return DEFAULT_PLAYLIST;
        }
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_PLAYLIST;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.3); // 30% default volume
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(true); // Open by default
  const [showToastAlert, setShowToastAlert] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const track = playlist[currentTrackIndex] || playlist[0] || DEFAULT_PLAYLIST[0];

  // Initialize and load dynamic updates
  useEffect(() => {
    // Write defaults to localStorage if not exists to facilitate admin view showing them
    if (!localStorage.getItem('id_shop_music_playlist')) {
      localStorage.setItem('id_shop_music_playlist', JSON.stringify(DEFAULT_PLAYLIST));
    }

    const audio = new Audio(track.url);
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    // Persist volume choice
    const savedVol = localStorage.getItem('id_shop_music_vol');
    if (savedVol) {
      const parsed = parseFloat(savedVol);
      setVolume(parsed);
      audio.volume = isMuted ? 0 : parsed;
    }

    // Inform user of background music
    const shown = localStorage.getItem('id_shop_music_tip');
    if (!shown) {
      setShowToastAlert(true);
      localStorage.setItem('id_shop_music_tip', 'true');
    }

    // Handle updates when admin changes playlist
    const onPlaylistUpdated = () => {
      const updated = localStorage.getItem('id_shop_music_playlist');
      if (updated) {
        try {
          const parsed = JSON.parse(updated);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPlaylist(parsed);
            setCurrentTrackIndex(0);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('id_music_playlist_updated', onPlaylistUpdated);

    return () => {
      audio.pause();
      window.removeEventListener('id_music_playlist_updated', onPlaylistUpdated);
    };
  }, []);

  // Sync track changes
  useEffect(() => {
    if (audioRef.current && track) {
      const wasPlaying = isPlaying;
      audioRef.current.pause();
      
      const newAudio = new Audio(track.url);
      newAudio.loop = true;
      newAudio.volume = isMuted ? 0 : volume;
      audioRef.current = newAudio;

      if (wasPlaying) {
        newAudio.play().catch(err => {
          console.warn('Autoplay blocked by browser. Interaction required.', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, playlist]);

  // Sync volume adjustments
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn('Audio failed to play (interaction or sandbox constraint):', err);
          setIsPlaying(false);
        });
    }
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    setVolume(newVal);
    if (isMuted) setIsMuted(false);
    localStorage.setItem('id_shop_music_vol', newVal.toString());
  };

  return (
    <div id="bg-music-player-container" className="fixed bottom-24 left-6 z-40 font-sans max-w-xs transition-all duration-300 pointer-events-auto">
      {/* Tiny intro toast */}
      {showToastAlert && (
        <div className="absolute bottom-20 left-0 bg-slate-900 border border-sky-500/20 text-[11px] text-slate-350 p-2.5 rounded-xl shadow-lg w-48 flex flex-col gap-1.5 animate-bounce">
          <span className="text-white font-bold flex items-center gap-1">
            <Music className="w-3.5 h-3.5 text-sky-400" /> Player de Louvores
          </span>
          <span>Escolha um belo louvor de adoração para tocar enquanto navega na nossa vitrine!</span>
          <button 
            onClick={() => setShowToastAlert(false)} 
            className="self-end text-[9px] bg-sky-600/20 text-sky-300 font-bold px-1.5 py-0.5 rounded focus:outline-none cursor-pointer"
          >
            Ok, vamos lá
          </button>
        </div>
      )}

      {/* Main musical floating box */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.4)] pointer-events-auto transition-all overflow-hidden">
        {/* Header clickable */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-slate-850/60 transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isPlaying ? 'bg-sky-500/25 text-sky-400 animate-spin' : 'bg-slate-950 text-slate-500'}`} style={{ animationDuration: '6s' }}>
              <Music className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-sky-450 font-bold block uppercase tracking-wider -mb-0.5">Música Tocando 🎵</span>
              <span className="text-xs text-white font-extrabold font-sans line-clamp-1 max-w-[120px]">
                {isPlaying ? track.name : 'Aperte para Ouvir'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pulsating Visualizer Bars */}
            {isPlaying && (
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-sky-400 animate-pulse" style={{ height: '100%', animationDuration: '0.6s' }} />
                <span className="w-0.5 bg-sky-300 animate-pulse" style={{ height: '60%', animationDuration: '0.4s' }} />
                <span className="w-0.5 bg-sky-400 animate-pulse" style={{ height: '80%', animationDuration: '0.8s' }} />
                <span className="w-0.5 bg-sky-200 animate-pulse" style={{ height: '40%', animationDuration: '0.5s' }} />
              </div>
            )}
            
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Collapsible Panel */}
        {isOpen && (
          <div className="px-3.5 pb-4 pt-2 border-t border-slate-850/60 space-y-3 bg-slate-950/20">
            {/* Tracks specs info */}
            <div className="text-[11px] bg-slate-950/80 p-2 rounded-lg border border-slate-850">
              <div className="text-slate-400 font-bold truncate">🎵 {track.name}</div>
              <div className="text-slate-650 flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                <span>Autor: {track.author}</span>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-2.5">
              <button
                onClick={handlePlayPause}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold font-sans transition cursor-pointer ${isPlaying ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-sky-600 hover:bg-sky-500 text-white'}`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Tocar
                  </>
                )}
              </button>

              <button
                onClick={handleNextTrack}
                title="Próxima canção"
                className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Volume slider control */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={toggleMute}
                className="text-slate-450 hover:text-white cursor-pointer transition focus:outline-none"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-sky-400" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full accent-sky-500 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                {isMuted ? 'Mudo' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
