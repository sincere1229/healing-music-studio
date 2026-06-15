"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

/* =====================================================
   Healing Music Studio — Phase 1 MVP
   Twinkle Lab / Twinkle Star Oracle 姉妹サービス
   -----------------------------------------------------
   ・音源:Web Audio API による簡易生成(AI音楽API未接続でも動作)
   ・動画:Canvas + MediaRecorder で 画像+音声 → WebM 出力
     ※ YouTube は WebM を直接アップロード可能。MP4変換は Phase 2 (FFmpeg) で対応
   ・サムネイル:Canvas 生成 (1280×720 PNG)
   ・YouTube タイトル/説明文/タグ:テンプレート自動生成
   ・医療効果を断定する表現は使用しない(リラックス/瞑想/睡眠前BGM向け表記)
   ===================================================== */

/* ---------- テーマ(切替可能設計) ---------- */
const THEMES = {
  mystic: {
    name: "ミスティック",
    icon: "🌙",
    bg: "#0B0820",
    bg2: "#171036",
    panel: "rgba(255,255,255,0.045)",
    border: "rgba(212,175,55,0.28)",
    borderSoft: "rgba(167,139,250,0.22)",
    accent: "#E8C36A",
    accent2: "#A78BFA",
    text: "#EFEAFB",
    sub: "#A89FC9",
    chipOn: "rgba(167,139,250,0.20)",
    chipOnBorder: "#A78BFA",
    btnGrad: "linear-gradient(135deg,#C9A227 0%,#F3E5AB 50%,#C9A227 100%)",
    btnText: "#241543",
    heroGrad: "radial-gradient(1200px 600px at 70% -10%, rgba(124,77,255,0.35), transparent 60%), radial-gradient(900px 500px at 10% 10%, rgba(212,175,55,0.12), transparent 55%)",
  },
  business: {
    name: "ビジネス",
    icon: "💼",
    bg: "#0C1322",
    bg2: "#13203A",
    panel: "rgba(255,255,255,0.05)",
    border: "rgba(96,165,250,0.30)",
    borderSoft: "rgba(148,163,184,0.22)",
    accent: "#7DB8FF",
    accent2: "#60A5FA",
    text: "#EAF2FF",
    sub: "#93A6C4",
    chipOn: "rgba(96,165,250,0.18)",
    chipOnBorder: "#60A5FA",
    btnGrad: "linear-gradient(135deg,#3B82F6,#7DB8FF)",
    btnText: "#0B1426",
    heroGrad: "radial-gradient(1200px 600px at 70% -10%, rgba(59,130,246,0.30), transparent 60%)",
  },
  nature: {
    name: "ナチュラル",
    icon: "🌿",
    bg: "#0B1C14",
    bg2: "#11271C",
    panel: "rgba(255,255,255,0.05)",
    border: "rgba(127,212,155,0.30)",
    borderSoft: "rgba(127,212,155,0.18)",
    accent: "#9FE0B5",
    accent2: "#7FD49B",
    text: "#ECF8F0",
    sub: "#8FB89E",
    chipOn: "rgba(127,212,155,0.16)",
    chipOnBorder: "#7FD49B",
    btnGrad: "linear-gradient(135deg,#34A66A,#9FE0B5)",
    btnText: "#0B1C14",
    heroGrad: "radial-gradient(1200px 600px at 70% -10%, rgba(52,166,106,0.30), transparent 60%)",
  },
};

/* ---------- 選択肢マスタ ---------- */
const USES = [
  { id: "sleep", label: "睡眠導入", emoji: "🌙", title: "おやすみ前に聴く" },
  { id: "meditation", label: "瞑想", emoji: "🧘", title: "瞑想タイムのための" },
  { id: "work", label: "作業用", emoji: "💻", title: "作業のおともに流す" },
  { id: "focus", label: "集中", emoji: "🎯", title: "集中したい時間の" },
  { id: "relax", label: "リラックス", emoji: "🛁", title: "心をほどく" },
  { id: "purify", label: "浄化", emoji: "✨", title: "気分を切り替える" },
  { id: "morning", label: "朝活", emoji: "🌅", title: "朝の時間を整える" },
  { id: "yoga", label: "ヨガ", emoji: "🕊️", title: "ヨガ・ストレッチのための" },
  { id: "reiki", label: "ヒーリングワーク", emoji: "🔮", title: "ヒーリングワーク向けの" },
];

// 周波数の説明は「〜とされる/向け」の表現に統一(医療効果の断定はしない)
const FREQS = [
  { hz: 396, note: "解放のイメージ" },
  { hz: 417, note: "切り替えのイメージ" },
  { hz: 528, note: "人気No.1・癒しの定番" },
  { hz: 639, note: "つながりのイメージ" },
  { hz: 741, note: "クリアなイメージ" },
  { hz: 852, note: "直感のイメージ" },
];

const AMBIENTS = [
  { id: "rain", label: "雨", emoji: "🌧️" },
  { id: "forest", label: "森", emoji: "🌲" },
  { id: "river", label: "川", emoji: "🏞️" },
  { id: "wave", label: "波", emoji: "🌊" },
  { id: "fire", label: "焚き火", emoji: "🔥" },
  { id: "bird", label: "鳥の声", emoji: "🐦" },
  { id: "wind", label: "風", emoji: "🍃" },
  { id: "space", label: "宇宙音", emoji: "🪐" },
  { id: "bell", label: "鐘", emoji: "🔔" },
  { id: "tibetan", label: "チベタンベル", emoji: "🎐" },
];

const INSTRUMENTS = [
  { id: "pad", label: "シンセパッド", emoji: "🎹" },
  { id: "piano", label: "ピアノ", emoji: "🎼" },
  { id: "strings", label: "ストリングス", emoji: "🎻" },
  { id: "harp", label: "ハープ", emoji: "🪕" },
  { id: "flute", label: "フルート", emoji: "🪈" },
  { id: "koto", label: "琴(純和風)", emoji: "🎌" },
  { id: "ambient", label: "アンビエント", emoji: "🌌" },
];

const DURATIONS = [
  { sec: 30, label: "30秒", sub: "テスト" },
  { sec: 60, label: "1分", sub: "" },
  { sec: 180, label: "3分", sub: "" },
  { sec: 300, label: "5分", sub: "" },
  { sec: 600, label: "10分", sub: "おすすめ" },
];
const DURATIONS_P2 = ["30分", "60分", "120分"];

const MOODS = [
  { id: "mystic", label: "神秘的", hue: 270 },
  { id: "cosmic", label: "宇宙的", hue: 240 },
  { id: "healing", label: "癒し", hue: 300 },
  { id: "luxury", label: "高級感", hue: 45 },
  { id: "fantasy", label: "幻想的", hue: 285 },
  { id: "japanese", label: "和風", hue: 350 },
  { id: "spiritual", label: "スピリチュアル", hue: 265 },
  { id: "nature", label: "自然", hue: 140 },
];

/* =====================================================
   音声生成エンジン(簡易版 / Phase 2 で AI音楽APIに差替可能)
   ===================================================== */
function makeNoiseBuffer(ctx, type = "white") {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === "brown") {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.0;
      } else d[i] = w;
    }
  }
  return buf;
}

function noiseSource(ctx, type = "white") {
  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, type);
  src.loop = true;
  return src;
}

function scheduleEvents(duration, minGap, maxGap, fn) {
  let t = 1.5 + Math.random() * maxGap * 0.5;
  while (t < duration - 2) {
    fn(t);
    t += minGap + Math.random() * (maxGap - minGap);
  }
}

function strikeBell(ctx, out, t, base, decay, vol) {
  [1, 2.001, 2.76, 5.43].forEach((r, i) => {
    const o = ctx.createOscillator();
    o.frequency.value = base * r;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol / (i + 1), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + decay);
  });
}

function chirp(ctx, out, t, vol = 0.028) {
  const o = ctx.createOscillator();
  o.type = "sine";
  const f = 1900 + Math.random() * 1900;
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * (1.15 + Math.random() * 0.5), t + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22 + Math.random() * 0.15);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + 0.45);
}

