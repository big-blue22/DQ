import React, { useState, useEffect } from 'react';
import './DQ2SidohBattle.css';
import { useBackgroundAudio } from './hooks/useBackgroundAudio';
import sidohImg from './assets/sidoh_final.png';

const DQ2SidohBattle = () => {
  const [gameState, setGameState] = useState('intro');
  const [turn, setTurn] = useState(0);
  const [message, setMessage] = useState('はかいしん シドーが あらわれた!');
  const [currentCharacter, setCurrentCharacter] = useState(0);
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [animating, setAnimating] = useState(false);

  // Keyboard Navigation State
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [party, setParty] = useState([
    { name: 'ローレシア', level: 44, hp: 189, maxHp: 189, mp: 31, maxMp: 31, atk: 120, def: 80, status: 'normal', canUseMagic: false },
    { name: 'サマルトリア', level: 31, hp: 159, maxHp: 159, mp: 93, maxMp: 93, atk: 90, def: 70, status: 'normal', canUseMagic: true },
    { name: 'ムーンブルク', level: 28, hp: 105, maxHp: 105, mp: 115, maxMp: 115, atk: 60, def: 50, status: 'normal', canUseMagic: true }
  ]);
  const [sidoh, setSidoh] = useState({ name: 'シドー', hp: 2000, maxHp: 2000, atk: 180, def: 120, status: 'normal' });

  // バックグラウンド音声再生（ループ）
  const { play, pause, isPlaying } = useBackgroundAudio(
    `${import.meta.env.BASE_URL}無題の動画.mp4`,
    { autoPlay: false, loop: true, volume: 0.3 }
  );

  const spells = {
    0: [], // ローレシアは呪文が使えない
    1: [
      { name: 'イオナズン', mp: 15, type: 'attack', power: 100 },
      { name: 'ベホマ', mp: 8, type: 'heal', power: 150 },
      { name: 'ザオリク', mp: 20, type: 'revive' }
    ],
    2: [
      { name: 'メラゾーマ', mp: 10, type: 'attack', power: 80 },
      { name: 'ベホイミ', mp: 5, type: 'heal', power: 80 },
      { name: 'ザオラル', mp: 12, type: 'revive' }
    ]
  };

  const handleCommand = (command) => {
    if (animating) return;
    setSelectedCommand(command);

    if (command === 'たたかう') {
      setGameState('selectAttackType');
    } else if (command === 'どうぐ') {
      executeCommand('どうぐ');
    } else if (command === 'にげる') {
      executeCommand('にげる');
    } else {
      executeCommand(command);
    }
  };

  const handleAttackType = (type) => {
    if (animating) return;
    
    if (type === 'ぶきで こうげき') {
      executeCommand('たたかう');
    } else if (type === 'じゅもん') {
      setGameState('selectSpell');
    }
  };

  const handleSpell = (spell) => {
    if (animating) return;
    setSelectedSpell(spell);
    executeCommand('じゅもん', spell);
  };

  const executeCommand = (command, spell = null) => {
    setAnimating(true);
    const char = party[currentCharacter];
    if (char.status === 'dead') {
      setMessage(`${char.name}は しんでいる!`);
      setTimeout(() => nextTurn(), 1500);
      return;
    }

    let msg = '';
    let newParty = JSON.parse(JSON.stringify(party));
    let newSidoh = { ...sidoh };

    if (command === 'たたかう') {
      const damage = Math.floor(Math.random() * 40) + char.atk - 60;
      const actualDamage = Math.max(1, damage);
      newSidoh.hp = Math.max(0, newSidoh.hp - actualDamage);
      msg = `${char.name}の こうげき!\n${sidoh.name}に ${actualDamage}の ダメージ!`;
    } else if (command === 'どうぐ') {
      msg = `${char.name}は どうぐを つかった!\n\nしかし なにも おこらなかった`;
    } else if (command === 'にげる') {
      msg = `${char.name}は にげだした!\n\nしかし まわりこまれてしまった!`;
    } else if (command === 'じゅもん' && spell) {
      if (char.mp < spell.mp) {
        msg = 'MPが たりない!';
      } else {
        newParty[currentCharacter].mp -= spell.mp;
        if (spell.type === 'attack') {
          const damage = Math.floor(Math.random() * 30) + spell.power;
          newSidoh.hp = Math.max(0, newSidoh.hp - damage);
          msg = `${char.name}は ${spell.name}を となえた!\n${sidoh.name}に ${damage}の ダメージ!`;
        } else if (spell.type === 'heal') {
          const target = newParty.find(p => p.hp > 0 && p.hp < p.maxHp);
          if (target) {
            const heal = Math.min(spell.power, target.maxHp - target.hp);
            target.hp += heal;
            msg = `${char.name}は ${spell.name}を となえた!\n${target.name}の HPが ${heal} かいふくした!`;
          } else {
            msg = `${char.name}は ${spell.name}を となえた!\nしかし こうかが なかった!`;
          }
        } else if (spell.type === 'revive') {
          const deadChar = newParty.find(p => p.status === 'dead');
          if (deadChar) {
            if (Math.random() > 0.5 || spell.name === 'ザオリク') {
              deadChar.status = 'normal';
              deadChar.hp = Math.floor(deadChar.maxHp / 2);
              msg = `${char.name}は ${spell.name}を となえた!\n${deadChar.name}は いきかえった!`;
            } else {
              msg = `${char.name}は ${spell.name}を となえた!\nしかし こうかが なかった!`;
            }
          } else {
            msg = `${char.name}は ${spell.name}を となえた!\nしかし こうかが なかった!`;
          }
        } else if (spell.type === 'buff') {
          newParty[currentCharacter].atk = Math.floor(newParty[currentCharacter].atk * 1.3);
          msg = `${char.name}は ${spell.name}を となえた!\n${char.name}の こうげきりょくが あがった!`;
        }
      }
    } else if (command === 'ぼうぎょ') {
      msg = `${char.name}は みをまもっている`;
    }

    setParty(newParty);
    setSidoh(newSidoh);
    setMessage(msg);

    setTimeout(() => {
      if (newSidoh.hp <= 0) {
        setMessage('シドーを たおした!\n\nせかいに へいわが おとずれた・・・');
        setGameState('victory');
        setAnimating(false);
      } else {
        nextTurn();
      }
    }, 2000);
  };

  const nextTurn = () => {
    if (currentCharacter < 2) {
      setCurrentCharacter(currentCharacter + 1);
      setGameState('command');
      setSelectedCommand(null);
      setSelectedSpell(null);
      setAnimating(false);
    } else {
      enemyTurn();
    }
  };

  const enemyTurn = () => {
    setTimeout(() => {
      let newParty = JSON.parse(JSON.stringify(party));
      const aliveParty = newParty.filter(p => p.status !== 'dead');

      if (aliveParty.length === 0) {
        setMessage('パーティは ぜんめつした・・・');
        setGameState('gameover');
        setAnimating(false);
        return;
      }

      const target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
      const targetIndex = newParty.findIndex(p => p.name === target.name);
      
      const action = Math.random();
      let msg = '';

      if (action < 0.3) {
        const damage = Math.floor(Math.random() * 60) + 80;
        newParty[targetIndex].hp = Math.max(0, newParty[targetIndex].hp - damage);
        msg = `シドーの はげしいほのお!\n${target.name}は ${damage}の ダメージを うけた!`;
      } else if (action < 0.5) {
        const damage = Math.floor(Math.random() * 40) + 120;
        newParty[targetIndex].hp = Math.max(0, newParty[targetIndex].hp - damage);
        msg = `シドーの つうこんのいちげき!\n${target.name}は ${damage}の ダメージを うけた!`;
      } else {
        const damage = Math.floor(Math.random() * 50) + 60;
        newParty[targetIndex].hp = Math.max(0, newParty[targetIndex].hp - damage);
        msg = `シドーの こうげき!\n${target.name}は ${damage}の ダメージを うけた!`;
      }

      if (newParty[targetIndex].hp === 0) {
        newParty[targetIndex].status = 'dead';
        msg += `\n${target.name}は しんでしまった!`;
      }

      setParty(newParty);
      setMessage(msg);

      setTimeout(() => {
        const stillAlive = newParty.filter(p => p.status !== 'dead');
        if (stillAlive.length === 0) {
          setMessage('パーティは ぜんめつした・・・');
          setGameState('gameover');
        } else {
          setCurrentCharacter(0);
          setGameState('command');
          setTurn(turn + 1);
        }
        setAnimating(false);
      }, 2500);
    }, 1000);
  };

  const startGame = () => {
    setGameState('command');
    setMessage('');
    play(); // バックグラウンド音声再生開始
  };

  const restartGame = () => {
    setParty([
      { name: 'ローレシア', level: 44, hp: 189, maxHp: 189, mp: 31, maxMp: 31, atk: 120, def: 80, status: 'normal', canUseMagic: false },
      { name: 'サマルトリア', level: 31, hp: 159, maxHp: 159, mp: 93, maxMp: 93, atk: 90, def: 70, status: 'normal', canUseMagic: true },
      { name: 'ムーンブルク', level: 28, hp: 105, maxHp: 105, mp: 115, maxMp: 115, atk: 60, def: 50, status: 'normal', canUseMagic: true }
    ]);
    setSidoh({ name: 'シドー', hp: 2000, maxHp: 2000, atk: 180, def: 120, status: 'normal' });
    setCurrentCharacter(0);
    setTurn(0);
    setGameState('intro');
    setMessage('はかいしん シドーが あらわれた!');
    setAnimating(false);
    pause(); // 音声を一時停止してリセット
  };

  const isCommandMode = ['intro', 'command', 'selectAttackType', 'selectSpell', 'victory', 'gameover'].includes(gameState) && !animating;

  // Determine available menu options based on current game state
  const getMenuOptions = () => {
    if (!isCommandMode) return [];

    switch (gameState) {
      case 'intro':
        return [{ label: 'たたかう', action: startGame, className: 'command-button' }];
      case 'command':
        return [
          { label: 'たたかう', action: () => handleCommand('たたかう'), className: 'command-button' },
          { label: 'にげる', action: () => handleCommand('にげる'), className: 'command-button' },
          { label: 'ぼうぎょ', action: () => handleCommand('ぼうぎょ'), className: 'command-button' },
          { label: 'どうぐ', action: () => handleCommand('どうぐ'), className: 'command-button' }
        ];
      case 'selectAttackType':
        const opts = [
          { label: 'ぶきで こうげき', action: () => handleAttackType('ぶきで こうげき'), className: 'submenu-button' }
        ];
        if (party[currentCharacter].canUseMagic) {
          opts.push({ label: 'じゅもん', action: () => handleAttackType('じゅもん'), className: 'submenu-button' });
        }
        opts.push({ label: 'もどる', action: () => setGameState('command'), className: 'back-button' });
        return opts;
      case 'selectSpell':
        const spellOpts = spells[currentCharacter].map(spell => ({
          label: (
            <>
              <span className="spell-name">{spell.name}</span>
              <span className="spell-cost">MP {spell.mp}</span>
            </>
          ),
          action: () => handleSpell(spell),
          disabled: party[currentCharacter].mp < spell.mp,
          className: 'spell-button'
        }));
        spellOpts.push({ label: 'もどる', action: () => setGameState('selectAttackType'), className: 'back-button' });
        return spellOpts;
      case 'victory':
      case 'gameover':
        return [{ label: 'もういちど', action: restartGame, className: 'command-button' }];
      default:
        return [];
    }
  };

  const menuOptions = getMenuOptions();

  // Reset selected index when menu changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [gameState]);

  // Handle keyboard input
  useEffect(() => {
    if (!isCommandMode || menuOptions.length === 0) return;

    const handleKeyDown = (e) => {
      // Prevent default scrolling for arrows/space
      if (['ArrowUp', 'ArrowDown', 'Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          setSelectedIndex(prev => (prev - 1 + menuOptions.length) % menuOptions.length);
          break;
        case 'ArrowDown':
        case 'KeyS':
          setSelectedIndex(prev => (prev + 1) % menuOptions.length);
          break;
        case 'Enter':
        case 'Space':
          const selected = menuOptions[selectedIndex];
          if (selected && !selected.disabled) {
            selected.action();
          }
          break;
        case 'Escape':
        case 'Backspace':
          if (gameState === 'selectAttackType') setGameState('command');
          if (gameState === 'selectSpell') setGameState('selectAttackType');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandMode, menuOptions, selectedIndex, gameState]);

  return (
    <div className="game-container">
      <div className="game-board">
        {/* Party Status Window (左上) */}
        <div className="party-window">
          {party.map((char, idx) => (
            <div 
              key={idx} 
              className={`party-member ${currentCharacter === idx && (gameState === 'command' || gameState === 'selectAttackType' || gameState === 'selectSpell') ? 'active' : ''} ${char.status === 'dead' ? 'dead' : ''}`}
            >
              <div className="member-name">{char.name}</div>
              <div className="member-stats">
                <div className="stat-line">
                  <span>Ｌ</span>
                  <span>{char.level}</span>
                </div>
                <div className="stat-line">
                  <span>Ｈ</span>
                  <span>{char.hp}</span>
                </div>
                <div className="stat-line">
                  <span>Ｍ</span>
                  <span>{char.mp}</span>
                </div>
                {char.status === 'dead' && <div className="dead-status">しぼう</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Enemy Area (中央) */}
        <div className="enemy-area">
          <img src={sidohImg} alt="シドー" className="enemy-image" />
        </div>

        {/* Bottom Panel (Command & Message) */}
        <div className={`bottom-panel ${isCommandMode ? 'mode-split' : 'mode-full'}`}>
          {/* Command Window Section */}
          {isCommandMode && (
            <div className="command-section">
               <div className={
                  gameState === 'selectAttackType' || gameState === 'selectSpell'
                  ? "submenu-window"
                  : "command-window"
               }>
                  <div className={
                     gameState === 'selectSpell' ? "spell-list" :
                     gameState === 'selectAttackType' ? "submenu-list" :
                     "command-grid"
                  }>
                     {menuOptions.map((opt, idx) => (
                       <button
                         key={idx}
                         onClick={opt.action}
                         disabled={opt.disabled}
                         className={`${opt.className} ${selectedIndex === idx ? 'selected' : ''}`}
                         onMouseEnter={() => setSelectedIndex(idx)}
                       >
                         {opt.label}
                       </button>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {/* Message Box */}
          {!isCommandMode && (
            <div className="message-box">
              <div className="message-text">{message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DQ2SidohBattle;
