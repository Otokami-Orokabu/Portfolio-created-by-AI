# Fragment Shader Portfolio

Fragment Shaderによるエフェクトやdemosceneのような作品を公開するためのポートフォリオサイトです。WebGLとGLSLを使用して、インタラクティブなビジュアルエフェクトを表示します。

## 概要

このプロジェクトは、GitHub Pagesを利用してFragment Shaderのポートフォリオを公開するためのテンプレートです。以下の機能を提供します：

- 複数のShaderエフェクトの表示
- インタラクティブなプレビュー
- 各Shaderの詳細表示とパラメータ調整
- レスポンシブデザイン

## プロジェクト構造

```
/
├── index.html          # メインHTMLファイル
├── css/
│   ├── reset.css       # リセットCSS
│   └── style.css       # メインスタイル
├── js/
│   ├── webgl-utils.js  # WebGL用ユーティリティ関数
│   ├── shader-manager.js # シェーダー管理クラス
│   ├── shaders.js      # シェーダー定義
│   └── main.js         # メインJavaScript
├── shaders/            # 外部シェーダーファイル
│   └── wave.frag       # サンプルフラグメントシェーダー
└── images/             # 画像ファイル（必要に応じて）
```

## 使い方

### ローカルでの実行

このプロジェクトはシンプルなHTMLとJavaScriptで構成されていますが、ブラウザのセキュリティ制限のため、ローカルサーバーを使用して実行することをお勧めします。

```bash
# Python 3を使用する場合
python -m http.server

# Node.jsを使用する場合
npx serve
```

その後、ブラウザで `http://localhost:8000` または表示されたURLにアクセスしてください。

### GitHub Pagesでの公開

1. GitHubにリポジトリを作成します
2. このプロジェクトのファイルをリポジトリにプッシュします
3. リポジトリの設定から「GitHub Pages」を有効にします
4. ソースとして「main」ブランチを選択します

## 新しいシェーダーの追加

新しいシェーダーを追加するには、以下の2つの方法があります：

### 1. インラインでの追加

`js/shaders.js` ファイルを編集し、`Shaders.collection` 配列に新しいシェーダー定義を追加します：

```javascript
{
    id: 'your-shader-id',
    name: 'シェーダー名',
    description: 'シェーダーの説明',
    tags: ['tag1', 'tag2'],
    thumbnail: null, // サムネイル画像のURL（オプション）
    fragmentShader: `
        precision highp float;
        
        uniform vec2 u_resolution;
        uniform float u_time;
        
        varying vec2 v_texCoord;
        
        void main() {
            // シェーダーコード
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // 赤色の例
        }
    `,
    uniforms: {
        u_time: { type: '1f', value: 0 },
        u_resolution: { type: '2f', value: [0, 0] }
    },
    controls: [
        {
            name: 'parameter-name',
            label: 'パラメータ名',
            type: 'range',
            min: 0.0,
            max: 1.0,
            step: 0.01,
            default: 0.5,
            uniform: null
        }
    ]
}
```

### 2. 外部ファイルからの読み込み

1. `shaders/` ディレクトリに新しい `.frag` ファイルを作成します
2. `js/shaders.js` ファイルを編集し、新しいシェーダーを追加します：

```javascript
{
    id: 'external-shader',
    name: 'External Shader',
    description: '外部ファイルから読み込まれたシェーダー',
    tags: ['external'],
    thumbnail: null,
    fragmentShaderUrl: 'shaders/your-shader.frag', // 外部ファイルのパス
    uniforms: {
        u_time: { type: '1f', value: 0 },
        u_resolution: { type: '2f', value: [0, 0] }
    },
    controls: []
}
```

3. `js/main.js` の `initHeroShader` または `initGallery` 関数内で、シェーダーソースを読み込むコードを追加します：

```javascript
// 外部シェーダーファイルがある場合は読み込む
if (shader.fragmentShaderUrl) {
    try {
        const source = await shaderManager.loadShaderSource(shader.fragmentShaderUrl);
        shader.fragmentShader = source;
    } catch (error) {
        console.error(`Failed to load shader from ${shader.fragmentShaderUrl}:`, error);
        continue; // Skip this shader
    }
}
```

## カスタマイズ

### スタイルのカスタマイズ

`css/style.css` ファイルを編集して、サイトのスタイルをカスタマイズできます。主な変数は `:root` セレクタ内で定義されています：

```css
:root {
    /* Colors */
    --color-bg: #0a0a0a;
    --color-bg-alt: #121212;
    --color-text: #f0f0f0;
    --color-text-muted: #a0a0a0;
    --color-primary: #00b3ff;
    --color-secondary: #ff00b3;
    /* その他の変数 */
}
```

### コンテンツのカスタマイズ

`index.html` ファイルを編集して、サイトのコンテンツをカスタマイズできます：

- タイトルと説明
- OGPタグ（SNSでの共有用）
- About セクションの内容
- Contact 情報

## 技術情報

このプロジェクトは以下の技術を使用しています：

- **WebGL**: GPUアクセラレーションによるグラフィックスレンダリング
- **GLSL**: OpenGL Shading Language - シェーダープログラミング言語
- **JavaScript**: クライアントサイドのロジック
- **HTML5/CSS3**: ページ構造とスタイリング

## ブラウザ互換性

以下のモダンブラウザでテスト済みです：

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細については LICENSE ファイルを参照してください。

## 謝辞

- WebGL および GLSL の学習リソース:
  - [The Book of Shaders](https://thebookofshaders.com/)
  - [WebGL Fundamentals](https://webglfundamentals.org/)
  - [Shadertoy](https://www.shadertoy.com/)
