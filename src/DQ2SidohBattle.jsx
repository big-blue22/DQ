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
  const [pendingAction, setPendingAction] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [commandQueue, setCommandQueue] = useState([]);
  const [battleQueue, setBattleQueue] = useState([]);

  // Keyboard Navigation State
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [party, setParty] = useState([
    {
      name: 'ローレシア', level: 44, hp: 189, maxHp: 189, mp: 31, maxMp: 31, atk: 120, def: 80, agi: 70, status: 'normal', canUseMagic: false,
      items: [{ name: 'やくそう', type: 'heal', power: 30 }]
    },
    {
      name: 'サマルトリア', level: 31, hp: 159, maxHp: 159, mp: 93, maxMp: 93, atk: 90, def: 70, agi: 110, status: 'normal', canUseMagic: true,
      items: [{ name: 'やくそう', type: 'heal', power: 30 }]
    },
    {
      name: 'ムーンブルク', level: 28, hp: 105, maxHp: 105, mp: 115, maxMp: 115, atk: 60, def: 50, agi: 140, status: 'normal', canUseMagic: true,
      items: [{ name: 'やくそう', type: 'heal', power: 30 }]
    }
  ]);
  const [sidoh, setSidoh] = useState({ name: 'シドー', hp: 2000, maxHp: 2000, atk: 180, def: 120, agi: 90, status: 'normal' });
  const [isSidohDamaged, setIsSidohDamaged] = useState(false);

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

  const registerCommand = (command, spell = null, item = null, target = null) => {
    const newQueue = [...commandQueue, {
      type: command,
      spell: spell,
      item: item,
      target: target,
      actorIndex: currentCharacter
    }];
    setCommandQueue(newQueue);

    if (currentCharacter < 2) {
      setCurrentCharacter(currentCharacter + 1);
      setGameState('command');
      setSelectedCommand(null);
      setSelectedSpell(null);
      setPendingAction(null);
    } else {
      startBattlePhase(newQueue);
    }
  };

  const handleCommand = (command) => {
    if (animating) return;
    setSelectedCommand(command);

    if (command === 'たたかう') {
      setGameState('selectAttackType');
    } else if (command === 'どうぐ') {
      setGameState('selectItem');
    } else if (command === 'にげる' || command === 'ぼうぎょ') {
      registerCommand(command);
    }
  };

  const handleAttackType = (type) => {
    if (animating) return;
    
    if (type === 'ぶきで こうげき') {
      setPendingAction({ type: 'たたかう', subtype: 'attack' });
      setGameState('selectTarget');
    } else if (type === 'じゅもん') {
      setGameState('selectSpell');
    }
  };

  const handleSpell = (spell) => {
    if (animating) return;
    setSelectedSpell(spell);
    setPendingAction({ type: 'じゅもん', spell: spell });
    setGameState('selectTarget');
  };

  const handleItem = (item) => {
    if (animating) return;
    setPendingAction({ type: 'どうぐ', item: item });
    setGameState('selectTarget');
  };

  const handleTargetSelection = (target) => {
    const { type, spell, item } = pendingAction;
    registerCommand(type, spell, item, target);
  };

  const startBattlePhase = (finalCommandQueue) => {
    setGameState('processingTurn');

    let battlers = [];

    // Add party actions
    finalCommandQueue.forEach((cmd) => {
      battlers.push({
        isEnemy: false,
        index: cmd.actorIndex,
        speed: party[cmd.actorIndex].agi * (0.5 + Math.random() * 0.5),
        action: cmd
      });
    });

    // Add Sidoh
    battlers.push({
      isEnemy: true,
      index: -1,
      speed: sidoh.agi * (0.5 + Math.random() * 0.5),
      action: { type: 'decide_ai' }
    });

    // Sort descending speed
    battlers.sort((a, b) => b.speed - a.speed);

    setBattleQueue(battlers);
  };

  // Effect for processing turn
  useEffect(() => {
    if (gameState !== 'processingTurn') return;
    if (animating) return;

    if (battleQueue.length === 0) {
      // End of turn
      setTurn(prev => prev + 1);
      // Reset defending status for all party members
      setParty(prevParty => prevParty.map(p => ({ ...p, isDefending: false })));
      setCommandQueue([]);
      setCurrentCharacter(0);
      setGameState('command');
      setSelectedCommand(null);
      setSelectedSpell(null);
      setPendingAction(null);
      return;
    }

    const currentBattler = battleQueue[0];
    performAction(currentBattler);

  }, [gameState, battleQueue, animating]);

  const performAction = (battler) => {
    setAnimating(true);

    let msg = '';
    let newParty = JSON.parse(JSON.stringify(party));
    let newSidoh = { ...sidoh };
    let battleOver = false;

    // Check if actor is dead (if party member)
    if (!battler.isEnemy && newParty[battler.index].status === 'dead') {
      // Skip turn, but maybe show message? "X is dead" usually doesn't show in DQ if already dead.
      // We just skip.
      setTimeout(() => {
        setBattleQueue(prev => prev.slice(1));
        setAnimating(false);
      }, 500); // Short delay
      return;
    }

    // Check if Sidoh is dead (if actor is Sidoh, he can't act)
    if (battler.isEnemy && newSidoh.hp <= 0) {
       // Battle is already won, loop should have stopped or will stop.
       // Skip.
       setTimeout(() => {
         setBattleQueue(prev => prev.slice(1));
         setAnimating(false);
       }, 500);
       return;
    }

    // --- Action Execution ---
    if (battler.isEnemy) {
      // Sidoh's AI
      const aliveParty = newParty.filter(p => p.status !== 'dead');
      if (aliveParty.length === 0) {
         // Should have been Game Over already, but just in case
         battleOver = true;
         setGameState('gameover');
      } else {
         const target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
         const targetIndex = newParty.findIndex(p => p.name === target.name);
         const action = Math.random();

         let damage = 0;
         let attackName = '';

         if (action < 0.3) {
           damage = Math.floor(Math.random() * 60) + 80;
           attackName = 'はげしいほのお';
           msg = `シドーの ${attackName}!\n`;
         } else if (action < 0.5) {
           damage = Math.floor(Math.random() * 40) + 120;
           attackName = 'つうこんのいちげき';
           msg = `シドーの ${attackName}!\n`;
         } else {
           damage = Math.floor(Math.random() * 50) + 60;
           attackName = 'こうげき';
           msg = `シドーの ${attackName}!\n`;
         }

         // Check for defending status
         if (newParty[targetIndex].isDefending) {
            damage = Math.floor(damage / 2);
         }

         newParty[targetIndex].hp = Math.max(0, newParty[targetIndex].hp - damage);
         msg += `${target.name}は ${damage}の ダメージを うけた!`;

         if (newParty[targetIndex].hp === 0) {
           newParty[targetIndex].status = 'dead';
           msg += `\n${target.name}は しんでしまった!`;
         }
      }
    } else {
      // Party Action
      const cmd = battler.action;
      const char = newParty[battler.index];

      if (cmd.type === 'たたかう') {
         // Attack Enemy
         let targetName = sidoh.name; // Default
         if (cmd.target && cmd.target.isEnemy) {
            targetName = cmd.target.name;
         }

         const damage = Math.floor(Math.random() * 40) + char.atk - 60;
         const actualDamage = Math.max(1, damage);
         newSidoh.hp = Math.max(0, newSidoh.hp - actualDamage);
         msg = `${char.name}の こうげき!\n${targetName}に ${actualDamage}の ダメージ!`;
         setIsSidohDamaged(true);
         setTimeout(() => setIsSidohDamaged(false), 500);

      } else if (cmd.type === 'どうぐ') {
         if (cmd.item && cmd.item.name === 'やくそう') {
             // Consume item
             const itemIndex = newParty[battler.index].items.findIndex(i => i.name === 'やくそう');
             if (itemIndex > -1) {
                 newParty[battler.index].items.splice(itemIndex, 1);

                 // Apply effect
                 let target = null;
                 if (cmd.target && !cmd.target.isEnemy) {
                     target = newParty[cmd.target.index];
                 }

                 if (target) {
                    if (target.status === 'dead') {
                        msg = `${char.name}は ${cmd.item.name}を つかった!\nしかし こうかが なかった!`;
                    } else {
                        const heal = Math.min(30, target.maxHp - target.hp); // Yakusou heals ~30
                        // Logic says heal power 30 in data, let's use that or hardcode ~30
                        // Using fixed 30-40 range for flavor? Or fixed 30?
                        // Using logic:
                        const amount = 30 + Math.floor(Math.random() * 10);
                        const actualHeal = Math.min(amount, target.maxHp - target.hp);

                        if (target.hp === target.maxHp) {
                             msg = `${char.name}は ${cmd.item.name}を つかった!\nしかし こうかが なかった!`;
                        } else {
                             target.hp += actualHeal;
                             msg = `${char.name}は ${cmd.item.name}を つかった!\n${target.name}の HPが ${actualHeal} かいふくした!`;
                        }
                    }
                 } else {
                     msg = `${char.name}は ${cmd.item.name}を つかった!\nしかし ターゲットが いない!`;
                 }
             } else {
                 msg = `${char.name}は どうぐを つかおうとしたが\nもっていなかった!`;
             }
         } else {
             msg = `${char.name}は どうぐを つかった!\n\nしかし なにも おこらなかった`;
         }

      } else if (cmd.type === 'にげる') {
         msg = `${char.name}は にげだした!\n\nしかし まわりこまれてしまった!`;
      } else if (cmd.type === 'じゅもん' && cmd.spell) {
         const spell = cmd.spell;
         if (char.mp < spell.mp) {
           msg = 'MPが たりない!';
         } else {
           newParty[battler.index].mp -= spell.mp;

           if (spell.type === 'attack') {
             let targetName = sidoh.name;
             if (cmd.target && cmd.target.isEnemy) targetName = cmd.target.name;

             const damage = Math.floor(Math.random() * 30) + spell.power;
             newSidoh.hp = Math.max(0, newSidoh.hp - damage);
             msg = `${char.name}は ${spell.name}を となえた!\n${targetName}に ${damage}の ダメージ!`;
             setIsSidohDamaged(true);
             setTimeout(() => setIsSidohDamaged(false), 500);

           } else if (spell.type === 'heal') {
             let target = null;
             if (cmd.target && !cmd.target.isEnemy) {
                 target = newParty[cmd.target.index];
             } else {
                 // Fallback (should not happen with new UI)
                 target = newParty.find(p => p.hp > 0 && p.hp < p.maxHp);
             }

             if (target && target.status !== 'dead') {
               const heal = Math.min(spell.power, target.maxHp - target.hp);
               if (heal === 0 && target.hp === target.maxHp) {
                  msg = `${char.name}は ${spell.name}を となえた!\nしかし こうかが なかった!`;
               } else {
                  target.hp += heal;
                  msg = `${char.name}は ${spell.name}を となえた!\n${target.name}の HPが ${heal} かいふくした!`;
               }
             } else {
               msg = `${char.name}は ${spell.name}を となえた!\nしかし こうかが なかった!`;
             }

           } else if (spell.type === 'revive') {
             let target = null;
             if (cmd.target && !cmd.target.isEnemy) {
                 target = newParty[cmd.target.index];
             } else {
                 target = newParty.find(p => p.status === 'dead');
             }

             if (target && target.status === 'dead') {
               if (Math.random() > 0.5 || spell.name === 'ザオリク') {
                 target.status = 'normal';
                 target.hp = Math.floor(target.maxHp / 2);
                 msg = `${char.name}は ${spell.name}を となえた!\n${target.name}は いきかえった!`;
               } else {
                 msg = `${char.name}は ${spell.name}を となえた!\nしかし こうかが なかった!`;
               }
             } else {
               msg = `${char.name}は ${spell.name}を となえた!\nしかし こうかが なかった!`;
             }

           } else if (spell.type === 'buff') {
             // Buff usually targets ally, but currently simplified to self or specific?
             // Assuming self-buff or ally buff?
             // Original: newParty[battler.index].atk (Self)
             // If target is selected, apply to target.

             let target = newParty[battler.index]; // Default self
             if (cmd.target && !cmd.target.isEnemy) {
                 target = newParty[cmd.target.index];
             }

             if (target.status !== 'dead') {
                 target.atk = Math.floor(target.atk * 1.3);
                 msg = `${char.name}は ${spell.name}を となえた!\n${target.name}の こうげきりょくが あがった!`;
             } else {
                 msg = `${char.name}は ${spell.name}を となえた!\nしかし こうかが なかった!`;
             }
           }
         }
      } else if (cmd.type === 'ぼうぎょ') {
         const recoveredMp = Math.min(10, char.maxMp - char.mp);
         newParty[battler.index].mp += recoveredMp;
         newParty[battler.index].isDefending = true;
         msg = `${char.name}は みをまもっている\nMPが ${recoveredMp} かいふくした!`;
      }
    }

    setParty(newParty);
    setSidoh(newSidoh);
    setMessage(msg);

    // After action delay
    setTimeout(() => {
       // Check End Conditions
       if (newSidoh.hp <= 0) {
         setMessage('シドーを たおした!\n\nせかいに へいわが おとずれた・・・');
         setGameState('victory');
         setBattleQueue([]); // Clear queue
         setAnimating(false);
         return;
       }

       const stillAlive = newParty.filter(p => p.status !== 'dead');
       if (stillAlive.length === 0) {
         setMessage('パーティは ぜんめつした・・・');
         setGameState('gameover');
         setBattleQueue([]);
         setAnimating(false);
         return;
       }

       // Proceed to next action
       setBattleQueue(prev => prev.slice(1));
       setAnimating(false);
    }, 2000);
  };

  const startGame = () => {
    setGameState('command');
    setMessage('');
    play(); // バックグラウンド音声再生開始
  };

  const restartGame = () => {
    setParty([
      {
        name: 'ローレシア', level: 44, hp: 189, maxHp: 189, mp: 31, maxMp: 31, atk: 120, def: 80, agi: 70, status: 'normal', canUseMagic: false,
        items: [{ name: 'やくそう', type: 'heal', power: 30 }]
      },
      {
        name: 'サマルトリア', level: 31, hp: 159, maxHp: 159, mp: 93, maxMp: 93, atk: 90, def: 70, agi: 110, status: 'normal', canUseMagic: true,
        items: [{ name: 'やくそう', type: 'heal', power: 30 }]
      },
      {
        name: 'ムーンブルク', level: 28, hp: 105, maxHp: 105, mp: 115, maxMp: 115, atk: 60, def: 50, agi: 140, status: 'normal', canUseMagic: true,
        items: [{ name: 'やくそう', type: 'heal', power: 30 }]
      }
    ]);
    setSidoh({ name: 'シドー', hp: 2000, maxHp: 2000, atk: 180, def: 120, agi: 90, status: 'normal' });
    setCurrentCharacter(0);
    setTurn(0);
    setGameState('intro');
    setMessage('はかいしん シドーが あらわれた!');
    setAnimating(false);
    setCommandQueue([]);
    setBattleQueue([]);
    pause(); // 音声を一時停止してリセット
  };

  const isCommandMode = ['intro', 'command', 'selectAttackType', 'selectSpell', 'selectItem', 'selectTarget', 'victory', 'gameover'].includes(gameState) && !animating;
  const isSubmenuActive = ['selectAttackType', 'selectSpell', 'selectItem', 'selectTarget'].includes(gameState);

  const MAIN_MENU_ITEMS = [
    { label: 'たたかう', value: 'たたかう' },
    { label: 'にげる', value: 'にげる' },
    { label: 'ぼうぎょ', value: 'ぼうぎょ' },
    { label: 'どうぐ', value: 'どうぐ' }
  ];

  const getBattleActionOptions = (charIndex) => {
    const opts = [
      { label: 'ぶきで こうげき', value: 'attack', className: 'submenu-button' }
    ];
    if (party[charIndex].canUseMagic) {
      opts.push({ label: 'じゅもん', value: 'spell', className: 'submenu-button' });
    }
    opts.push({ label: 'もどる', value: 'back', className: 'back-button' });
    return opts;
  };

  // Determine available menu options based on current game state
  const getMenuOptions = () => {
    if (!isCommandMode) return [];

    switch (gameState) {
      case 'intro':
        return [{ label: 'たたかう', action: startGame, className: 'command-button' }];
      case 'command':
        return MAIN_MENU_ITEMS.map(item => ({
          label: item.label,
          action: () => handleCommand(item.value),
          className: 'command-button'
        }));
      case 'selectAttackType':
        return getBattleActionOptions(currentCharacter).map(item => ({
          label: item.label,
          action: () => {
            if (item.value === 'attack') handleAttackType('ぶきで こうげき');
            else if (item.value === 'spell') handleAttackType('じゅもん');
            else if (item.value === 'back') setGameState('command');
          },
          className: item.className
        }));
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
      case 'selectItem':
        const itemOpts = party[currentCharacter].items.map((item, idx) => ({
          label: item.name,
          action: () => handleItem(item),
          className: 'item-button'
        }));
        itemOpts.push({ label: 'もどる', action: () => setGameState('command'), className: 'back-button' });
        return itemOpts;
      case 'selectTarget':
        if (!pendingAction) return [];
        let targets = [];

        // Determine valid targets based on action type
        const isEnemyTarget = (pendingAction.type === 'たたかう') || (pendingAction.type === 'じゅもん' && pendingAction.spell.type === 'attack');

        if (isEnemyTarget) {
          // Target Enemy (Sidoh only for now)
          if (sidoh.hp > 0) {
            targets.push({
               label: sidoh.name,
               action: () => handleTargetSelection({ name: sidoh.name, isEnemy: true }),
               className: 'target-button'
            });
          }
        } else {
          // Target Party (Heal/Buff/Revive)
          party.forEach((member, idx) => {
             targets.push({
               label: member.name,
               action: () => handleTargetSelection({ name: member.name, index: idx, isEnemy: false }),
               className: 'target-button'
             });
          });
        }
        targets.push({
           label: 'もどる',
           action: () => {
             if (pendingAction.type === 'たたかう') setGameState('selectAttackType');
             else if (pendingAction.type === 'じゅもん') setGameState('selectSpell');
             else if (pendingAction.type === 'どうぐ') setGameState('selectItem');
           },
           className: 'back-button'
        });
        return targets;
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
          if (gameState === 'selectTarget') {
             if (pendingAction.type === 'たたかう') setGameState('selectAttackType');
             else if (pendingAction.type === 'じゅもん') setGameState('selectSpell');
             else if (pendingAction.type === 'どうぐ') setGameState('selectItem');
          } else if (gameState === 'selectItem') {
            setGameState('command');
          } else if (gameState === 'selectAttackType') {
            setGameState('command');
          } else if (gameState === 'selectSpell') {
            setGameState('selectAttackType');
          } else if (gameState === 'command' && currentCharacter > 0) {
            setCurrentCharacter(prev => prev - 1);
            setCommandQueue(prev => prev.slice(0, -1));
            setSelectedIndex(0);
          }
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
          <img src={sidohImg} alt="シドー" className={`enemy-image ${isSidohDamaged ? 'damage' : ''}`} />
        </div>

        {/* Bottom Panel (Command & Message) */}
        <div className={`bottom-panel ${isCommandMode ? 'mode-split' : 'mode-full'}`}>
          {/* Command Window Section */}
          {isCommandMode && (
            <div className="command-section">
               {/* Main Command Window */}
               <div className={`command-window ${isSubmenuActive ? 'inactive' : ''}`}>
                  <div className="command-grid">
                     {isSubmenuActive ? (
                        MAIN_MENU_ITEMS.map((cmd, idx) => (
                           <button
                             key={idx}
                             className={`command-button ${selectedCommand === cmd.value ? 'selected' : ''}`}
                             disabled={true}
                           >
                             {cmd.label}
                           </button>
                        ))
                     ) : (
                        menuOptions.map((opt, idx) => (
                           <button
                             key={idx}
                             onClick={opt.action}
                             disabled={opt.disabled}
                             className={`${opt.className} ${selectedIndex === idx ? 'selected' : ''}`}
                             onMouseEnter={() => setSelectedIndex(idx)}
                           >
                             {opt.label}
                           </button>
                        ))
                     )}
                  </div>
               </div>

               {/* Column 2: Attack/Spell Selection OR Item Selection */}
               {/* Determine if we should show the Action Type window (Attack/Spell/Back) or Item Window */}

               {/* Logic for Column 2:
                   Visible if: selectAttackType, selectSpell, selectTarget (from Attack/Spell), or selectItem

                   Wait, selectItem is its own Column 2.
               */}

               {/* Submenu Window (Attack Type Selection) */}
               {/* Show if we are in selectAttackType, selectSpell, or selectTarget (coming from Attack/Spell) */}
               { (gameState === 'selectAttackType' || gameState === 'selectSpell' || (gameState === 'selectTarget' && pendingAction?.type !== 'どうぐ')) && (
                  <div className={`submenu-window ${gameState === 'selectSpell' || gameState === 'selectTarget' ? 'inactive' : ''}`}>
                     <div className="submenu-list">
                        {/* If inactive, show static options. If active, show menuOptions */}
                        {(gameState === 'selectSpell' || gameState === 'selectTarget') ? (
                           getBattleActionOptions(currentCharacter).map((item, idx) => (
                            <button
                              key={idx}
                              className={`${item.className} ${
                                (item.value === 'spell' && pendingAction?.type === 'じゅもん') || (item.value === 'attack' && pendingAction?.type === 'たたかう') ? 'selected' : ''
                              }`}
                              disabled={true}
                            >
                              {item.label}
                            </button>
                          ))
                        ) : (
                           menuOptions.map((opt, idx) => (
                             <button
                               key={idx}
                               onClick={opt.action}
                               disabled={opt.disabled}
                               className={`${opt.className} ${selectedIndex === idx ? 'selected' : ''}`}
                               onMouseEnter={() => setSelectedIndex(idx)}
                             >
                               {opt.label}
                             </button>
                           ))
                        )}
                     </div>
                  </div>
               )}

               {gameState === 'selectItem' || (gameState === 'selectTarget' && pendingAction?.type === 'どうぐ') ? (
                  <div className={`item-window ${gameState === 'selectTarget' ? 'inactive' : ''}`}>
                     <div className="item-list">
                       {gameState === 'selectTarget' ? (
                          // Inactive Item View
                          party[currentCharacter].items.map((item, idx) => (
                            <button
                              key={idx}
                              className={`item-button ${pendingAction.item.name === item.name ? 'selected' : ''}`}
                              disabled={true}
                            >
                              {item.name}
                            </button>
                          ))
                       ) : (
                          menuOptions.map((opt, idx) => (
                             <button
                               key={idx}
                               onClick={opt.action}
                               disabled={opt.disabled}
                               className={`${opt.className} ${selectedIndex === idx ? 'selected' : ''}`}
                               onMouseEnter={() => setSelectedIndex(idx)}
                             >
                               {opt.label}
                             </button>
                          ))
                       )}
                     </div>
                  </div>
               ) : null}

               {/* Column 3: Spell List */}
               {(gameState === 'selectSpell' || (gameState === 'selectTarget' && pendingAction?.type === 'じゅもん')) && (
                  <div className={`spell-window ${gameState === 'selectTarget' ? 'inactive' : ''}`}>
                     <div className="spell-list">
                        {gameState === 'selectTarget' ? (
                           // Inactive Spell View
                           spells[currentCharacter].map((spell, idx) => (
                             <button
                               key={idx}
                               className={`spell-button ${pendingAction.spell.name === spell.name ? 'selected' : ''}`}
                               disabled={true}
                             >
                               <span className="spell-name">{spell.name}</span>
                               <span className="spell-cost">MP {spell.mp}</span>
                             </button>
                           ))
                        ) : (
                           menuOptions.map((opt, idx) => (
                             <button
                               key={idx}
                               onClick={opt.action}
                               disabled={opt.disabled}
                               className={`${opt.className} ${selectedIndex === idx ? 'selected' : ''}`}
                               onMouseEnter={() => setSelectedIndex(idx)}
                             >
                               {opt.label}
                             </button>
                           ))
                        )}
                     </div>
                  </div>
               )}

               {/* Column 3 or 4: Target Selection */}
               {gameState === 'selectTarget' && (
                  <div className="target-window">
                     <div className="target-list">
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
               )}
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
