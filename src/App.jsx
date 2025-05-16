import React, { useState, useEffect } from 'react';
import baseWords from './data/words';
import goodwords from './data/goodwords';

const wordGroups = {
  ALL: [/*...baseWords, */...goodwords],
  //BASE: baseWords,
  GOOD: goodwords
};

function App() {
  const [group, setGroup] = useState('ALL');
  const [level, setLevel] = useState('ALL');
  const [wordIndex, setWordIndex] = useState(0);
  const [gameMode, setGameMode] = useState('flashcard'); // 'flashcard', 'listening', or 'word-listening'
  const [coins, setCoins] = useState(0); // 初始金币数
  const [options, setOptions] = useState([]); // 听音辨字/词的选项
  const [selectedOption, setSelectedOption] = useState(null); // 用户选择的选项
  const [showResult, setShowResult] = useState(false); // 是否显示结果
  const [lastReward, setLastReward] = useState(0); // 上次奖励/惩罚金额
  const [skipsLeft, setSkipsLeft] = useState(3); // 剩余跳过次数
  const [showPrize, setShowPrize] = useState(false); // 是否显示摇奖机
  const [prize, setPrize] = useState(null); // 摇奖结果
  const [secondChance, setSecondChance] = useState(false); // 是否是第二次机会
  const [disabledOptions, setDisabledOptions] = useState([]); // 禁用的选项
  const [correctHistory, setCorrectHistory] = useState([]); // 答对的历史记录
  const [showSidebar, setShowSidebar] = useState(false); // 是否显示边栏
  const [streak, setStreak] = useState(0); // 连续答对次数
  const [showShop, setShowShop] = useState(false); // 是否显示商店
  const [inventory, setInventory] = useState({ // 用户拥有的物品
    hints: 0,      // 提示次数
    skips: 3,      // 跳过次数
    streakSaver: 0 // 连击保护
  });

  const filteredWords = React.useMemo(() => {
    const source = wordGroups[group];
    const selected = level === 'ALL' ? source : source.filter(w => w.level === level);
    return [...selected].sort(() => Math.random() - 0.5);
  }, [level, group]);

  const currentWord = filteredWords[wordIndex % filteredWords.length];

  // 生成听音辨字的选项
  useEffect(() => {
    if (gameMode === 'listening' && filteredWords.length > 0) {
      const correctAnswer = currentWord;
      // 随机选择3个干扰项
      const otherOptions = [...filteredWords]
        .filter(word => word.hanzi !== correctAnswer.hanzi)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      // 合并正确答案和干扰项，并随机排序
      const allOptions = [correctAnswer, ...otherOptions].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
      setSelectedOption(null);
      setShowResult(false);
    } else if (gameMode === 'word-listening' && filteredWords.length > 0) {
    // 确保所有选项的词汇都有词语示例
    const wordsWithExamples = filteredWords.filter(word => 
      word.example_words && word.example_words.length > 0
    );
    
    if (wordsWithExamples.length >= 4) {
      const correctAnswer = currentWord;
      // 随机选择3个干扰项
      const otherOptions = [...wordsWithExamples]
        .filter(word => word.hanzi !== correctAnswer.hanzi)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
        
      // 合并正确答案和干扰项，并随机排序
      const allOptions = [correctAnswer, ...otherOptions].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
    } else {
      // 如果没有足够的带词语的汉字，回退到普通的听音辨字
      const correctAnswer = currentWord;
      const otherOptions = [...filteredWords]
        .filter(word => word.hanzi !== correctAnswer.hanzi)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const allOptions = [correctAnswer, ...otherOptions].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
    }
    
    setSelectedOption(null);
    setShowResult(false);
  }
}, [wordIndex, gameMode, filteredWords, currentWord]);

  const handleNext = () => {
    setWordIndex(prev => prev + 1);
    setSelectedOption(null);
    setShowResult(false);
    setShowPrize(false);
    setPrize(null);
    setSecondChance(false);
    setDisabledOptions([]);
    
    // 使用setTimeout确保在状态更新和重新渲染后播放声音
    setTimeout(() => {
      if (gameMode === 'listening') {
        handleSpeak(filteredWords[(wordIndex + 1) % filteredWords.length].hanzi);
      } else if (gameMode === 'word-listening') {
        const nextWord = filteredWords[(wordIndex + 1) % filteredWords.length];
        // 如果有example_words，随机选择一个单词播放
        if (nextWord.example_words && nextWord.example_words.length > 0) {
          const randomIndex = Math.abs(nextWord.hanzi.charCodeAt(0)) % nextWord.example_words.length;
          const wordToPlay = nextWord.example_words[randomIndex].word;
          handleSpeak(wordToPlay);
        }
      }
    }, 100);
  };

  const handleSkip = () => {
    if (inventory.skips > 0) {
      setInventory(prev => ({...prev, skips: prev.skips - 1}));
      handleNext();
    }
  };
  
  const useHint = () => {
    if (inventory.hints > 0 && gameMode === 'listening' && !showResult) {
      setInventory(prev => ({...prev, hints: prev.hints - 1}));
      
      // 找出正确答案
      const correctOption = options.find(opt => opt.hanzi === currentWord.hanzi);
      
      // 随机选择两个错误答案禁用
      const wrongOptions = options.filter(opt => opt.hanzi !== currentWord.hanzi);
      // 打乱错误选项顺序
      const shuffledWrongs = [...wrongOptions].sort(() => Math.random() - 0.5);
      // 选择前两个错误选项禁用
      const toDisable = shuffledWrongs.slice(0, 2).map(opt => opt.hanzi);
      
      setDisabledOptions(toDisable);
      setSecondChance(true); // 进入第二次机会模式
    }
  };

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+H 切换边栏显示
      if (e.ctrlKey && e.key === 'h') {
        setShowSidebar(prev => !prev);
      }
      // Ctrl+S 切换商店显示
      if (e.ctrlKey && e.key === 's') {
        setShowShop(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSpeak = (text) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    speechSynthesis.speak(utterance);
  };

  const handleOptionSelect = (option) => {
    // 如果选项被禁用，则不做任何处理
    if (disabledOptions.includes(option.hanzi)) return;
    
    // 如果已经显示结果且不是第二次机会，不允许再选择
    if (showResult && !secondChance) return;
    
    setSelectedOption(option);
    
    // 判断是否选择正确
    const isCorrect = option.hanzi === currentWord.hanzi;
    
    if (isCorrect) {
      setShowResult(true);
      setSecondChance(false);
      
      // 增加连击数并计算奖励
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // 根据连击数给予额外奖励
      let reward = 1; // 基础奖励
      let streakBonus = 0;
      
      if (newStreak >= 10) {
        streakBonus = 4; // 10连击及以上，额外奖励4金币
      } else if (newStreak >= 5) {
        streakBonus = 2; // 5-9连击，额外奖励2金币
      } else if (newStreak >= 3) {
        streakBonus = 1; // 3-4连击，额外奖励1金币
      }
      
      const totalReward = reward + streakBonus;
      setCoins(prev => prev + totalReward);
      setLastReward(totalReward);
      
      // 将正确答案添加到历史记录
      const currentWordWithTimestamp = {
        ...currentWord,
        timestamp: new Date().toISOString()
      };
      setCorrectHistory(prev => [currentWordWithTimestamp, ...prev].slice(0, 20)); // 只保留最近20个
      
      // 检查是否达到5个金币
      if (coins + totalReward >= 5) {
        setShowPrize(true);
        // 扩展奖品池
        const prizes = [
          { id: "kiss", name: "1个亲亲", icon: "💋", rarity: "common" },
          { id: "dollar", name: "1美元", icon: "💵", rarity: "common" },
          { id: "hint", name: "提示卡", icon: "💡", rarity: "uncommon", effect: () => setInventory(prev => ({...prev, hints: prev.hints + 1})) },
          { id: "skip", name: "跳过卡", icon: "⏭️", rarity: "uncommon", effect: () => setInventory(prev => ({...prev, skips: prev.skips + 1})) },
          { id: "streakSaver", name: "连击保护", icon: "🛡️", rarity: "rare", effect: () => setInventory(prev => ({...prev, streakSaver: prev.streakSaver + 1})) },
          { id: "jackpot", name: "头奖！", icon: "🏆", rarity: "legendary", effect: () => setCoins(prev => prev + 10) }
        ];
        
        // 根据稀有度分配概率
        const commonPool = prizes.filter(p => p.rarity === "common");
        const uncommonPool = prizes.filter(p => p.rarity === "uncommon");
        const rarePool = prizes.filter(p => p.rarity === "rare");
        const legendaryPool = prizes.filter(p => p.rarity === "legendary");
        
        // 随机决定稀有度
        const rarityRoll = Math.random() * 100;
        let selectedPool;
        
        if (rarityRoll < 1) { // 1%几率获得传奇奖品
          selectedPool = legendaryPool;
        } else if (rarityRoll < 10) { // 9%几率获得稀有奖品
          selectedPool = rarePool;
        } else if (rarityRoll < 40) { // 30%几率获得罕见奖品
          selectedPool = uncommonPool;
        } else { // 60%几率获得普通奖品
          selectedPool = commonPool;
        }
        
        // 从选定的池中随机选择一个奖品
        const selectedPrize = selectedPool[Math.floor(Math.random() * selectedPool.length)];
        setPrize(selectedPrize);
      }
    } else {
      // 如果已经是第二次机会但还是错了
      if (secondChance) {
        setShowResult(true);
        
        // 检查是否有连击保护
        if (inventory.streakSaver > 0 && streak > 0) {
          // 使用连击保护
          setInventory(prev => ({...prev, streakSaver: prev.streakSaver - 1}));
          // 不扣金币，不重置连击
          setLastReward(0);
        } else {
          // 没有连击保护，重置连击并扣金币
          setStreak(0);
          setCoins(prev => Math.max(0, prev - 1)); // 防止金币小于0
          setLastReward(-1);
        }
        
        setSecondChance(false);
      } else {
        // 第一次选错，进入第二次机会模式
        setSecondChance(true);
        
        // 找出错误选项（不是正确答案的选项）
        const wrongOptions = options.filter(opt => opt.hanzi !== currentWord.hanzi);
        
        // 用户选择的错误选项
        const userSelectedWrong = option.hanzi;
        
        // 从剩余的错误选项中随机选择一个
        const remainingWrongs = wrongOptions.filter(opt => opt.hanzi !== userSelectedWrong);
        const randomWrongIndex = Math.floor(Math.random() * remainingWrongs.length);
        const secondWrong = remainingWrongs[randomWrongIndex]?.hanzi;
        
        // 设置禁用的选项（用户选的错误 + 另一个随机错误）
        const newDisabled = [userSelectedWrong];
        if (secondWrong) newDisabled.push(secondWrong);
        setDisabledOptions(newDisabled);
        
        setSelectedOption(null); // 清除选择
      }
    }
  };

  const switchToFlashcard = () => {
    setGameMode('flashcard');
  };

  const switchToListening = () => {
    setGameMode('listening');
    // 自动播放当前汉字的发音
    setTimeout(() => {
      handleSpeak(currentWord.hanzi);
    }, 100);
  };
  
  const switchToWordListening = () => {
    setGameMode('word-listening');
    // 自动播放当前词的发音
    setTimeout(() => {
      if (currentWord.example_words && currentWord.example_words.length > 0) {
        // 使用一个稳定的随机索引，确保播放的词汇是屏幕上显示的词汇之一
        const randomIndex = Math.abs(currentWord.hanzi.charCodeAt(0)) % currentWord.example_words.length;
        const wordToPlay = currentWord.example_words[randomIndex].word;
        handleSpeak(wordToPlay);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-6 relative">
      {/* 答对历史记录边栏 */}
      <button 
        onClick={() => setShowSidebar(!showSidebar)}
        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md z-20 hover:bg-gray-100"
      >
        {showSidebar ? '❌' : '📚'}
      </button>
      
      <div className={`fixed top-0 right-0 h-full bg-white shadow-lg w-64 z-10 transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
        <div className="p-4">
          <h3 className="text-lg font-bold border-b pb-2 mb-4">已掌握的汉字 ({correctHistory.length})</h3>
          {correctHistory.length === 0 ? (
            <p className="text-gray-500 text-center">还没有答对的汉字</p>
          ) : (
            <div className="space-y-2">
              {correctHistory.map((word, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div>
                    <span className="text-xl font-bold">{word.hanzi}</span>
                    <div className="text-xs text-gray-500">{word.pinyin} - {word.meaning_en}</div>
                  </div>
                  <button 
                    onClick={() => handleSpeak(word.hanzi)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
        🇨🇳 Chinese Flashcards
      </h1>
      
      <div className="flex items-center mb-4 bg-white rounded-full px-4 py-2 shadow-md">
        <span className="text-yellow-500 font-bold mr-2">🪙 {coins}</span>
        {lastReward !== 0 && (
          <span className={`mr-3 ${lastReward > 0 ? 'text-green-500' : 'text-red-500'} font-bold`}>
            {lastReward > 0 ? `+${lastReward}` : lastReward}
          </span>
        )}
        <span className="text-blue-500 mr-3">⏭️ {inventory.skips}</span>
        <span className="text-amber-500 mr-3">💡 {inventory.hints}</span>
        <span className="text-red-500 mr-3">🛡️ {inventory.streakSaver}</span>
        {streak > 0 && (
          <span className="text-purple-500 font-bold ml-2 flex items-center">
            🔥 {streak} <span className="text-xs ml-1">streak</span>
          </span>
        )}
        
        <button 
          onClick={() => setShowShop(true)}
          className="ml-auto bg-blue-500 text-white text-xs rounded-full px-2 py-1 hover:bg-blue-600 transition"
        >
          商店 Shop
        </button>
      </div>

      <div className="flex space-x-4 mb-4">
        <button 
          onClick={switchToFlashcard}
          className={`px-4 py-2 rounded-lg shadow-sm ${gameMode === 'flashcard' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}
        >
          闪卡模式<br/>
          <span className="text-xs">Flashcard Mode</span>
        </button>
        <button 
          onClick={switchToListening}
          className={`px-4 py-2 rounded-lg shadow-sm ${gameMode === 'listening' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}
        >
          听音辨字<br/>
          <span className="text-xs">Character Listening</span>
        </button>
        <button 
          onClick={switchToWordListening}
          className={`px-4 py-2 rounded-lg shadow-sm ${gameMode === 'word-listening' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}
        >
          听音辨词<br/>
          <span className="text-xs">Word Listening</span>
        </button>
      </div>

      {/* 选择词源 */}
      <div className="flex space-x-2 mb-4">
        <select
          value={group}
          onChange={(e) => { setGroup(e.target.value); setWordIndex(0); }}
          className="p-2 rounded-lg border shadow-sm bg-white"
        >
          <option value="ALL">All Words</option>
          <option value="GOOD">Good Words</option>
        </select>

        <select
          value={level}
          onChange={(e) => { setLevel(e.target.value); setWordIndex(0); }}
          className="p-2 rounded-lg border shadow-sm bg-white"
        >
          <option value="ALL">All Levels</option>
          {/* 可以添加更多级别选项 */}
        </select>
      </div>

      {gameMode === 'flashcard' ? (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center transition duration-500">
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-4xl font-semibold text-gray-800">{currentWord.hanzi}</h2>
            <button onClick={() => handleSpeak(currentWord.hanzi)} className="text-lg">🔊</button>
          </div>
          <p className="text-gray-500 mt-2 text-xl">{currentWord.pinyin} (Tone {currentWord.tone})</p>

          <div className="text-sm text-gray-600 mt-2">
            <p><strong>Radical:</strong> {currentWord.radical}</p>
            <p><strong>Strokes:</strong> {currentWord.strokes}</p>
            <p><strong>Meaning:</strong> {currentWord.meaning_en}</p>
            <p><strong>Traditional:</strong> {currentWord.traditional}</p>
          </div>

          {/* 例词 */}
          {currentWord.example_words?.length > 0 && (
            <div className="mt-4 text-sm text-gray-700">
              <strong>Example Words:</strong>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                {currentWord.example_words.map((ex, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span>{ex.word} ({ex.pinyin}) - {ex.meaning_en}</span>
                    <button onClick={() => handleSpeak(ex.word)} className="text-sm">🔊</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 例句 */}
          {currentWord.example_sentence && (
            <div className="mt-4 text-sm text-gray-700">
              <strong>Example Sentence:</strong>
              <p className="mt-1 italic">"{currentWord.example_sentence.cn}" 
                <button onClick={() => handleSpeak(currentWord.example_sentence.cn)} className="ml-2 text-sm">🔊</button>
              </p>
              <p className="text-gray-500">{currentWord.example_sentence.pinyin}</p>
              <p className="text-gray-500">{currentWord.example_sentence.en}</p>
            </div>
          )}

          {currentWord.notes && (
            <div className="mt-4 text-sm text-gray-500 italic">Note: {currentWord.notes}</div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center transition duration-500">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">听音辨字</h2>
          
          <div className="flex justify-center mb-4">
            <button 
              onClick={() => handleSpeak(currentWord.hanzi)} 
              className="p-4 bg-blue-100 rounded-full hover:bg-blue-200 transition"
            >
              <span className="text-3xl">🔊</span>
            </button>
          </div>
          
          <p className="text-gray-600 mb-4">请听发音并选择正确的汉字</p>
          
          <div className="grid grid-cols-2 gap-3">
            {options.map((option, idx) => {
              // 判断选项是否被禁用
              const isDisabled = disabledOptions.includes(option.hanzi);
              // 判断是否是用户选择的选项
              const isSelected = selectedOption?.hanzi === option.hanzi;
              // 判断是否是正确答案
              const isCorrect = option.hanzi === currentWord.hanzi;
              
              // 截取简短的英文含义（取第一个分号前的内容或前15个字符）
              let shortMeaning = option.meaning_en;
              if (shortMeaning.includes(';')) {
                shortMeaning = shortMeaning.split(';')[0].trim();
              }
              // 如果英文含义太长，截取前15个字符
              if (shortMeaning.length > 15) {
                shortMeaning = shortMeaning.substring(0, 15) + '...';
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  disabled={showResult && !secondChance}
                  className={`p-3 rounded-xl border-2 transition flex flex-col items-center ${
                    isDisabled 
                      ? 'bg-red-100 border-red-500 text-gray-400 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? isCorrect
                          ? 'bg-green-100 border-green-500'
                          : 'bg-red-100 border-red-500'
                        : showResult && isCorrect
                          ? 'bg-green-100 border-green-500'
                          : 'bg-white border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <div className="text-2xl">{option.hanzi}</div>
                  
                  {/* 只有在显示结果时才显示拼音，且只显示正确答案的拼音 */}
                  {showResult && isCorrect && (
                    <div className="text-sm text-gray-600 mt-1">{option.pinyin}</div>
                  )}
                  
                  {/* 在第二次机会或显示结果时显示英文含义 */}
                  {(showResult || secondChance) && (
                    <div className="text-xs text-gray-500 mt-1 max-w-full overflow-hidden">
                      {shortMeaning}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {showResult && (
            <div className={`mt-4 p-2 rounded-lg ${selectedOption.hanzi === currentWord.hanzi ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {selectedOption.hanzi === currentWord.hanzi ? (
                <div>
                  <p className="font-bold">✓ 正确！Correct!</p>
                  <p>奖励 Reward: +1 金币 coin</p>
                </div>
              ) : (
                <div>
                  <p className="font-bold">✗ 错误！Wrong!</p>
                  <p>正确答案 Correct answer: {currentWord.hanzi} ({currentWord.pinyin})</p>
                  <p>失去 Lost: 1 金币 coin</p>
                </div>
              )}
              <p className="mt-2 text-gray-700">{currentWord.meaning_en}</p>
            </div>
          )}
          
          {secondChance && !showResult && (
            <div className="mt-4 p-2 rounded-lg bg-yellow-100 text-yellow-800">
              <p className="font-bold">再试一次！Try again!</p>
              <p>红色选项已被排除，请从剩余选项中选择</p>
              <p className="text-xs">Red options are eliminated, please choose from the remaining options</p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleNext}
        className="mt-6 bg-red-600 text-white px-5 py-2 rounded-xl shadow hover:bg-red-700 transition"
      >
        Next Word
      </button>

      {gameMode === 'listening' && (
        <button
          onClick={handleSkip}
          disabled={inventory.skips <= 0}
          className={`mt-2 px-5 py-2 rounded-xl shadow transition ${
            inventory.skips > 0 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {inventory.skips > 0 ? `Skip (${inventory.skips} left)` : "Can't skip more!"}
        </button>
      )}
      
      {gameMode === 'word-listening' && (
        <button
          onClick={handleSkip}
          disabled={inventory.skips <= 0}
          className={`mt-2 px-5 py-2 rounded-xl shadow transition ${
            inventory.skips > 0 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {inventory.skips > 0 ? `Skip (${inventory.skips} left)` : "Can't skip more!"}
        </button>
      )}

      {/* 摇奖机 */}
      {showPrize && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-sm text-center">
            <div className="relative">
              <h2 className="text-2xl font-bold mb-2">🎉 恭喜! Congratulations!</h2>
              <p className="mb-6">你获得了 You won:</p>
              
              {/* 奖品容器 */}
              <div className="relative mb-8">
                {/* 奖品显示 */}
                <div className="flex flex-col items-center relative">
                  <div className={`text-5xl mb-2 ${
                    prize.rarity === 'legendary' ? 'animate-bounce' : 
                    prize.rarity === 'rare' ? 'text-purple-600' : 
                    prize.rarity === 'uncommon' ? 'text-blue-500' : 
                    'text-gray-700'
                  }`}>
                    {prize.name}
                  </div>
                  <div className={`text-xs uppercase tracking-wider ${
                    prize.rarity === 'legendary' ? 'text-yellow-500' : 
                    prize.rarity === 'rare' ? 'text-purple-600' : 
                    prize.rarity === 'uncommon' ? 'text-blue-500' : 
                    'text-gray-500'
                  }`}>
                    {prize.rarity}
                  </div>
                </div>
                
                {/* 闪光效果 */}
                {prize.rarity === 'legendary' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-500 opacity-20 rounded-lg animate-pulse"></div>
                )}
                {prize.rarity === 'rare' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-purple-500 opacity-10 rounded-lg"></div>
                )}
              </div>
              
              <button 
                onClick={() => {
                  setCoins(0); // 重置金币数
                  setShowPrize(false);
                  // 如果奖品有效果函数，执行它
                  if (prize.effect) {
                    prize.effect();
                  }
                }}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow hover:bg-blue-700 transition"
              >
                领取奖励 Claim Prize
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 商店 */}
      {showShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">🛍️ 商店 Shop</h2>
              <div className="text-yellow-500 font-bold">🪙 {coins}</div>
              <button 
                onClick={() => setShowShop(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3 mb-4">
              {/* 提示卡 */}
              <div className="border rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">💡</div>
                  <div>
                    <div className="font-semibold">提示卡 Hint Card</div>
                    <div className="text-xs text-gray-500">排除两个错误选项</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (coins >= 3) {
                      setCoins(prev => prev - 3);
                      setInventory(prev => ({...prev, hints: prev.hints + 1}));
                    }
                  }}
                  disabled={coins < 3}
                  className={`px-3 py-1 rounded-lg ${
                    coins >= 3 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  购买 3🪙
                </button>
              </div>
              
              {/* 跳过卡 */}
              <div className="border rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">⏭️</div>
                  <div>
                    <div className="font-semibold">跳过卡 Skip Card</div>
                    <div className="text-xs text-gray-500">跳过困难的题目</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (coins >= 2) {
                      setCoins(prev => prev - 2);
                      setInventory(prev => ({...prev, skips: prev.skips + 1}));
                    }
                  }}
                  disabled={coins < 2}
                  className={`px-3 py-1 rounded-lg ${
                    coins >= 2 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  购买 2🪙
                </button>
              </div>
              
              {/* 连击保护 */}
              <div className="border rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🛡️</div>
                  <div>
                    <div className="font-semibold">连击保护 Streak Saver</div>
                    <div className="text-xs text-gray-500">答错时保持连击</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (coins >= 5) {
                      setCoins(prev => prev - 5);
                      setInventory(prev => ({...prev, streakSaver: prev.streakSaver + 1}));
                    }
                  }}
                  disabled={coins < 5}
                  className={`px-3 py-1 rounded-lg ${
                    coins >= 5 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  购买 5🪙
                </button>
              </div>
            </div>
            
            <div className="text-xs text-center text-gray-500 mt-4">
              连击越多，奖励越丰厚！<br/>
              The longer your streak, the better your rewards!
            </div>
          </div>
        </div>
      )}

      {/* 使用提示按钮 */}
      {(gameMode === 'listening' || gameMode === 'word-listening') && !showResult && (
        <button
          onClick={useHint}
          disabled={inventory.hints <= 0}
          className={`mt-2 px-5 py-2 rounded-xl shadow transition ${
            inventory.hints > 0 
              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {inventory.hints > 0 ? `Use Hint (${inventory.hints} left)` : "No hints available!"}
        </button>
      )}
    </div>
  );
}

export default App; 