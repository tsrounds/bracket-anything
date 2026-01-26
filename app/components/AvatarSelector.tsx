'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface AvatarSelectorProps {
  onAvatarSelect: (avatarPath: string) => void;
  initialAvatar?: string;
}

export default function AvatarSelector({ onAvatarSelect, initialAvatar }: AvatarSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(initialAvatar || '');
  const [displayAvatar, setDisplayAvatar] = useState(initialAvatar || '');
  const [preloadedImages, setPreloadedImages] = useState<string[]>([]);
  const [rollKey, setRollKey] = useState(0);

  // Pokemon sprite paths (Gen 1: 1-151)
  const avatarPaths = [
    '/pokemon_sprites_v3/001_Bulbasaur.png',
    '/pokemon_sprites_v3/002_Ivysaur.png',
    '/pokemon_sprites_v3/003_Venusaur.png',
    '/pokemon_sprites_v3/004_Charmander.png',
    '/pokemon_sprites_v3/005_Charmeleon.png',
    '/pokemon_sprites_v3/006_Charizard.png',
    '/pokemon_sprites_v3/007_Squirtle.png',
    '/pokemon_sprites_v3/008_Wartortle.png',
    '/pokemon_sprites_v3/009_Blastoise.png',
    '/pokemon_sprites_v3/010_Caterpie.png',
    '/pokemon_sprites_v3/011_Metapod.png',
    '/pokemon_sprites_v3/012_Butterfree.png',
    '/pokemon_sprites_v3/013_Weedle.png',
    '/pokemon_sprites_v3/014_Kakuna.png',
    '/pokemon_sprites_v3/015_Beedrill.png',
    '/pokemon_sprites_v3/016_Pidgey.png',
    '/pokemon_sprites_v3/017_Pidgeotto.png',
    '/pokemon_sprites_v3/018_Pidgeot.png',
    '/pokemon_sprites_v3/019_Rattata.png',
    '/pokemon_sprites_v3/020_Raticate.png',
    '/pokemon_sprites_v3/021_Spearow.png',
    '/pokemon_sprites_v3/022_Fearow.png',
    '/pokemon_sprites_v3/023_Ekans.png',
    '/pokemon_sprites_v3/024_Arbok.png',
    '/pokemon_sprites_v3/025_Pikachu.png',
    '/pokemon_sprites_v3/026_Raichu.png',
    '/pokemon_sprites_v3/027_Sandshrew.png',
    '/pokemon_sprites_v3/028_Sandslash.png',
    '/pokemon_sprites_v3/029_Nidoran_F.png',
    '/pokemon_sprites_v3/030_Nidorina.png',
    '/pokemon_sprites_v3/031_Nidoqueen.png',
    '/pokemon_sprites_v3/032_Nidoran_M.png',
    '/pokemon_sprites_v3/033_Nidorino.png',
    '/pokemon_sprites_v3/034_Nidoking.png',
    '/pokemon_sprites_v3/035_Clefairy.png',
    '/pokemon_sprites_v3/036_Clefable.png',
    '/pokemon_sprites_v3/037_Vulpix.png',
    '/pokemon_sprites_v3/038_Ninetales.png',
    '/pokemon_sprites_v3/039_Jigglypuff.png',
    '/pokemon_sprites_v3/040_Wigglytuff.png',
    '/pokemon_sprites_v3/041_Zubat.png',
    '/pokemon_sprites_v3/042_Golbat.png',
    '/pokemon_sprites_v3/043_Oddish.png',
    '/pokemon_sprites_v3/044_Gloom.png',
    '/pokemon_sprites_v3/045_Vileplume.png',
    '/pokemon_sprites_v3/046_Paras.png',
    '/pokemon_sprites_v3/047_Parasect.png',
    '/pokemon_sprites_v3/048_Venonat.png',
    '/pokemon_sprites_v3/049_Venomoth.png',
    '/pokemon_sprites_v3/050_Diglett.png',
    '/pokemon_sprites_v3/051_Dugtrio.png',
    '/pokemon_sprites_v3/052_Meowth.png',
    '/pokemon_sprites_v3/053_Persian.png',
    '/pokemon_sprites_v3/054_Psyduck.png',
    '/pokemon_sprites_v3/055_Golduck.png',
    '/pokemon_sprites_v3/056_Mankey.png',
    '/pokemon_sprites_v3/057_Primeape.png',
    '/pokemon_sprites_v3/058_Growlithe.png',
    '/pokemon_sprites_v3/059_Arcanine.png',
    '/pokemon_sprites_v3/060_Poliwag.png',
    '/pokemon_sprites_v3/061_Poliwhirl.png',
    '/pokemon_sprites_v3/062_Poliwrath.png',
    '/pokemon_sprites_v3/063_Abra.png',
    '/pokemon_sprites_v3/064_Kadabra.png',
    '/pokemon_sprites_v3/065_Alakazam.png',
    '/pokemon_sprites_v3/066_Machop.png',
    '/pokemon_sprites_v3/067_Machoke.png',
    '/pokemon_sprites_v3/068_Machamp.png',
    '/pokemon_sprites_v3/069_Bellsprout.png',
    '/pokemon_sprites_v3/070_Weepinbell.png',
    '/pokemon_sprites_v3/071_Victreebel.png',
    '/pokemon_sprites_v3/072_Tentacool.png',
    '/pokemon_sprites_v3/073_Tentacruel.png',
    '/pokemon_sprites_v3/074_Geodude.png',
    '/pokemon_sprites_v3/075_Graveler.png',
    '/pokemon_sprites_v3/076_Golem.png',
    '/pokemon_sprites_v3/077_Ponyta.png',
    '/pokemon_sprites_v3/078_Rapidash.png',
    '/pokemon_sprites_v3/079_Slowpoke.png',
    '/pokemon_sprites_v3/080_Slowbro.png',
    '/pokemon_sprites_v3/081_Magnemite.png',
    '/pokemon_sprites_v3/082_Magneton.png',
    '/pokemon_sprites_v3/083_Farfetchd.png',
    '/pokemon_sprites_v3/084_Doduo.png',
    '/pokemon_sprites_v3/085_Dodrio.png',
    '/pokemon_sprites_v3/086_Seel.png',
    '/pokemon_sprites_v3/087_Dewgong.png',
    '/pokemon_sprites_v3/088_Grimer.png',
    '/pokemon_sprites_v3/089_Muk.png',
    '/pokemon_sprites_v3/090_Shellder.png',
    '/pokemon_sprites_v3/091_Cloyster.png',
    '/pokemon_sprites_v3/092_Gastly.png',
    '/pokemon_sprites_v3/093_Haunter.png',
    '/pokemon_sprites_v3/094_Gengar.png',
    '/pokemon_sprites_v3/095_Onix.png',
    '/pokemon_sprites_v3/096_Drowzee.png',
    '/pokemon_sprites_v3/097_Hypno.png',
    '/pokemon_sprites_v3/098_Krabby.png',
    '/pokemon_sprites_v3/099_Kingler.png',
    '/pokemon_sprites_v3/100_Voltorb.png',
    '/pokemon_sprites_v3/101_Electrode.png',
    '/pokemon_sprites_v3/102_Exeggcute.png',
    '/pokemon_sprites_v3/103_Exeggutor.png',
    '/pokemon_sprites_v3/104_Cubone.png',
    '/pokemon_sprites_v3/105_Marowak.png',
    '/pokemon_sprites_v3/106_Hitmonlee.png',
    '/pokemon_sprites_v3/107_Hitmonchan.png',
    '/pokemon_sprites_v3/108_Lickitung.png',
    '/pokemon_sprites_v3/109_Koffing.png',
    '/pokemon_sprites_v3/110_Weezing.png',
    '/pokemon_sprites_v3/111_Rhyhorn.png',
    '/pokemon_sprites_v3/112_Rhydon.png',
    '/pokemon_sprites_v3/113_Chansey.png',
    '/pokemon_sprites_v3/114_Tangela.png',
    '/pokemon_sprites_v3/115_Kangaskhan.png',
    '/pokemon_sprites_v3/116_Horsea.png',
    '/pokemon_sprites_v3/117_Seadra.png',
    '/pokemon_sprites_v3/118_Goldeen.png',
    '/pokemon_sprites_v3/119_Seaking.png',
    '/pokemon_sprites_v3/120_Staryu.png',
    '/pokemon_sprites_v3/121_Starmie.png',
    '/pokemon_sprites_v3/122_Mr_Mime.png',
    '/pokemon_sprites_v3/123_Scyther.png',
    '/pokemon_sprites_v3/124_Jynx.png',
    '/pokemon_sprites_v3/125_Electabuzz.png',
    '/pokemon_sprites_v3/126_Magmar.png',
    '/pokemon_sprites_v3/127_Pinsir.png',
    '/pokemon_sprites_v3/128_Tauros.png',
    '/pokemon_sprites_v3/129_Magikarp.png',
    '/pokemon_sprites_v3/130_Gyarados.png',
    '/pokemon_sprites_v3/131_Lapras.png',
    '/pokemon_sprites_v3/132_Ditto.png',
    '/pokemon_sprites_v3/133_Eevee.png',
    '/pokemon_sprites_v3/134_Vaporeon.png',
    '/pokemon_sprites_v3/135_Jolteon.png',
    '/pokemon_sprites_v3/136_Flareon.png',
    '/pokemon_sprites_v3/137_Porygon.png',
    '/pokemon_sprites_v3/138_Omanyte.png',
    '/pokemon_sprites_v3/139_Omastar.png',
    '/pokemon_sprites_v3/140_Kabuto.png',
    '/pokemon_sprites_v3/141_Kabutops.png',
    '/pokemon_sprites_v3/142_Aerodactyl.png',
    '/pokemon_sprites_v3/143_Snorlax.png',
    '/pokemon_sprites_v3/144_Articuno.png',
    '/pokemon_sprites_v3/145_Zapdos.png',
    '/pokemon_sprites_v3/146_Moltres.png',
    '/pokemon_sprites_v3/147_Dratini.png',
    '/pokemon_sprites_v3/148_Dragonair.png',
    '/pokemon_sprites_v3/149_Dragonite.png',
    '/pokemon_sprites_v3/150_Mewtwo.png',
    '/pokemon_sprites_v3/151_Mew.png',
  ];

  // Sync displayAvatar with initialAvatar
  useEffect(() => {
    if (initialAvatar) {
      setDisplayAvatar(initialAvatar);
      setCurrentAvatar(initialAvatar);
    }
  }, [initialAvatar]);

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      const loadedImages = await Promise.all(
        avatarPaths.map(async (path) => {
          const img = new window.Image();
          img.src = path;
          return new Promise<string>((resolve) => {
            img.onload = () => resolve(path);
          });
        })
      );
      setPreloadedImages(loadedImages);
    };

    preloadImages();
  }, []);

  const handleAvatarSelection = () => {
    if (!currentAvatar) {
      // First time selection
      selectRandomAvatar();
    } else {
      // Regenerate existing avatar
      selectRandomAvatar();
    }
  };

  const selectRandomAvatar = () => {
    setIsSelecting(true);
    setRollKey(prev => prev + 1);

    // Create a sequence of avatars to show with easing (fast start, slow end)
    const totalDuration = 1800; // Total animation time
    const steps = 20; // Number of avatar changes
    const finalIndex = Math.floor(Math.random() * avatarPaths.length);

    // Generate random indices for the roll, ending with the final one
    const rollIndices: number[] = [];
    for (let i = 0; i < steps - 1; i++) {
      rollIndices.push(Math.floor(Math.random() * avatarPaths.length));
    }
    rollIndices.push(finalIndex);

    // Easing function - starts fast, slows down at the end
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    // Schedule each avatar change with easing
    rollIndices.forEach((avatarIndex, step) => {
      const progress = step / (steps - 1);
      const easedProgress = easeOutQuart(progress);
      const delay = easedProgress * totalDuration;

      setTimeout(() => {
        setDisplayAvatar(avatarPaths[avatarIndex]);

        // On final step, complete the selection
        if (step === steps - 1) {
          setCurrentAvatar(avatarPaths[finalIndex]);
          setIsSelecting(false);
          onAvatarSelect(avatarPaths[finalIndex]);
        }
      }, delay);
    });
  };

  return (
    <div className="flex flex-row items-center justify-center gap-6">
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {isSelecting ? (
          // During rolling animation - quick vertical flip without AnimatePresence delays
          <motion.div
            key={`roll-${displayAvatar}`}
            initial={{ y: -40, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            transition={{ duration: 0.08, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ perspective: 1000 }}
          >
            {displayAvatar && (
              <Image
                src={displayAvatar}
                alt="Rolling avatar"
                fill
                className="object-contain p-2"
                sizes="(max-width: 128px) 100vw, 128px"
                priority
                style={{ objectPosition: 'center' }}
              />
            )}
          </motion.div>
        ) : (
          // Static display with gentle entrance animation
          <AnimatePresence mode="wait">
            {currentAvatar && (
              <motion.div
                key={currentAvatar}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Image
                  src={currentAvatar}
                  alt="Selected avatar"
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 128px) 100vw, 128px"
                  priority
                  style={{ objectPosition: 'center' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      
      <button
        onClick={handleAvatarSelection}
        disabled={isSelecting}
        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ml-4
          ${isSelecting 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        style={{ transition: 'transform 0.1s ease', position: 'relative' }}
        onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {isSelecting ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', height: '1em' }}>
            <style>{`
              @keyframes bouncing-dot { 0% { transform: none; } 33% { transform: translateY(-0.3em); } 66% { transform: none; } }
            `}</style>
            <span style={{ display: 'inline-block', fontSize: '1.5em', animation: 'bouncing-dot 700ms infinite ease-out', animationDelay: '0ms' }}>. </span>
            <span style={{ display: 'inline-block', fontSize: '1.5em', animation: 'bouncing-dot 700ms infinite ease-out', animationDelay: '125ms' }}>. </span>
            <span style={{ display: 'inline-block', fontSize: '1.5em', animation: 'bouncing-dot 700ms infinite ease-out', animationDelay: '250ms' }}>. </span>
          </span>
        ) : currentAvatar ? 'Redo' : 'Generate'}
      </button>
    </div>
  );
} 