# Healing Music Studio (Phase 1 MVP)

Twinkle Lab — AIヒーリングBGM生成スタジオ

## Vercelへのデプロイ手順(GUIのみ・コマンド不要)

### 方法A: GitHub経由(推奨・以後の更新が楽)

1. このzipを解凍し、フォルダの中身を GitHub の新規リポジトリ(例: `healing-music-studio`)にアップロード
   - GitHubの「Add file → Upload files」で `app/` `components/` `package.json` などをまとめてドラッグ&ドロップでOK
2. https://vercel.com にログイン → 「Add New... → Project」
3. 「Import Git Repository」で先ほどのリポジトリを選択
4. Framework Preset は自動で **Next.js** と検出されます(変更不要)
5. そのまま「Deploy」をクリック
6. 数分でビルドが完了し、`https://〇〇.vercel.app` のURLが発行されます

### 方法B: Vercel CLIで直接アップロード

1. zipを解凍
2. フォルダ内で以下を実行
   ```
   npx vercel
   ```
3. 質問にすべて Enter(デフォルト)で進めればデプロイされます
4. 本番反映する場合は
   ```
   npx vercel --prod
   ```

## 確認すること

- トップページにアクセスし、「✨ BGM動画を生成する」を押す
- 30秒(デフォルト)で完了し、以下が表示されればOK
  - 音源プレビュー(再生できる)
  - サムネイル画像
  - 動画プレビュー(PC版Chrome/Edge/Firefoxで表示。対応していない端末では自動的にスキップされ、その旨のメッセージが出ます)
  - YouTube用タイトル・説明文・タグ

## 今後の拡張(Phase 2)

- サーバー側 FFmpeg による MP4/MP3 変換・長尺(10〜120分)対応
- AI音楽生成APIとの連携(`prompt` フィールドをそのまま利用可能)
- Twinkle Star Oracle との連携(占い結果 → 専用BGM生成)

## ファイル構成

```
healing-music-studio/
├── app/
│   ├── layout.js      ... 全体レイアウト・フォント読み込み
│   ├── page.js         ... トップページ
│   └── globals.css      ... Tailwind読み込み
├── components/
│   └── HealingMusicStudio.jsx ... メイン機能(UI・音声生成・動画生成・YouTube文言生成)
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

