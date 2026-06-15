import "./globals.css";

export const metadata = {
  title: "Healing Music Studio | Twinkle Lab",
  description:
    "選ぶだけでヒーリングBGM・サムネイル・YouTube動画を自動生成。リラックス・瞑想・睡眠前のBGM向け。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
