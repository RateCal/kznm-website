# 京華風の芽 ― 公式ウェブサイトテンプレート

> 架空会社「京華風の芽（Kyoka Kaze no Me）」のコーポレートサイトテンプレートです。

---

## ファイル構成

```
.
├── index.html          # トップページ
├── about.html          # 会社概要
├── services.html       # 事業内容
├── news.html           # お知らせ一覧
├── contact.html        # お問い合わせ
├── privacy.html        # プライバシーポリシー
├── css/
│   └── style.css       # 共通スタイルシート
├── js/
│   └── main.js         # 共通JavaScript
└── images/
    ├── favicon.svg     # ファビコン（SVG）
    ├── placeholder.svg # 画像プレースホルダー
    ├── hero.jpg        # ★ ヒーロー画像（要追加）
    ├── about.jpg       # ★ 会社紹介画像（要追加）
    ├── representative.jpg  # ★ 代表者写真（要追加）
    ├── gallery-1.jpg   # ★ ギャラリー画像（要追加）
    ├── gallery-2.jpg   # ★ ギャラリー画像（要追加）
    ├── gallery-3.jpg   # ★ ギャラリー画像（要追加）
    ├── gallery-4.jpg   # ★ ギャラリー画像（要追加）
    ├── service-1.jpg   # ★ サービス01画像（要追加）
    ├── service-2.jpg   # ★ サービス02画像（要追加）
    ├── service-3.jpg   # ★ サービス03画像（要追加）
    └── og-image.jpg    # ★ OGP画像（要追加: 1200×630px）
```

---

## カスタマイズ手順

### 1. テキストの編集

各HTMLファイルの中に `【〇〇を入力してください】` というプレースホルダーがあります。
そこに実際のテキストを入れてください。

### 2. 画像の追加

`images/` フォルダに以下の画像を配置してください（★ マークのもの）。

| ファイル名 | 推奨サイズ | 用途 |
|---|---|---|
| `hero.jpg` | 1920×1080px | トップのメインビジュアル |
| `about.jpg` | 800×600px | 会社紹介セクション |
| `representative.jpg` | 400×400px | 代表者写真（正方形） |
| `gallery-1.jpg` | 1200×900px | ギャラリー（大） |
| `gallery-2〜4.jpg` | 800×600px | ギャラリー（小） |
| `service-1〜3.jpg` | 800×600px | 各サービス画像 |
| `og-image.jpg` | 1200×630px | SNS共有時のOGP画像 |

### 3. カラーの変更

`css/style.css` の冒頭にある CSS カスタムプロパティを編集してください。

```css
:root {
  --color-primary:    #2d5016;   /* メインカラー（深緑） */
  --color-secondary:  #8fbc4b;   /* アクセント（若草） */
  --color-accent:     #c8a951;   /* 強調色（金茶） */
  --color-bg:         #fafaf7;   /* 背景色（生成り） */
}
```

### 4. お問い合わせフォームの送信設定

静的HTMLのため、フォームの送信には外部サービスとの連携が必要です。

**方法 A: Formspree（無料プランあり）**
1. [https://formspree.io](https://formspree.io) でアカウント作成
2. フォームIDを取得し、`contact.html` の `action="#"` を `action="https://formspree.io/f/YOUR_ID"` に変更

**方法 B: Netlify Forms（Netlifyでホストする場合）**
1. `contact.html` の `<form>` タグに `data-netlify="true"` を追加
2. Netlify にデプロイするだけで自動的に動作

---

## GitHub Pages での公開方法

1. このリポジトリを GitHub にプッシュ
2. リポジトリの **Settings → Pages** を開く
3. Source を `main` ブランチ / `/ (root)` に設定
4. 数分後に `https://YOUR_USERNAME.github.io/YOUR_REPO/` で公開される

---

## 使用フォント

- [Noto Serif JP](https://fonts.google.com/noto/specimen/Noto+Serif+JP) — 日本語セリフ体
- [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) — 英語セリフ体

いずれも Google Fonts から読み込んでいます。ローカルフォントに切り替える場合は `css/style.css` の `@import` を変更してください。

---

## ライセンス

このテンプレートは自由にご利用・改変いただけます。
商用・非商用問わず利用可能です。クレジット表記は不要です。