async function renderAudio({ freqs, ambients, instrument, duration }) {
  const sr = 44100;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OAC) throw new Error("この端末では音声生成(OfflineAudioContext)が利用できません。");
  const ctx = new OAC(2, sr * duration, sr);

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  comp.connect(ctx.destination);

  // 全体フェードイン/アウト(長尺ではフェードも長めに)
  const master = ctx.createGain();
  const fadeLen = Math.min(20, Math.max(2, duration * 0.04));
  master.gain.setValueAtTime(0, 0);
  master.gain.linearRampToValueAtTime(0.9, fadeLen);
  master.gain.setValueAtTime(0.9, Math.max(fadeLen, duration - fadeLen));
  master.gain.linearRampToValueAtTime(0, duration);
  master.connect(comp);

  /* --- ソルフェジオ周波数トーン --- */
  const n = Math.max(1, freqs.length);
  freqs.forEach((f, idx) => {
    [0, 1].forEach((side) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = side === 0 ? f : f * 1.0035; // ゆらぎ用に微妙にデチューン
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const g = ctx.createGain();
      const base = 0.042 / Math.sqrt(n);
      g.gain.value = base;
      // ゆっくりした音量のゆらぎ(短周期)
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + idx * 0.013 + side * 0.01;
      const lg = ctx.createGain();
      lg.gain.value = base * 0.35;
      lfo.connect(lg);
      lg.connect(g.gain);
      // さらに長い周期のうねり(長尺で単調にならないように)
      if (duration > 120) {
        const slow = ctx.createOscillator();
        slow.frequency.value = 0.0035 + idx * 0.0009; // 約5分前後の周期
        const sg = ctx.createGain();
        sg.gain.value = base * 0.25;
        slow.connect(sg);
        sg.connect(g.gain);
        slow.start(0);
        slow.stop(duration);
      }
      o.connect(g);
      if (pan) {
        pan.pan.value = side === 0 ? -0.3 : 0.3;
        g.connect(pan);
        pan.connect(master);
      } else g.connect(master);
      o.start(0);
      o.stop(duration);
      lfo.start(0);
      lfo.stop(duration);
    });
  });

  /* --- 楽器レイヤー --- */
  const pent = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
  // 都節音階(平調子風)— 琴の純和風な響きに使用。ラを基準に半音/全音を組み合わせた音階
  const koto1 = 220; // A3
  const miyakobushi = [
    koto1, koto1 * Math.pow(2, 1 / 12), koto1 * Math.pow(2, 5 / 12),
    koto1 * Math.pow(2, 7 / 12), koto1 * Math.pow(2, 8 / 12),
    koto1 * 2, koto1 * 2 * Math.pow(2, 1 / 12), koto1 * 2 * Math.pow(2, 5 / 12),
    koto1 * 2 * Math.pow(2, 7 / 12),
  ];
  const addPad = (type, cutoff, vol) => {
    [110, 164.81, 220, 261.63, 329.63].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f * (1 + (i % 2 ? 0.0015 : -0.0015));
      const flt = ctx.createBiquadFilter();
      flt.type = "lowpass";
      flt.frequency.value = cutoff;
      flt.Q.value = 0.4;
      const g = ctx.createGain();
      g.gain.value = vol;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.04 + i * 0.012;
      const lg = ctx.createGain();
      lg.gain.value = vol * 0.4;
      lfo.connect(lg);
      lg.connect(g.gain);
      // 長尺向け:フィルターのカットオフをゆっくり揺らして音色に変化を持たせる
      if (duration > 120) {
        const fLfo = ctx.createOscillator();
        fLfo.frequency.value = 0.003 + i * 0.0007;
        const fg = ctx.createGain();
        fg.gain.value = cutoff * 0.25;
        fLfo.connect(fg);
        fg.connect(flt.frequency);
        fLfo.start(0);
        fLfo.stop(duration);
      }
      o.connect(flt);
      flt.connect(g);
      g.connect(master);
      o.start(0);
      o.stop(duration);
      lfo.start(0);
      lfo.stop(duration);
    });
  };
  const pluck = (t, f, decay, vol, type = "triangle") => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + decay);
  };

  // 琴(箏)の一音:爪弾きのアタック(短いノイズ)+ 本体音(三角波+倍音)+ サワリのゆっくりビブラート
  const kotoPluck = (t, f, vol = 0.11) => {
    const decay = 2.6 + Math.random() * 1.4;

    // 爪が弦に触れる「ジャッ」という短いアタック成分
    const atk = noiseSource(ctx, "white");
    const atkF = ctx.createBiquadFilter();
    atkF.type = "highpass";
    atkF.frequency.value = f * 3;
    const atkG = ctx.createGain();
    atkG.gain.setValueAtTime(vol * 0.35, t);
    atkG.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    atk.connect(atkF);
    atkF.connect(atkG);
    atkG.connect(master);
    atk.start(t);
    atk.stop(t + 0.06);

    // 本体音(基音 + 倍音をやや弱めに重ねて箏らしい硬さを出す)
    [1, 2, 3.01, 4.2].forEach((ratio, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "triangle" : "sine";
      o.frequency.value = f * ratio;
      const g = ctx.createGain();
      const v = vol / (1 + i * 1.4);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay * (1 - i * 0.12));

      // サワリ:ゆっくりとした音程のうねり(琴の余韻特有の揺れ)
      const vib = ctx.createOscillator();
      vib.frequency.value = 4.5 + Math.random() * 1.5;
      const vg = ctx.createGain();
      vg.gain.value = f * ratio * 0.0025;
      vib.connect(vg);
      vg.connect(o.frequency);

      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + decay);
      vib.start(t);
      vib.stop(t + decay);
    });
  };

  if (instrument === "pad") addPad("sawtooth", 620, 0.045);
  if (instrument === "strings") addPad("triangle", 1300, 0.06);
  if (instrument === "ambient") {
    addPad("sawtooth", 420, 0.05);
    const sh = ctx.createOscillator();
    sh.frequency.value = 1318.5;
    const sg = ctx.createGain();
    sg.gain.value = 0.004;
    sh.connect(sg);
    sg.connect(master);
    sh.start(0);
    sh.stop(duration);
  }
  if (instrument === "piano")
    scheduleEvents(duration, 4, 9, (t) =>
      pluck(t, pent[Math.floor(Math.random() * pent.length)], 3.2, 0.10)
    );
  if (instrument === "harp")
    scheduleEvents(duration, 5, 11, (t) => {
      const start = Math.floor(Math.random() * 4);
      [0, 1, 2].forEach((k) =>
        pluck(t + k * 0.22, pent[(start + k * 2) % pent.length], 1.6, 0.07)
      );
    });
  if (instrument === "flute")
    scheduleEvents(duration, 8, 15, (t) => {
      const f = pent[3 + Math.floor(Math.random() * 4)] * 2;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const vib = ctx.createOscillator();
      vib.frequency.value = 5;
      const vg = ctx.createGain();
      vg.gain.value = f * 0.004;
      vib.connect(vg);
      vg.connect(o.frequency);
      const g = ctx.createGain();
      const len = 2.5 + Math.random() * 1.5;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.6);
      g.gain.setValueAtTime(0.05, t + len - 1);
      g.gain.linearRampToValueAtTime(0, t + len);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + len);
      vib.start(t);
      vib.stop(t + len);
    });

  if (instrument === "koto") {
    // 低音弦のドローン(箏の調弦された低音をかすかに響かせる)
    [miyakobushi[0] / 2, miyakobushi[4] / 2].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.018;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + i * 0.01;
      const lg = ctx.createGain();
      lg.gain.value = 0.01;
      lfo.connect(lg);
      lg.connect(g.gain);
      o.connect(g);
      g.connect(master);
      o.start(0);
      o.stop(duration);
      lfo.start(0);
      lfo.stop(duration);
    });

    // ゆったりとした単旋律のフレーズ(都節音階)。和音は重ねず、一音ずつ余韻を残しながら進む
    let idx = Math.floor(Math.random() * miyakobushi.length);
    scheduleEvents(duration, 2.2, 4.5, (t) => {
      // 隣接音を中心に、たまに少し跳躍する"間"のある旋律
      const step = Math.random() < 0.75 ? (Math.random() < 0.5 ? 1 : -1) : (Math.random() < 0.5 ? 2 : -2);
      idx = Math.max(0, Math.min(miyakobushi.length - 1, idx + step));
      kotoPluck(t, miyakobushi[idx], 0.10 + Math.random() * 0.02);
      // ごく稀に、余韻に重ねてもう一音(掛け合い)
      if (Math.random() < 0.18) {
        const harmIdx = Math.max(0, Math.min(miyakobushi.length - 1, idx + (Math.random() < 0.5 ? 3 : -3)));
        kotoPluck(t + 0.9 + Math.random() * 0.4, miyakobushi[harmIdx], 0.06);
      }
    });
  }

  /* --- 環境音レイヤー --- */
  const addFilteredNoise = (noiseType, setup, vol) => {
    const src = noiseSource(ctx, noiseType);
    const g = ctx.createGain();
    g.gain.value = vol;
    const node = setup(src, g);
    (node || g).connect(master);
    src.start(0);
    src.stop(duration);
    return g;
  };

  ambients.forEach((a) => {
    if (a === "rain")
      addFilteredNoise("white", (src, g) => {
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 500;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 7500;
        src.connect(hp);
        hp.connect(lp);
        lp.connect(g);
        return g;
      }, 0.085);
    if (a === "river")
      addFilteredNoise("white", (src, g) => {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 2600;
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 180;
        src.connect(hp);
        hp.connect(lp);
        lp.connect(g);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.7;
        const lg = ctx.createGain();
        lg.gain.value = 0.02;
        lfo.connect(lg);
        lg.connect(g.gain);
        lfo.start(0);
        lfo.stop(duration);
        return g;
      }, 0.09);
    if (a === "wave")
      addFilteredNoise("white", (src, g) => {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 380;
        src.connect(lp);
        lp.connect(g);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.08;
        const fg = ctx.createGain();
        fg.gain.value = 260;
        lfo.connect(fg);
        fg.connect(lp.frequency);
        const ag = ctx.createGain();
        ag.gain.value = 0.05;
        lfo.connect(ag);
        ag.connect(g.gain);
        lfo.start(0);
        lfo.stop(duration);
        return g;
      }, 0.11);
    if (a === "wind" || a === "forest")
      addFilteredNoise("white", (src, g) => {
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 550;
        bp.Q.value = 0.8;
        src.connect(bp);
        bp.connect(g);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.05;
        const fg = ctx.createGain();
        fg.gain.value = 230;
        lfo.connect(fg);
        fg.connect(bp.frequency);
        lfo.start(0);
        lfo.stop(duration);
        return g;
      }, a === "wind" ? 0.07 : 0.03);
    if (a === "forest") scheduleEvents(duration, 3, 8, (t) => chirp(ctx, master, t, 0.022));
    if (a === "bird") scheduleEvents(duration, 1.8, 5.5, (t) => chirp(ctx, master, t, 0.032));
    if (a === "fire") {
      addFilteredNoise("brown", (src, g) => {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 320;
        src.connect(lp);
        lp.connect(g);
        return g;
      }, 0.07);
      // パチパチ音
      const ck = noiseSource(ctx, "white");
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1800;
      const cg = ctx.createGain();
      cg.gain.value = 0;
      ck.connect(hp);
      hp.connect(cg);
      cg.connect(master);
      ck.start(0);
      ck.stop(duration);
      scheduleEvents(duration, 0.18, 0.9, (t) => {
        cg.gain.setValueAtTime(0.03 + Math.random() * 0.05, t);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      });
    }
    if (a === "space") {
      [55, 55.35].forEach((f) => {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 150;
        const g = ctx.createGain();
        g.gain.value = 0.045;
        o.connect(lp);
        lp.connect(g);
        g.connect(master);
        o.start(0);
        o.stop(duration);
      });
    }
    if (a === "bell")
      scheduleEvents(duration, 16, 30, (t) => strikeBell(ctx, master, t, 330, 9, 0.07));
    if (a === "tibetan") {
      scheduleEvents(duration, 24, 42, (t) =>
        strikeBell(ctx, master, t, 140 + Math.random() * 40, 14, 0.09)
      );
      const o = ctx.createOscillator();
      o.frequency.value = 220;
      const g = ctx.createGain();
      g.gain.value = 0.012;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.5;
      const lg = ctx.createGain();
      lg.gain.value = 0.008;
      lfo.connect(lg);
      lg.connect(g.gain);
      o.connect(g);
      g.connect(master);
      o.start(0);
      o.stop(duration);
      lfo.start(0);
      lfo.stop(duration);
    }
  });

  return await ctx.startRendering();
}

