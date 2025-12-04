import React, { useState } from 'react';
import './DQ2SidohBattle.css';
import { useBackgroundAudio } from './hooks/useBackgroundAudio';

const DQ2SidohBattle = () => {
  const [gameState, setGameState] = useState('intro');
  const [turn, setTurn] = useState(0);
  const [message, setMessage] = useState('はかいしん シドーが あらわれた!');
  const [currentCharacter, setCurrentCharacter] = useState(0);
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [animating, setAnimating] = useState(false);
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
          <div className="enemy-placeholder">シドー</div>
        </div>

        <div className="battle-footer">
          <div className="footer-command-area">
            {gameState === 'intro' && (
              <div className="command-container">
                <button onClick={startGame} className="start-button">
                  たたかう
                </button>
              </div>
            )}

            {gameState === 'command' && (
              <div className="command-window">
                <div className="command-grid">
                  <button
                    onClick={() => handleCommand('たたかう')}
                    disabled={animating}
                    className="command-button"
                  >
                    たたかう
                  </button>
                  <button
                    onClick={() => handleCommand('にげる')}
                    disabled={animating}
                    className="command-button"
                  >
                    にげる
                  </button>
                  <button
                    onClick={() => handleCommand('ぼうぎょ')}
                    disabled={animating}
                    className="command-button"
                  >
                    ぼうぎょ
                  </button>
                  <button
                    onClick={() => handleCommand('どうぐ')}
                    disabled={animating}
                    className="command-button"
                  >
                    どうぐ
                  </button>
                </div>
              </div>
            )}

            {gameState === 'selectAttackType' && (
              <div className="submenu-window">
                <div className="submenu-list">
                  <button
                    onClick={() => handleAttackType('ぶきで こうげき')}
                    disabled={animating}
                    className="submenu-button"
                  >
                    ぶきで こうげき
                  </button>
                  {party[currentCharacter].canUseMagic && (
                    <button
                      onClick={() => handleAttackType('じゅもん')}
                      disabled={animating}
                      className="submenu-button"
                    >
                      じゅもん
                    </button>
                  )}
                  <button
                    onClick={() => setGameState('command')}
                    disabled={animating}
                    className="back-button"
                  >
                    もどる
                  </button>
                </div>
              </div>
            )}

            {gameState === 'selectSpell' && (
              <div className="submenu-window">
                <div className="spell-list">
                  {spells[currentCharacter].map((spell, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSpell(spell)}
                      disabled={animating || party[currentCharacter].mp < spell.mp}
                      className="spell-button"
                    >
                      <span className="spell-name">{spell.name}</span>
                      <span className="spell-cost">MP {spell.mp}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setGameState('selectAttackType')}
                    disabled={animating}
                    className="back-button"
                  >
                    もどる
                  </button>
                </div>
              </div>
            )}

            {(gameState === 'victory' || gameState === 'gameover') && (
              <div className="command-container">
                <button onClick={restartGame} className="restart-button">
                  もういちど
                </button>
              </div>
            )}
          </div>

          <div className="footer-message-area">
            <div className="message-box">
              <div className="message-text">{message}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DQ2SidohBattle;
