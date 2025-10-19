(() => {
  const semitoneNames = [
    "ユニゾン (完全1度)",
    "短2度",
    "長2度",
    "短3度",
    "長3度",
    "完全4度",
    "増4度/減5度 (トライトーン)",
    "完全5度",
    "短6度",
    "長6度",
    "短7度",
    "長7度",
    "完全8度 (オクターブ)",
  ];
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  let audioCtx = null;
  let current = {
    rootFreq: null,
    rootNote: null,
    semitones: null,
    direction: "up",
  };
  let stats = { correct: 0, total: 0 };

  function ensureAudio() {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function freqFromNoteNumber(noteNumber) {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }

  function noteNameFromNumber(noteNumber) {
    const name = noteNames[noteNumber % 12];
    const octave = Math.floor(noteNumber / 12) - 1;
    return name + octave;
  }

  function playTone(freq, when = 0, dur = 0.7, wave = "sine") {
    ensureAudio();
    const now = audioCtx.currentTime + when;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.8, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function randomRootNoteNumber() {
    const noteMin = 48; // C3
    const noteMax = 71; // B4
    return Math.floor(Math.random() * (noteMax - noteMin + 1)) + noteMin;
  }

  function generateQuestion() {
    const dirSetting = document.getElementById("direction").value;
    const maxSemi = parseInt(document.getElementById("maxSemitones").value, 10);
    const dir =
      dirSetting === "either"
        ? Math.random() < 0.5
          ? "up"
          : "down"
        : dirSetting;
    const semitone = Math.floor(Math.random() * (maxSemi + 1));

    const rootSetting = document.getElementById("rootNoteSetting").value;
    let rootNote;

    if (rootSetting === "random") {
      // ランダム
      rootNote = randomRootNoteNumber();
    } else if (rootSetting === "fix_current" && current.rootNote !== null) {
      // 現在の音を固定
      rootNote = current.rootNote;
    } else if (!isNaN(parseInt(rootSetting, 10))) {
      // C4などの特定の音が選択されている場合
      rootNote = parseInt(rootSetting, 10);
    } else {
      // 上記以外（最初の問題など）はランダム
      rootNote = randomRootNoteNumber();
    }
    const rootFreq = freqFromNoteNumber(rootNote);

    current = { rootFreq, rootNote, semitones: semitone, direction: dir };
    // 問題の生成時に選択肢とルート音をすぐに表示しないように変更
    document.getElementById("feedback").textContent =
      "問題を再生して答えてください。";
  }

  function showRootInfo() {
    const name = noteNameFromNumber(current.rootNote);
    document.getElementById("rootInfo").textContent = `🎵 ルート音：${name}`;
  }

  function renderChoices(maxSemi) {
    const container = document.getElementById("choices");
    container.innerHTML = "";
    const arr = Array.from({ length: maxSemi + 1 }, (_, i) => i);
    arr.forEach((n) => {
      const btn = document.createElement("button");
      btn.textContent = `${semitoneNames[n] || n}`;
      btn.onclick = () => submitAnswer(n);
      container.appendChild(btn);
    });
  }

  function submitAnswer(selected) {
    const fb = document.getElementById("feedback");
    const correct = selected === current.semitones;
    stats.total += 1;
    if (correct) stats.correct += 1;

    const dirLabel = current.direction === "up" ? "上行" : "下行";
    const targetNote =
      current.direction === "up"
        ? current.rootNote + current.semitones
        : current.rootNote - current.semitones;
    const targetName = noteNameFromNumber(targetNote);

    fb.className = "result " + (correct ? "correct" : "wrong");
    fb.innerHTML = `${correct ? "✅ 正解！" : "❌ 不正解"}<br>
${noteNameFromNumber(current.rootNote)} → ${targetName}  
(${dirLabel} ${current.semitones} 半音、${semitoneNames[current.semitones] || ""})`;
    updateStats();
  }

  function updateStats() {
    const el = document.getElementById("stats");
    const pct = stats.total
      ? Math.round((stats.correct / stats.total) * 100)
      : 0;
    el.textContent = `正答数: ${stats.correct} / 問数: ${stats.total} （正答率: ${pct}%）`;
  }

  function playPair() {
    if (!current.rootFreq) generateQuestion();
    const wave = document.getElementById("wave").value;
    playTone(current.rootFreq, 0, 0.6, wave);

    const sem = current.semitones;
    const targetNote =
      current.direction === "up"
        ? current.rootNote + sem
        : current.rootNote - sem;
    const freq = freqFromNoteNumber(targetNote);
    playTone(freq, 0.7, 0.6, wave);
  }

  function playRoot() {
    if (!current.rootFreq) generateQuestion();
    playTone(current.rootFreq, 0, 0.9, document.getElementById("wave").value);
  }

  function playIntervalOnly() {
    if (!current.rootFreq) generateQuestion();
    const targetNote =
      current.direction === "up"
        ? current.rootNote + current.semitones
        : current.rootNote - current.semitones;
    const freq = freqFromNoteNumber(targetNote);
    playTone(freq, 0, 0.9, document.getElementById("wave").value);
  }

  document.getElementById("startAudio").addEventListener(
    "click",
    (event) => {
      ensureAudio();
      if (audioCtx.state === "suspended") audioCtx.resume();

      // 最初の問題生成と表示をここで行う
      generateQuestion();
      renderChoices(
        parseInt(document.getElementById("maxSemitones").value, 10)
      );
      showRootInfo();

      event.target.textContent = "Audio Ready";
      event.target.disabled = true; // ボタンを無効化する
    },
    { once: true }
  ); // イベントを一度しか実行しないように設定

  function populateRootNoteSelector() {
    const select = document.getElementById("rootNoteSetting");
    const startNote = 48; // C3
    const endNote = 71; // B4
    for (let i = startNote; i <= endNote; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = noteNameFromNumber(i);
      select.appendChild(option);
    }
  }

  document.getElementById("next").addEventListener("click", () => {
    generateQuestion();
    const rootSetting = document.getElementById("rootNoteSetting").value;
    // ルート音の設定がランダムの場合のみ、表示を更新する
    if (rootSetting === "random") {
      showRootInfo();
    }
  });
  document.getElementById("playPair").addEventListener("click", playPair);
  document.getElementById("playRoot").addEventListener("click", playRoot);
  document
    .getElementById("playInterval")
    .addEventListener("click", playIntervalOnly);

  populateRootNoteSelector();

  // ページ読み込み時の自動問題生成を削除
  // generateQuestion();
  document.getElementById("feedback").textContent =
    "「Start Audio」を押して始めてください。";
})();