/* ---------- WAV 変換 ---------- */
function bufferToWav(abuf) {
  const numCh = abuf.numberOfChannels;
  const sr = abuf.sampleRate;
  const len = abuf.length * numCh * 2 + 44;
  const buffer = new ArrayBuffer(len);
  const v = new DataView(buffer);
  const ws = (o, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  ws(0, "RIFF");
  v.setUint32(4, len - 8, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numCh, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * numCh * 2, true);
  v.setUint16(32, numCh * 2, true);
  v.setUint16(34, 16, true);
  ws(36, "data");
  v.setUint32(40, len - 44, true);
  let off = 44;
  const chans = [];
  for (let c = 0; c < numCh; c++) chans.push(abuf.getChannelData(c));
  for (let i = 0; i < abuf.length; i++)
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  return new Blob([buffer], { type: "audio/wav" });
}

/* =====================================================
   サムネイル生成 (1280×720)
   ===================================================== */
// 長いテキストを指定幅で複数行に折り返して描画するヘルパー
function fillWrappedText(c, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  if (!text) return y;
  const chars = Array.from(text);
  const lines = [];
  let line = "";
  for (const ch of chars) {
    const test = line + ch;
    if (c.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
      if (lines.length >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  // 残りの文字を最終行に詰める(省略しない・最大行数に収める)
  if (lines.length === maxLines) {
    const used = lines.join("").length;
    const rest = chars.slice(used).join("");
    if (rest) lines[lines.length - 1] += rest;
  }
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => c.fillText(l, x, startY + i * lineHeight));
  return startY + (lines.length - 1) * lineHeight;
}

function drawThumbnail({
  freqs, use, ambients, durationLabel, mood, uploadedImg, width = 1280, height = 720,
  subtitle = "", supplement = "", brandName = "Twinkle Lab",
  charIcon = null, charEnabled = false, charSize = 0.16,
}) {
  const W = width, H = height;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d");
  const hue = (MOODS.find((m) => m.id === mood) || MOODS[0]).hue;
  const square = W === H; // Instagram用(1080x1080)かどうか

  if (uploadedImg) {
    // アップロード画像を cover で描画
    const r = Math.max(W / uploadedImg.width, H / uploadedImg.height);
    const w = uploadedImg.width * r, h = uploadedImg.height * r;
    c.drawImage(uploadedImg, (W - w) / 2, (H - h) / 2, w, h);
    const ov = c.createLinearGradient(0, 0, 0, H);
    ov.addColorStop(0, "rgba(8,5,25,0.45)");
    ov.addColorStop(1, "rgba(8,5,25,0.78)");
    c.fillStyle = ov;
    c.fillRect(0, 0, W, H);
  } else {
    // 夜空グラデーション
    const g = c.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, `hsl(${hue}, 55%, 7%)`);
    g.addColorStop(0.55, `hsl(${hue}, 50%, 14%)`);
    g.addColorStop(1, `hsl(${hue + 20}, 45%, 22%)`);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    // 星雲
    [[W * 0.75, H * 0.3, Math.min(W, H) * 0.32, hue + 30, 0.20], [W * 0.2, H * 0.75, Math.min(W, H) * 0.28, hue - 25, 0.16], [W * 0.5, H * 0.15, Math.min(W, H) * 0.22, 45, 0.07]].forEach(
      ([x, y, r, h2, a]) => {
        const ng = c.createRadialGradient(x, y, 0, x, y, r);
        ng.addColorStop(0, `hsla(${h2}, 75%, 62%, ${a})`);
        ng.addColorStop(1, "transparent");
        c.fillStyle = ng;
        c.fillRect(0, 0, W, H);
      }
    );
    // 星
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = Math.random() * 1.6 + 0.3;
      c.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.7})`;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      if (Math.random() < 0.08) {
        const sg = c.createRadialGradient(x, y, 0, x, y, r * 7);
        sg.addColorStop(0, "rgba(255,245,220,0.45)");
        sg.addColorStop(1, "transparent");
        c.fillStyle = sg;
        c.beginPath();
        c.arc(x, y, r * 7, 0, Math.PI * 2);
        c.fill();
      }
    }
    // 三日月
    const mx = W * 0.84, my = H * 0.16, mr = Math.min(W, H) * 0.05;
    const mg = c.createRadialGradient(mx, my, 0, mx, my, mr * 2.6);
    mg.addColorStop(0, "rgba(243,229,171,0.35)");
    mg.addColorStop(1, "transparent");
    c.fillStyle = mg;
    c.beginPath();
    c.arc(mx, my, mr * 2.6, 0, Math.PI * 2);
    c.fill();
    const lg2 = c.createLinearGradient(mx - mr, my - mr, mx + mr, my + mr);
    lg2.addColorStop(0, "#F3E5AB");
    lg2.addColorStop(1, "#D4AF37");
    c.fillStyle = lg2;
    c.beginPath();
    c.arc(mx, my, mr, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "destination-out";
    c.beginPath();
    c.arc(mx - mr * 0.45, my - mr * 0.18, mr * 0.92, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "source-over";
  }

  // ゴールドの罫線
  const marginX = W * 0.055, topY = H * (square ? 0.085 : 0.128), botY = H * (square ? 0.915 : 0.878);
  c.strokeStyle = "rgba(212,175,55,0.85)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(marginX, topY);
  c.lineTo(W - marginX, topY);
  c.stroke();
  c.beginPath();
  c.moveTo(marginX, botY);
  c.lineTo(W - marginX, botY);
  c.stroke();

  // テキスト
  const serif = '"Shippori Mincho", "Hiragino Mincho ProN", serif';
  const scale = Math.min(W, H) / 720; // 1280x720基準のフォントサイズをスケール
  c.textAlign = "center";
  c.fillStyle = "#E8C36A";
  c.font = `500 ${26 * scale}px ${serif}`;
  // ③ ブランド名(全角スペースで字間を空けて表示)
  const brandDisplay = (brandName || "Twinkle Lab").trim().split("").join("\u200a ");
  c.fillText(brandDisplay.toUpperCase(), W / 2, H * (square ? 0.075 : 0.089));

  const freqText = freqs.length ? `${freqs.join("Hz・")}Hz` : "Healing";
  const fgrad = c.createLinearGradient(W / 2 - 300 * scale, 0, W / 2 + 300 * scale, 0);
  fgrad.addColorStop(0, "#D4AF37");
  fgrad.addColorStop(0.5, "#FBF0CC");
  fgrad.addColorStop(1, "#D4AF37");
  c.fillStyle = fgrad;
  c.font = `700 ${(square ? 96 : 110) * scale}px ${serif}`;
  c.shadowColor = "rgba(0,0,0,0.55)";
  c.shadowBlur = 18;
  c.fillText(freqText, W / 2, H * (square ? 0.40 : 0.42));

  // ① サブタイトル:未入力なら「用途+ヒーリングミュージック」を自動生成
  const useObj = USES.find((u) => u.id === use) || USES[0];
  const subtitleText = (subtitle || "").trim() || `${useObj.label}ヒーリングミュージック`;
  c.fillStyle = "#FFFFFF";
  c.font = `700 ${(square ? 54 : 62) * scale}px ${serif}`;
  c.shadowBlur = 0;
  fillWrappedText(c, subtitleText, W / 2, H * (square ? 0.55 : 0.58), W * (square ? 0.86 : 0.82), (square ? 64 : 72) * scale, 2);

  // ② 補足テキスト:未入力なら「環境音+長さ」を自動生成
  const ambLabels = ambients
    .map((a) => (AMBIENTS.find((x) => x.id === a) || {}).label)
    .filter(Boolean)
    .slice(0, 3)
    .join("・");
  const supplementText = (supplement || "").trim() || [ambLabels && `${ambLabels}の音`, durationLabel].filter(Boolean).join("  ｜  ");
  c.fillStyle = "#D9CDEB";
  c.font = `500 ${34 * scale}px ${serif}`;
  c.fillText(supplementText, W / 2, H * (square ? 0.66 : 0.70));

  c.fillStyle = "rgba(232,195,106,0.9)";
  c.font = `500 ${24 * scale}px ${serif}`;
  c.fillText(`✦ ${(brandName || "Twinkle Lab").trim()} ✦`, W / 2, H * (square ? 0.94 : 0.93));

  // ④ キャラクターアイコン(右下に表示)
  if (charEnabled && charIcon) {
    const size = Math.min(W, H) * Math.max(0.06, Math.min(0.4, charSize));
    const margin = Math.min(W, H) * 0.03;
    const r = Math.max(W / charIcon.width, H / charIcon.height) === Infinity ? 1 : size / Math.max(charIcon.width, charIcon.height);
    const iw = charIcon.width * r, ih = charIcon.height * r;
    const x = W - margin - iw, y = H - margin - ih;
    // ふんわりした光の縁取り
    c.save();
    const glow = c.createRadialGradient(x + iw / 2, y + ih / 2, 0, x + iw / 2, y + ih / 2, Math.max(iw, ih) * 0.75);
    glow.addColorStop(0, "rgba(167,139,250,0.35)");
    glow.addColorStop(1, "transparent");
    c.fillStyle = glow;
    c.beginPath();
    c.arc(x + iw / 2, y + ih / 2, Math.max(iw, ih) * 0.75, 0, Math.PI * 2);
    c.fill();
    c.drawImage(charIcon, x, y, iw, ih);
    c.restore();
  }

  return cv;
}

/* =====================================================
   動画生成:サムネイル画像 + 音声 → WebM / MP4
   (Ken Burns ズーム / リアルタイム録画)
   ・非対応端末では UNSUPPORTED を投げ、呼び出し側でスキップ
   ・setInterval 駆動 + ウォッチドッグで「途中で止まる」を防止
   ===================================================== */
function videoSupport() {
  if (typeof MediaRecorder === "undefined") return null;
  if (!HTMLCanvasElement.prototype.captureStream) return null;
  const cands = [
    ["video/webm;codecs=vp9,opus", "webm"],
    ["video/webm;codecs=vp8,opus", "webm"],
    ["video/webm", "webm"],
    ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "mp4"], // iOS Safari
    ["video/mp4", "mp4"],
  ];
  for (const [m, ext] of cands) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return { mime: m, ext };
    } catch (e) {}
  }
  return null;
}

function recordVideo({ audioBuffer, imageCanvas, duration, onProgress }) {
  return new Promise((resolve, reject) => {
    let finished = false;
    let timer = null;
    let watchdog = null;
    let stopFallback = null;
    let ac = null;
    const cleanup = () => {
      if (timer) clearInterval(timer);
      if (watchdog) clearTimeout(watchdog);
      if (stopFallback) clearTimeout(stopFallback);
      try { ac && ac.state !== "closed" && ac.close(); } catch (e) {}
    };
    const done = (val, err) => {
      if (finished) return;
      finished = true;
      cleanup();
      err ? reject(err) : resolve(val);
    };
    try {
      const sup = videoSupport();
      if (!sup) return done(null, new Error("UNSUPPORTED"));

      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const c = canvas.getContext("2d");
      const AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC();
      if (ac.resume) ac.resume().catch(() => {});
      const dest = ac.createMediaStreamDestination();
      const src = ac.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(dest);
      const stream = new MediaStream([
        ...canvas.captureStream(30).getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);
      const rec = new MediaRecorder(stream, {
        mimeType: sup.mime,
        videoBitsPerSecond: 4500000,
        audioBitsPerSecond: 192000,
      });
      const chunks = [];
      const finish = () => {
        const blob = new Blob(chunks, { type: sup.mime.split(";")[0] });
        if (blob.size < 2000) return done(null, new Error("録画データを取得できませんでした"));
        done({ blob, ext: sup.ext }, null);
      };
      rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
      rec.onstop = finish;
      rec.onerror = (e) => done(null, (e && e.error) || new Error("録画に失敗しました"));

      const stopAll = () => {
        if (timer) clearInterval(timer);
        timer = null;
        try { src.stop(); } catch (e) {}
        try {
          if (rec.state !== "inactive") rec.stop();
          else finish();
        } catch (e) { finish(); }
        // onstop が発火しない端末向けの保険
        stopFallback = setTimeout(() => { if (!finished) finish(); }, 4000);
      };

      const start = performance.now();
      const draw = () => {
        const t = (performance.now() - start) / 1000;
        const p = Math.min(1, t / duration);
        const zoom = 1 + 0.1 * p; // Ken Burns: ゆっくりズームイン
        const w = canvas.width * zoom, h = canvas.height * zoom;
        c.fillStyle = "#000";
        c.fillRect(0, 0, canvas.width, canvas.height);
        c.drawImage(imageCanvas, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        // 呼吸するようなビネット
        const a = 0.12 + 0.05 * Math.sin(t * 0.4);
        const g = c.createRadialGradient(640, 360, 220, 640, 360, 760);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, `rgba(5,3,20,${a})`);
        c.fillStyle = g;
        c.fillRect(0, 0, canvas.width, canvas.height);
        onProgress && onProgress(p);
        if (t >= duration) stopAll();
      };
      src.start();
      rec.start(500);
      draw();
      // requestAnimationFrame はモバイルで停止することがあるため setInterval 駆動
      timer = setInterval(draw, 1000 / 30);
      // どんな状況でも duration + 6秒 で強制終了(無限待ち防止)
      watchdog = setTimeout(stopAll, (duration + 6) * 1000);
    } catch (e) {
      done(null, e);
    }
  });
}

/* =====================================================
   YouTube メタデータ & AI音楽プロンプト生成
   (医療効果を断定しない表現で統一)
   ===================================================== */
function buildMetadata({ freqs, use, ambients, instrument, durationLabel, mood, subtitle = "", supplement = "", brandName = "Twinkle Lab" }) {
  const useObj = USES.find((u) => u.id === use) || USES[0];
  const moodObj = MOODS.find((m) => m.id === mood) || MOODS[0];
  const freqText = freqs.length ? `【${freqs.join("Hz・")}Hz】` : "";
  const ambLabels = ambients
    .map((a) => (AMBIENTS.find((x) => x.id === a) || {}).label)
    .filter(Boolean);
  const ambText = ambLabels.length ? `｜${ambLabels.slice(0, 2).join("・")}の音付き` : "";
  const instObj = INSTRUMENTS.find((i) => i.id === instrument);
  const brand = (brandName || "Twinkle Lab").trim() || "Twinkle Lab";
  const subtitleText = (subtitle || "").trim();
  const supplementText = (supplement || "").trim();

  // ⑤ YouTubeタイトル候補(3案):メイン案+表現を変えた2案
  const baseLabel = subtitleText || `${useObj.title}${moodObj.label}ヒーリングミュージック`;
  const tail = supplementText || [ambLabels.length ? `${ambLabels.slice(0, 2).join("・")}の音` : "", durationLabel].filter(Boolean).join("｜");

  const titles = [
    `${freqText}${baseLabel}${tail ? `｜${tail}` : ""}`,
    `${freqText}${subtitleText || `${moodObj.label}な周波数`}｜睡眠・瞑想・リラックス${durationLabel ? `(${durationLabel})` : ""}`,
    `${useObj.title}${subtitleText ? subtitleText + "｜" : ""}${freqs.length ? freqs.join("Hz・") + "Hz" : "ヒーリング"}サウンド${ambLabels.length ? `｜${ambLabels[0]}の音` : ""}`,
  ];
  const title = titles[0];

  const description = [
    `${useObj.label}・リラックスタイムにお使いいただけるヒーリングBGMです。`,
    subtitleText ? `今回のテーマ:「${subtitleText}」` : "",
    freqs.length
      ? `ソルフェジオ周波数(${freqs.join("Hz / ")}Hz)をベースに、${ambLabels.length ? ambLabels.join("・") + "の環境音と" : ""}${instObj ? instObj.label + "の音色を" : "やさしい音色を"}重ねた${moodObj.label}な雰囲気の音源です。`
      : "",
    "",
    "▼ おすすめの使い方",
    "・おやすみ前のリラックスタイムに",
    "・瞑想やヨガ、深呼吸のおともに",
    "・読書や作業中のBGMとして",
    "",
    "音量は小さめに設定して、心地よいと感じる範囲でお楽しみください。",
    "",
    "※本動画の音源・周波数はリラックス用途のBGMです。医療的な効果を保証するものではありません。",
    "",
    "#ヒーリングミュージック #リラックスBGM" + (freqs[0] ? ` #${freqs[0]}hz` : ""),
    "",
    `🌙 Healing Music Studio by ${brand}`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  const tags = [
    "ヒーリングミュージック",
    "healing music",
    "relaxing music",
    `${useObj.label} BGM`,
    ...freqs.map((f) => `${f}hz`),
    ...ambLabels.map((l) => `${l}の音`),
    "瞑想 音楽",
    "リラックス BGM",
    "sleep music",
    "meditation music",
    "ambient",
  ].slice(0, 15);

  // Instagram用キャプション(フィード/リール投稿向け・YouTubeへの誘導込み)
  const igHashtags = [
    "ヒーリングミュージック",
    "healingmusic",
    "リラックスタイム",
    `${useObj.label.replace(/\s/g, "")}BGM`,
    ...freqs.map((f) => `${f}hz`),
    "瞑想music",
    "spiritual",
    brand.replace(/\s/g, ""),
  ]
    .slice(0, 10)
    .map((t) => `#${t}`)
    .join(" ");

  const instagramCaption = [
    `🌙 ${freqText}${subtitleText || `${moodObj.label}な${useObj.title}ヒーリングミュージック`}`,
    "",
    freqs.length
      ? `ソルフェジオ周波数${freqs.join("Hz・")}Hzと${ambLabels.length ? ambLabels.join("・") + "の音" : "やさしい音色"}を重ねた、${useObj.label}タイムにおすすめの一曲です✨`
      : `${useObj.label}タイムにおすすめのヒーリングBGMです✨`,
    "",
    `本編(${durationLabel})はYouTubeで公開中です🎧`,
    "プロフィールのリンクからどうぞ🔗",
    "",
    "※リラックス・瞑想・睡眠前のBGM向けの音源です。医療的な効果を保証するものではありません。",
    "",
    igHashtags,
  ].join("\n");

  return { title, titles, description, tags, instagramCaption };
}

function buildMusicPrompt({ freqs, use, ambients, instrument, durationLabel, mood }) {
  const useMap = {
    sleep: "sleep meditation", meditation: "deep meditation", work: "calm focus background",
    focus: "concentration", relax: "deep relaxation", purify: "cleansing atmosphere",
    morning: "gentle morning", yoga: "yoga flow", reiki: "energy healing session",
  };
  const ambMap = {
    rain: "soft rain ambience", forest: "forest atmosphere", river: "gentle stream",
    wave: "ocean waves", fire: "crackling fireplace", bird: "distant birdsong",
    wind: "soft wind", space: "deep space drone", bell: "occasional temple bell",
    tibetan: "tibetan singing bowls",
  };
  const moodMap = {
    mystic: "mystical", cosmic: "cosmic", healing: "deeply soothing", luxury: "elegant",
    fantasy: "dreamlike", japanese: "japanese zen", spiritual: "spiritual", nature: "organic natural",
  };
  return [
    instrument === "koto" ? "Traditional Japanese Koto Music" : "Deep Ambient Healing Music",
    ...freqs.map((f) => `${f}Hz inspired tone`),
    ...ambients.map((a) => ambMap[a]).filter(Boolean),
    `slow evolving ${
      instrument === "piano" ? "piano notes" :
      instrument === "harp" ? "harp arpeggios" :
      instrument === "strings" ? "string pads" :
      instrument === "flute" ? "airy flute" :
      instrument === "koto" ? "solo koto melody, traditional Japanese scale (miyakobushi), minimal and spacious" :
      "synth pads"
    }`,
    instrument === "koto" ? "no synth pads, no western harmony, authentic wagakku timbre" : null,
    useMap[use] || "relaxation",
    `${moodMap[mood] || "peaceful"} atmosphere`,
    "no percussion",
    durationLabel,
  ].filter(Boolean).join("\n");
}

/* =====================================================
   メインコンポーネント
   ===================================================== */
export default function HealingMusicStudio() {
  const [themeKey, setThemeKey] = useState("mystic");
  const T = THEMES[themeKey];

  const [use, setUse] = useState("sleep");
  const [freqs, setFreqs] = useState([528]);
  const [ambients, setAmbients] = useState(["rain"]);
  const [instrument, setInstrument] = useState("pad");
  const [durationSec, setDurationSec] = useState(30);
  const [mood, setMood] = useState("mystic");
  const [uploadedImg, setUploadedImg] = useState(null);
  const [uploadedName, setUploadedName] = useState("");

  // ① サムネイルサブタイトル ② 補足テキスト ③ ブランド名
  const [subtitle, setSubtitle] = useState("");
  const [supplement, setSupplement] = useState("");
  const [brandName, setBrandName] = useState("Aura Garden");

  // ④ キャラクターアイコン(Serena等)
  const [charIcon, setCharIcon] = useState(null);
  const [charIconName, setCharIconName] = useState("");
  const [charEnabled, setCharEnabled] = useState(false);
  const [charSize, setCharSize] = useState(0.16);

  const [phase, setPhase] = useState("idle"); // idle | working | done | error
  const [step, setStep] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState("");
  const urlsRef = useRef([]);

  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const durationLabel = (DURATIONS.find((d) => d.sec === durationSec) || {}).label || "";
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        x: Math.random() * 100, y: Math.random() * 100,
        s: Math.random() * 2.2 + 1, d: Math.random() * 4,
        o: 0.3 + Math.random() * 0.7,
      })),
    []
  );

  const toggle = (arr, v, set) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const handleUpload = (e, kind = "bg") => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (kind === "char") {
          setCharIcon(img);
          setCharIconName(f.name);
          setCharEnabled(true);
        } else {
          setUploadedImg(img);
          setUploadedName(f.name);
        }
      };
      img.src = r.result;
    };
    r.readAsDataURL(f);
  };

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1600);
    } catch (e) {
      setCopied("");
    }
  };

  const generate = async () => {
    setPhase("working");
    setError("");
    setResult(null);
    setVideoProgress(0);
    try {
      const opts = { freqs, use, ambients, instrument, durationLabel, mood, duration: durationSec, subtitle, supplement, brandName };
      const thumbExtra = { uploadedImg, charIcon, charEnabled, charSize };

      // ① サムネイル(YouTube用16:9 + Instagram用1:1)
      setStep("thumb");
      const thumbCanvas = drawThumbnail({ ...opts, ...thumbExtra });
      const thumbUrl = thumbCanvas.toDataURL("image/png");
      const igThumbCanvas = drawThumbnail({ ...opts, ...thumbExtra, width: 1080, height: 1080 });
      const igThumbUrl = igThumbCanvas.toDataURL("image/png");

      // ② 音声生成(簡易合成 / Phase 2 で AI音楽API に差替)
      setStep("audio");
      await new Promise((r) => setTimeout(r, 60)); // UI反映
      const audioBuffer = await renderAudio(opts);
      const wavBlob = bufferToWav(audioBuffer);
      const wavUrl = URL.createObjectURL(wavBlob);
      urlsRef.current.push(wavUrl);

      // ③ 動画録画(リアルタイム/非対応端末は自動スキップ)
      setStep("video");
      let videoUrl = null, videoExt = "webm", videoSize = 0, videoNote = "";
      try {
        const v = await recordVideo({
          audioBuffer,
          imageCanvas: thumbCanvas,
          duration: durationSec,
          onProgress: (p) => setVideoProgress(p),
        });
        videoUrl = URL.createObjectURL(v.blob);
        urlsRef.current.push(videoUrl);
        videoExt = v.ext;
        videoSize = v.blob.size;
      } catch (e) {
        console.warn("video skipped:", e);
        videoNote =
          e && e.message === "UNSUPPORTED"
            ? "この端末のブラウザは動画録画に対応していないため、音源とサムネイルのみ出力しました。PC版Chromeで開くと動画も生成できます。"
            : "動画の録画がうまくいかなかったため、音源とサムネイルのみ出力しました。PC版Chromeでお試しいただくか、もう一度実行してみてください。";
      }

      // ④ メタデータ
      setStep("meta");
      const meta = buildMetadata(opts);
      const prompt = buildMusicPrompt(opts);

      setResult({ thumbUrl, igThumbUrl, wavUrl, videoUrl, videoExt, videoNote, meta, prompt, wavSize: wavBlob.size, videoSize });
      setPhase("done");
    } catch (e) {
      console.error(e);
      setError(e.message || "生成中にエラーが発生しました。もう一度お試しください。");
      setPhase("error");
    }
  };

  const mb = (n) => (n / 1024 / 1024).toFixed(1) + " MB";

  const Chip = ({ on, onClick, children, disabled, title }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-full text-sm transition-all"
      style={{
        padding: "9px 16px",
        border: `1px solid ${on ? T.chipOnBorder : T.borderSoft}`,
        background: on ? T.chipOn : "rgba(255,255,255,0.02)",
        color: disabled ? "rgba(160,150,190,0.45)" : on ? T.text : T.sub,
        boxShadow: on ? `0 0 14px ${T.chipOn}` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: on ? 600 : 400,
      }}
    >
      {children}
    </button>
  );

  const Section = ({ num, title, sub, children }) => (
    <section
      className="rounded-2xl"
      style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, padding: "20px 20px 22px" }}
    >
      <div className="flex items-baseline gap-3 mb-1">
        <span style={{ color: T.accent, fontFamily: '"Shippori Mincho", serif', fontSize: 14, letterSpacing: "0.15em" }}>{num}</span>
        <h2 style={{ color: T.text, fontFamily: '"Shippori Mincho", serif', fontSize: 19, fontWeight: 700 }}>{title}</h2>
      </div>
      {sub && <p className="mb-3" style={{ color: T.sub, fontSize: 12.5 }}>{sub}</p>}
      <div className="flex flex-wrap gap-2 mt-2">{children}</div>
    </section>
  );

  const stepDefs = [
    { id: "thumb", label: "サムネイル画像を生成" },
    { id: "audio", label: "音源を生成(簡易合成エンジン)" },
    { id: "video", label: "画像と音声を結合して動画を録画(非対応端末は自動スキップ)" },
    { id: "meta", label: "YouTube用テキストを生成" },
  ];
  const stepIdx = stepDefs.findIndex((s) => s.id === step);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", sans-serif' }}>
      <style>{`
        @keyframes twinkle { 0%,100%{opacity:.15} 50%{opacity:1} }
        @keyframes floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        button:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
        ::selection { background: ${T.accent2}; color: #fff; }
      `}</style>

      {/* ===== ヒーロー ===== */}
      <header className="relative overflow-hidden" style={{ background: `${T.heroGrad}, linear-gradient(180deg, ${T.bg2}, ${T.bg})`, borderBottom: `1px solid ${T.borderSoft}` }}>
        {themeKey === "mystic" &&
          stars.map((s, i) => (
            <span key={i} className="absolute rounded-full" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, background: "#fff", opacity: s.o, animation: `twinkle ${2.5 + s.d}s ease-in-out ${s.d}s infinite` }} />
          ))}
        <div className="relative max-w-3xl mx-auto px-5 pt-10 pb-9 text-center">
          <div style={{ fontSize: 34, animation: "floaty 5s ease-in-out infinite" }}>🌙</div>
          <h1 style={{ fontFamily: '"Shippori Mincho", serif', fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 700, letterSpacing: "0.06em", background: T.btnGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginTop: 4 }}>
            Healing Music Studio
          </h1>
          <p className="mt-2" style={{ color: T.sub, fontSize: 13.5 }}>
            選ぶだけで、ヒーリングBGM・サムネイル・YouTube動画が完成
          </p>
          <p style={{ color: T.sub, fontSize: 11.5, opacity: 0.8 }}>✦ Twinkle Lab ✦</p>
          {/* テーマ切替 */}
          <div className="flex justify-center gap-2 mt-4">
            {Object.entries(THEMES).map(([k, th]) => (
              <button key={k} onClick={() => setThemeKey(k)} className="rounded-full text-xs" style={{ padding: "6px 14px", border: `1px solid ${k === themeKey ? T.accent : T.borderSoft}`, background: k === themeKey ? T.chipOn : "transparent", color: k === themeKey ? T.text : T.sub }}>
                {th.icon} {th.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-7 grid gap-4">
        <Section num="一" title="用途を選ぶ" sub="どんなシーンで聴くBGMを作りますか?">
          {USES.map((u) => (
            <Chip key={u.id} on={use === u.id} onClick={() => setUse(u.id)}>
              {u.emoji} {u.label}
            </Chip>
          ))}
        </Section>

        <Section num="二" title="ソルフェジオ周波数" sub="複数選択できます。※リラックス用途のBGMとしてお楽しみいただくもので、医療的な効果を保証するものではありません">
          {FREQS.map((f) => (
            <Chip key={f.hz} on={freqs.includes(f.hz)} onClick={() => toggle(freqs, f.hz, setFreqs)}>
              {f.hz}Hz <span style={{ opacity: 0.65, fontSize: 11 }}>{f.note}</span>
            </Chip>
          ))}
        </Section>

        <Section num="三" title="環境音" sub="複数選択できます。重ねると深みが出ます">
          {AMBIENTS.map((a) => (
            <Chip key={a.id} on={ambients.includes(a.id)} onClick={() => toggle(ambients, a.id, setAmbients)}>
              {a.emoji} {a.label}
            </Chip>
          ))}
        </Section>

        <Section num="四" title="楽器" sub="メインの音色を1つ選びます">
          {INSTRUMENTS.map((i) => (
            <Chip key={i.id} on={instrument === i.id} onClick={() => setInstrument(i.id)}>
              {i.emoji} {i.label}
            </Chip>
          ))}
        </Section>

        <Section num="五" title="長さ" sub="毎日投稿には10分がおすすめです。30分〜120分はPhase 2(サーバー生成)で対応予定">
          {DURATIONS.map((d) => (
            <Chip key={d.sec} on={durationSec === d.sec} onClick={() => setDurationSec(d.sec)}>
              {d.label}{d.sub ? ` (${d.sub})` : ""}
            </Chip>
          ))}
          {DURATIONS_P2.map((l) => (
            <Chip key={l} disabled title="Phase 2 で対応予定">
              {l} 🔒
            </Chip>
          ))}
        </Section>

        <Section num="六" title="雰囲気" sub="サムネイルの配色とタイトル文言に反映されます">
          {MOODS.map((m) => (
            <Chip key={m.id} on={mood === m.id} onClick={() => setMood(m.id)}>
              {m.label}
            </Chip>
          ))}
        </Section>

        <Section num="七" title="サムネイル文言・ブランド設定(任意)" sub="未入力の場合は、選択した内容から自動でテキストを生成します">
          <div className="w-full grid gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: T.sub }}>① サムネイルサブタイトル(例:不安を手放す / 愛と調和 / 直感を高める / 深い眠りへ)</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder={`未入力時:「${USES.find((u) => u.id === use)?.label || ""}ヒーリングミュージック」`}
                className="w-full rounded-xl text-sm"
                style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${T.borderSoft}`, color: T.text }}
              />
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: T.sub }}>② サムネイル補足テキスト(例:森の音｜10分 / 雨音｜60分 / 睡眠用BGM / 瞑想用)</label>
              <input
                type="text"
                value={supplement}
                onChange={(e) => setSupplement(e.target.value)}
                placeholder="未入力時:選択した環境音・長さから自動生成"
                className="w-full rounded-xl text-sm"
                style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${T.borderSoft}`, color: T.text }}
              />
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: T.sub }}>③ ブランド名</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {["Aura Garden", "Twinkle Star Oracle", "Healing Music Studio"].map((b) => (
                  <Chip key={b} on={brandName === b} onClick={() => setBrandName(b)}>{b}</Chip>
                ))}
              </div>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Aura Garden"
                className="w-full rounded-xl text-sm"
                style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${T.borderSoft}`, color: T.text }}
              />
            </div>
          </div>
        </Section>

        <Section num="八" title="キャラクターアイコン(任意)" sub="Serenaなどのキャラクター画像をアップロードすると、サムネイル右下に表示できます">
          <div className="w-full grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="rounded-xl cursor-pointer text-sm" style={{ padding: "12px 18px", border: `1px dashed ${T.border}`, color: T.sub }}>
                🧚 アイコン画像をアップロード
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "char")} style={{ display: "none" }} />
              </label>
              {charIcon && (
                <span className="flex items-center gap-2 text-xs" style={{ color: T.accent }}>
                  ✓ {charIconName}
                  <button onClick={() => { setCharIcon(null); setCharIconName(""); setCharEnabled(false); }} style={{ color: T.sub, textDecoration: "underline" }}>削除</button>
                </span>
              )}
            </div>

            {charIcon && (
              <>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCharEnabled((v) => !v)}
                    className="rounded-full text-sm"
                    style={{ padding: "8px 18px", border: `1px solid ${charEnabled ? T.chipOnBorder : T.borderSoft}`, background: charEnabled ? T.chipOn : "rgba(255,255,255,0.02)", color: charEnabled ? T.text : T.sub, fontWeight: charEnabled ? 600 : 400 }}
                  >
                    {charEnabled ? "✓ サムネに表示する(ON)" : "サムネに表示しない(OFF)"}
                  </button>
                </div>

                {charEnabled && (
                  <div>
                    <label className="block text-xs mb-2" style={{ color: T.sub }}>アイコンサイズ</label>
                    <input
                      type="range"
                      min="0.08"
                      max="0.36"
                      step="0.01"
                      value={charSize}
                      onChange={(e) => setCharSize(parseFloat(e.target.value))}
                      className="w-full"
                      style={{ accentColor: T.accent }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Section>
        <Section num="九" title="背景画像(任意)" sub="未設定の場合は、夜空と月のサムネイルを自動生成します">
          <label className="rounded-xl cursor-pointer text-sm" style={{ padding: "12px 18px", border: `1px dashed ${T.border}`, color: T.sub }}>
            📷 画像をアップロード
            <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "bg")} style={{ display: "none" }} />
          </label>
          {uploadedImg && (
            <span className="flex items-center gap-2 text-xs" style={{ color: T.accent }}>
              ✓ {uploadedName}
              <button onClick={() => { setUploadedImg(null); setUploadedName(""); }} style={{ color: T.sub, textDecoration: "underline" }}>削除</button>
            </span>
          )}
        </Section>

        {/* ===== 生成ボタン ===== */}
        <button
          onClick={generate}
          disabled={phase === "working"}
          className="rounded-2xl text-base"
          style={{ padding: "18px", background: phase === "working" ? "rgba(160,150,190,0.25)" : T.btnGrad, color: phase === "working" ? T.sub : T.btnText, fontWeight: 700, letterSpacing: "0.08em", boxShadow: phase === "working" ? "none" : `0 6px 28px ${T.chipOn}`, cursor: phase === "working" ? "wait" : "pointer" }}
        >
          {phase === "working" ? "✨ 生成中…(タブを開いたままお待ちください)" : "✨ BGM動画を生成する"}
        </button>

        {/* ===== 進捗 ===== */}
        {phase === "working" && (
          <div className="rounded-2xl grid gap-2" style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, padding: 18 }}>
            {stepDefs.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 text-sm" style={{ color: i < stepIdx ? T.accent : i === stepIdx ? T.text : T.sub, opacity: i > stepIdx ? 0.5 : 1 }}>
                <span>{i < stepIdx ? "✓" : i === stepIdx ? "◌" : "・"}</span>
                <span>{s.label}</span>
                {s.id === "video" && i === stepIdx && (
                  <span className="ml-auto" style={{ color: T.accent }}>{Math.round(videoProgress * 100)}%</span>
                )}
              </div>
            ))}
            {step === "video" && (
              <div className="rounded-full overflow-hidden mt-1" style={{ height: 6, background: "rgba(255,255,255,0.08)" }}>
                <div style={{ height: "100%", width: `${videoProgress * 100}%`, background: T.btnGrad, transition: "width .3s" }} />
              </div>
            )}
            <p style={{ color: T.sub, fontSize: 11.5 }}>※動画は実時間で録画します({durationLabel}の動画 = 約{durationLabel}の待ち時間)。タブは閉じずにそのままお待ちください。{durationSec >= 600 && " 10分の場合は10分ほどかかります。別のタブやアプリに切り替えるとブラウザによっては録画が止まる場合があるため、このタブを開いたままお待ちください。"}</p>
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-2xl" style={{ background: "rgba(244,114,114,0.08)", border: "1px solid rgba(244,114,114,0.4)", padding: 16, color: "#FCA5A5", fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ===== 結果 ===== */}
        {phase === "done" && result && (
          <div className="grid gap-4">
            <div className="rounded-2xl" style={{ background: T.panel, border: `1px solid ${T.border}`, padding: 20 }}>
              <h2 style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 20, color: T.accent, fontWeight: 700 }}>✨ 生成が完了しました</h2>

              {result.videoNote && (
                <p className="mt-4 rounded-xl text-sm" style={{ background: "rgba(232,195,106,0.08)", border: `1px solid ${T.border}`, padding: 12, color: T.accent }}>
                  ℹ️ {result.videoNote}
                </p>
              )}

              {result.videoUrl && (
                <>
                  <p className="mt-4 mb-2 text-sm" style={{ color: T.sub }}>▼ 動画プレビュー</p>
                  <video src={result.videoUrl} controls playsInline className="w-full rounded-xl" style={{ border: `1px solid ${T.borderSoft}` }} />
                </>
              )}

              <p className="mt-4 mb-2 text-sm" style={{ color: T.sub }}>▼ 音源プレビュー</p>
              <audio src={result.wavUrl} controls className="w-full" />

              <p className="mt-4 mb-2 text-sm" style={{ color: T.sub }}>▼ サムネイル(YouTube用 1280×720)</p>
              <img src={result.thumbUrl} alt="YouTube用サムネイル" className="w-full rounded-xl" style={{ border: `1px solid ${T.borderSoft}` }} />

              <p className="mt-4 mb-2 text-sm" style={{ color: T.sub }}>▼ サムネイル(Instagram用 1080×1080・正方形)</p>
              <img src={result.igThumbUrl} alt="Instagram用サムネイル" className="rounded-xl" style={{ maxWidth: 360, width: "100%", margin: "0 auto", display: "block", border: `1px solid ${T.borderSoft}` }} />

              <div className="flex flex-wrap gap-2 mt-5">
                {result.videoUrl && (
                  <a href={result.videoUrl} download={`healing-music.${result.videoExt}`} className="rounded-xl text-sm" style={{ padding: "11px 16px", background: T.btnGrad, color: T.btnText, fontWeight: 700 }}>
                    ⬇ 動画 {result.videoExt.toUpperCase()} ({mb(result.videoSize)})
                  </a>
                )}
                <a href={result.wavUrl} download="healing-music.wav" className="rounded-xl text-sm" style={{ padding: "11px 16px", border: `1px solid ${T.border}`, color: T.text }}>
                  ⬇ 音源 WAV ({mb(result.wavSize)})
                </a>
                <a href={result.thumbUrl} download="thumbnail-youtube.png" className="rounded-xl text-sm" style={{ padding: "11px 16px", border: `1px solid ${T.border}`, color: T.text }}>
                  ⬇ サムネイル PNG (YouTube用)
                </a>
                <a href={result.igThumbUrl} download="thumbnail-instagram.png" className="rounded-xl text-sm" style={{ padding: "11px 16px", border: `1px solid ${T.border}`, color: T.text }}>
                  ⬇ サムネイル PNG (Instagram用)
                </a>
              </div>
              <p className="mt-3" style={{ color: T.sub, fontSize: 11.5 }}>
                💡 {result.videoUrl ? `${result.videoExt.toUpperCase()} は YouTube にそのままアップロードできます。` : "音源(WAV)とサムネイル(PNG)は動画編集アプリでも組み合わせられます。"}MP4/MP3への一括変換は Phase 2(サーバー側 FFmpeg)で対応予定です。
              </p>
            </div>

            {/* YouTube テキスト */}
            <div className="rounded-2xl grid gap-4" style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, padding: 20 }}>
              <h2 style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 18, color: T.text, fontWeight: 700 }}>▶ YouTube 投稿用テキスト</h2>

              {/* ⑤ YouTubeタイトル候補 3案 */}
              <div>
                <span className="text-sm" style={{ color: T.accent }}>タイトル候補(3案)</span>
                <div className="grid gap-2 mt-1">
                  {result.meta.titles.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <pre className="flex-1 rounded-xl text-sm whitespace-pre-wrap" style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${T.borderSoft}`, padding: "10px 12px", color: T.text, fontFamily: "inherit", margin: 0 }}>{t}</pre>
                      <button onClick={() => copy(`title${i}`, t)} className="text-xs rounded-full shrink-0" style={{ padding: "4px 12px", border: `1px solid ${T.borderSoft}`, color: copied === `title${i}` ? T.accent : T.sub }}>
                        {copied === `title${i}` ? "✓" : "コピー"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ⑥ 説明文・タグ */}
              {[
                ["desc", "説明文", result.meta.description],
                ["tags", "タグ", result.meta.tags.join(", ")],
              ].map(([key, label, text]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: T.accent }}>{label}</span>
                    <button onClick={() => copy(key, text)} className="text-xs rounded-full" style={{ padding: "4px 12px", border: `1px solid ${T.borderSoft}`, color: copied === key ? T.accent : T.sub }}>
                      {copied === key ? "✓ コピーしました" : "コピー"}
                    </button>
                  </div>
                  <pre className="rounded-xl text-sm whitespace-pre-wrap" style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${T.borderSoft}`, padding: 14, color: T.text, fontFamily: "inherit", margin: 0, maxHeight: 220, overflow: "auto" }}>{text}</pre>
                </div>
              ))}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: T.accent }}>AI音楽生成プロンプト(Phase 2 API連携用)</span>
                  <button onClick={() => copy("prompt", result.prompt)} className="text-xs rounded-full" style={{ padding: "4px 12px", border: `1px solid ${T.borderSoft}`, color: copied === "prompt" ? T.accent : T.sub }}>
                    {copied === "prompt" ? "✓ コピーしました" : "コピー"}
                  </button>
                </div>
                <pre className="rounded-xl text-sm whitespace-pre-wrap" style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${T.borderSoft}`, padding: 14, color: T.sub, fontFamily: "monospace", margin: 0 }}>{result.prompt}</pre>
              </div>
            </div>

            {/* Instagram テキスト */}
            <div className="rounded-2xl grid gap-3" style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, padding: 20 }}>
              <h2 style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 18, color: T.text, fontWeight: 700 }}>📷 Instagram 投稿用キャプション</h2>
              <p style={{ color: T.sub, fontSize: 12 }}>正方形サムネイルと一緒に投稿し、本文で「プロフィールリンクからYouTubeへ」と誘導する想定の文面です。</p>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: T.accent }}>キャプション</span>
                  <button onClick={() => copy("ig", result.meta.instagramCaption)} className="text-xs rounded-full" style={{ padding: "4px 12px", border: `1px solid ${T.borderSoft}`, color: copied === "ig" ? T.accent : T.sub }}>
                    {copied === "ig" ? "✓ コピーしました" : "コピー"}
                  </button>
                </div>
                <pre className="rounded-xl text-sm whitespace-pre-wrap" style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${T.borderSoft}`, padding: 14, color: T.text, fontFamily: "inherit", margin: 0, maxHeight: 260, overflow: "auto" }}>{result.meta.instagramCaption}</pre>
              </div>
            </div>
          </div>
        )}

        <footer className="text-center pb-8 pt-2" style={{ color: T.sub, fontSize: 11 }}>
          <p>本アプリの音源・周波数はリラックス・瞑想・睡眠前のBGM用途です。医療的な効果を保証するものではありません。</p>
          <p className="mt-1">© Twinkle Lab — Healing Music Studio (Phase 1 MVP)</p>
        </footer>
      </main>
    </div>
  );
}
