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

  // コードの定義 (ルートからの半音数)
  const chordTypes = {
    major: {
      name: "メジャー",
      intervals: [0, 4, 7], // ルート, 長3度, 完全5度
      toneNames: ["ルート", "長3度", "完全5度"],
    },
    minor: {
      name: "マイナー",
      intervals: [0, 3, 7], // ルート, 短3度, 完全5度
      toneNames: ["ルート", "短3度", "完全5度"],
    },
    major7: {
      name: "メジャーセブンス",
      intervals: [0, 4, 7, 11], // R, M3, P5, M7
      toneNames: ["ルート", "長3度", "完全5度", "長7度"],
    },
    minor7: {
      name: "マイナーセブンス",
      intervals: [0, 3, 7, 10], // R, m3, P5, m7
      toneNames: ["ルート", "短3度", "完全5度", "短7度"],
    },
    dominant7: {
      name: "ドミナントセブンス",
      intervals: [0, 4, 7, 10], // R, M3, P5, m7
      toneNames: ["ルート", "長3度", "完全5度", "短7度"],
    },
    diminished7: {
      name: "ディミニッシュセブンス",
      intervals: [0, 3, 6, 9], // R, m3, d5, d7
      toneNames: ["ルート", "短3度", "減5度", "減7度"],
    },
    halfDiminished7: {
      name: "ハーフディミニッシュ (m7b5)",
      intervals: [0, 3, 6, 10], // R, m3, d5, m7
      toneNames: ["ルート", "短3度", "減5度", "短7度"],
    },
    major9: {
      name: "メジャーナインス",
      intervals: [0, 4, 7, 11, 14], // R, M3, P5, M7, M9
      toneNames: ["ルート", "長3度", "完全5度", "長7度", "長9度"],
    },
    minor9: {
      name: "マイナーナインス",
      intervals: [0, 3, 7, 10, 14], // R, m3, P5, m7, M9
      toneNames: ["ルート", "短3度", "完全5度", "短7度", "長9度"],
    },
    dominant9: {
      name: "ドミナントナインス",
      intervals: [0, 4, 7, 10, 14], // R, M3, P5, m7, M9
      toneNames: ["ルート", "長3度", "完全5度", "短7度", "長9度"],
    },
  };

  // Tone.jsのサンプラーを準備し、ピアノ音源を読み込む
  const sampler = new Tone.Sampler({
    urls: {
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
    },
    // 音源が読み込まれたら、"Start Audio"ボタンを有効化する
    onload: () => {
      const startButton = document.getElementById("startAudio");
      startButton.disabled = false;
      startButton.textContent = "Start Audio";
    },
    // 音源ファイルの場所
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  }).toDestination();

  // 初期状態では音源読み込み中のためボタンを無効化
  document.getElementById("startAudio").disabled = true;
  document.getElementById("startAudio").textContent = "ピアノ音源を読込中...";

  let current = {
    rootFreq: null,
    rootNote: null,
    semitones: null,
    direction: "up",
  };
  let stats = { correct: 0, total: 0 };
  let gameMode = "interval"; // "interval" or "chord_tone"

  // AudioContextの開始はTone.start()に任せる

  function freqFromNoteNumber(noteNumber) {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }

  function noteNameFromNumber(noteNumber) {
    const name = noteNames[noteNumber % 12];
    const octave = Math.floor(noteNumber / 12) - 1;
    return name + octave;
  }

  // Tone.jsを使った再生関数
  function playTone(note, duration, time) {
    // サンプラーは音色選択をサポートしないため、waveTypeの設定は不要

    // 指定した時間に、指定した長さで音を再生
    sampler.triggerAttackRelease(note, duration, time);
  }

  function randomRootNoteNumber() {
    const noteMin = 48; // C3
    const noteMax = 71; // B4
    return Math.floor(Math.random() * (noteMax - noteMin + 1)) + noteMin;
  }

  function generateQuestion() {
    const rootSetting = document.getElementById("rootNoteSetting").value;
    let rootNote;

    if (rootSetting === "random") {
      rootNote = randomRootNoteNumber();
    } else if (rootSetting === "fix_current" && current.rootNote !== null) {
      rootNote = current.rootNote;
    } else if (!isNaN(parseInt(rootSetting, 10))) {
      rootNote = parseInt(rootSetting, 10);
    } else {
      rootNote = randomRootNoteNumber();
    }
    const rootFreq = freqFromNoteNumber(rootNote);

    if (gameMode === "interval") {
      const dirSetting = document.getElementById("direction").value;
      const maxSemi = parseInt(
        document.getElementById("maxSemitones").value,
        10
      );
      const dir =
        dirSetting === "either"
          ? Math.random() < 0.5
            ? "up"
            : "down"
          : dirSetting;
      const semitone = Math.floor(Math.random() * (maxSemi + 1));
      current = {
        mode: "interval",
        rootFreq,
        rootNote,
        semitones: semitone,
        direction: dir,
      };
    } else if (gameMode === "chord_tone") {
      const complexity = document.getElementById("chordComplexity").value;
      let availableChordKeys = Object.keys(chordTypes);

      if (complexity === "triad") {
        availableChordKeys = availableChordKeys.filter(
          (key) => chordTypes[key].intervals.length === 3
        );
      } else if (complexity === "seventh") {
        availableChordKeys = availableChordKeys.filter(
          (key) => chordTypes[key].intervals.length === 4
        );
      } else if (complexity === "ninth") {
        availableChordKeys = availableChordKeys.filter(
          (key) => chordTypes[key].intervals.length === 5
        );
      }

      const randomChordKey =
        availableChordKeys[
          Math.floor(Math.random() * availableChordKeys.length)
        ];
      const chord = chordTypes[randomChordKey];

      current = {
        mode: "chord_tone",
        rootFreq,
        rootNote,
        chord: chord,
      };
    }

    document.getElementById("feedback").textContent =
      "問題を再生して答えてください。";
  }

  function showRootInfo() {
    let text = "";
    if (current.rootNote !== null) {
      const name = noteNameFromNumber(current.rootNote);
      if (gameMode === "interval") {
        text = `🎵 ルート音：${name}`;
      } else if (gameMode === "chord_tone") {
        text = `🎵 ${name} ${current.chord.name}コードの構成音を選んでください。`;
      }
    }
    document.getElementById("rootInfo").innerHTML = text;
  }

  function renderChoices(maxSemi) {
    const container = document.getElementById("choices");
    container.innerHTML = "";
    document.getElementById("submitChord").style.display = "none";
    const arr = Array.from({ length: maxSemi + 1 }, (_, i) => i);
    arr.forEach((n) => {
      if (gameMode === "interval") {
        const btn = document.createElement("button");
        btn.textContent = `${semitoneNames[n] || n}`;
        btn.onclick = () => submitAnswer(n);
        container.appendChild(btn);
      }
    });
    if (gameMode === "chord_tone" && current.chord) {
      noteNames.forEach((name, index) => {
        const btn = document.createElement("button");
        btn.textContent = name;
        btn.dataset.noteIndex = index; // C=0, C#=1 ...
        btn.onclick = () => {
          btn.classList.toggle("selected");
        };
        container.appendChild(btn);
      });
      document.getElementById("submitChord").style.display = "inline-block";
    }
  }

  function submitAnswer(selected) {
    const fb = document.getElementById("feedback");
    let isCorrect;

    // ゲームモードに応じて正しい答えと比較する
    if (current.mode === "interval") {
      isCorrect = selected === current.semitones;
    }

    stats.total += 1;
    if (isCorrect) stats.correct += 1;

    fb.className = "result " + (isCorrect ? "correct" : "wrong");

    if (current.mode === "interval") {
      const dirLabel = current.direction === "up" ? "上行" : "下行";
      const targetNote =
        current.direction === "up"
          ? current.rootNote + current.semitones
          : current.rootNote - current.semitones;
      const targetName = noteNameFromNumber(targetNote);
      fb.innerHTML = `${isCorrect ? "✅ 正解！" : "❌ 不正解"}<br>
  ${noteNameFromNumber(current.rootNote)} → ${targetName}  
  (${dirLabel} ${current.semitones} 半音、${semitoneNames[current.semitones] || ""})`;
    } else if (current.mode === "chord_tone") {
    }

    updateStats();
  }

  function submitChordAnswer() {
    const fb = document.getElementById("feedback");
    const selectedButtons = document.querySelectorAll(
      "#choices button.selected"
    );
    const selectedNoteIndices = Array.from(selectedButtons).map((btn) =>
      parseInt(btn.dataset.noteIndex, 10)
    );

    const correctNoteIndices = current.chord.intervals.map(
      (interval) => (current.rootNote + interval) % 12
    );

    // 選択された音と正解の音が完全に一致するかチェック
    const isCorrect =
      selectedNoteIndices.length === correctNoteIndices.length &&
      selectedNoteIndices.every((val) => correctNoteIndices.includes(val));

    stats.total += 1;
    if (isCorrect) stats.correct += 1;

    fb.className = "result " + (isCorrect ? "correct" : "wrong");
    const correctNotes = correctNoteIndices.map((i) => noteNames[i]).join(", ");
    fb.innerHTML = `${isCorrect ? "✅ 正解！" : "❌ 不正解"}<br>
      正解は <strong>${correctNotes}</strong> でした。`;

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

    if (current.mode === "interval") {
      const playbackType = document.getElementById("playbackType").value;
      const sem = current.semitones;
      const targetNote =
        current.direction === "up"
          ? current.rootNote + sem
          : current.rootNote - sem;
      const intervalFreq = freqFromNoteNumber(targetNote);

      if (playbackType === "harmonic") {
        // 和音で再生
        const duration = 1.2;
        const rootNoteName = noteNameFromNumber(current.rootNote);
        const intervalNoteName = noteNameFromNumber(targetNote);
        playTone([rootNoteName, intervalNoteName], duration, Tone.now());
      } else {
        // メロディで順次再生（従来の動作）
        playTone(noteNameFromNumber(current.rootNote), 0.6, Tone.now());
        playTone(noteNameFromNumber(targetNote), 0.6, Tone.now() + 0.7);
      }
    } else if (current.mode === "chord_tone") {
      // コード構成音を同時に再生
      const duration = 1.5;
      const chordNotes = current.chord.intervals.map((semitone) =>
        noteNameFromNumber(current.rootNote + semitone)
      );
      playTone(chordNotes, duration, Tone.now());
    }
  }

  function playRoot() {
    if (!current.rootFreq) generateQuestion();
    playTone(noteNameFromNumber(current.rootNote), 0.9, Tone.now());
  }

  function playIntervalOnly() {
    if (!current.rootFreq) generateQuestion();
    const wave = document.getElementById("wave").value;

    if (current.mode === "interval") {
      const playbackType = document.getElementById("playbackType").value;
      const targetNote =
        current.direction === "up"
          ? current.rootNote + current.semitones
          : current.rootNote - current.semitones;
      const intervalFreq = freqFromNoteNumber(targetNote);
      const intervalNoteName = noteNameFromNumber(targetNote);

      if (playbackType === "harmonic") {
        const rootNoteName = noteNameFromNumber(current.rootNote);
        playTone([rootNoteName, intervalNoteName], 0.9, Tone.now());
      } else {
        playTone(intervalNoteName, 0.9, Tone.now());
      }
    }
  }

  let audioContextStarted = false; // オーディオコンテキストが開始されたかを追跡するフラグ

  document.getElementById("startAudio").addEventListener("click", (event) => {
    if (!audioContextStarted) {
      Tone.start(); // オーディオコンテキストは初回クリック時のみ開始
      audioContextStarted = true;
      // 初回クリック後、ボタンのテキストを新しい役割に合わせて変更
      event.target.textContent = "新しい問題 / 設定を適用";
    }

    // 現在の設定に基づいて新しい問題を生成し、UIを更新
    generateQuestion();
    renderChoices(parseInt(document.getElementById("maxSemitones").value, 10));
    showRootInfo();

    // ボタンは常に有効な状態を保ち、再度クリックできるようにする
    event.target.disabled = false;
  });

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

  // --- UI連動ロジック ---
  function updateUIForGameMode() {
    gameMode = document.getElementById("gameMode").value;

    // ピアノ音源を使うため、音色選択UIを非表示にする
    const waveSelector = document.getElementById("wave").closest("label");
    waveSelector.style.display = "none";

    // data-mode属性を持つすべての要素（設定のselectと、再生ボタン）を対象にする
    document.querySelectorAll("[data-mode]").forEach((el) => {
      // select要素の場合は親のlabelを、それ以外は要素自体を対象にする
      const target = el.tagName === "SELECT" ? el.closest("label") : el;

      if (el.dataset.mode === gameMode || !el.dataset.mode) {
        target.style.display = "";
      } else {
        target.style.display = "none";
      }
    });
    // 新しい問題を開始
    generateQuestion();
    renderChoices(parseInt(document.getElementById("maxSemitones").value, 10));
    showRootInfo();
  }

  // コード種類の変更時にもUIを更新
  document
    .getElementById("chordComplexity")
    .addEventListener("change", updateUIForGameMode);

  document
    .getElementById("gameMode")
    .addEventListener("change", updateUIForGameMode);

  document
    .getElementById("submitChord")
    .addEventListener("click", submitChordAnswer);

  document.getElementById("next").addEventListener("click", () => {
    generateQuestion();
    renderChoices(parseInt(document.getElementById("maxSemitones").value, 10));
    const rootSetting = document.getElementById("rootNoteSetting").value;
    if (rootSetting === "random" || current.mode === "chord_tone") {
      showRootInfo();
    }
  });
  document.getElementById("playPair").addEventListener("click", playPair);
  document.getElementById("playRoot").addEventListener("click", playRoot);
  document
    .getElementById("playInterval")
    .addEventListener("click", playIntervalOnly);

  populateRootNoteSelector();
  updateUIForGameMode(); // 初期表示を設定

  // ページ読み込み時の自動問題生成を削除
  // generateQuestion();
  document.getElementById("feedback").textContent =
    "「Start Audio」を押して始めてください。";
})();
