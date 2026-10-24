/*
 * 句子合併題庫（2026-10-24，pilot）
 *
 * 研究結論：重組句子只係 Killgallon 六種練習之一，亦係考試題型；
 * sentence combining 有最強證據（Quill Connect 用預先寫好嘅答案集做即時批改，
 * 所以離線、零 AI 都做得到）。呢個 pilot 用 6 題 P4–P6，每題：
 *   1. 兩個 kernel sentences
 *   2. 三選一 connector（錯咗有 reason-based hint）
 *   3. 用同一批詞排成合併句（答案唯一）
 *
 * `tokens` 係完整正確次序（包括 connector）；顯示時自動加句號。
 */
window.SENTENCE_COMBINE = [
  {
    id: 'c-p4-1',
    level: 'P4',
    kernels: ['It was raining.', 'We went hiking.'],
    connector: 'Although',
    options: [
      { w: 'Although', ok: true, why: 'Although 表示讓步：雖然下雨，我們仍然去遠足。' },
      { w: 'Because', ok: false, why: 'Because 表示原因；下雨唔係「去遠足」嘅原因，句子重點係讓步。' },
      { w: 'So', ok: false, why: 'So 表示結果；呢句唔係講「所以去遠足」，而係「雖然下雨都去」。' },
    ],
    tokens: ['Although', 'it', 'was', 'raining', 'we', 'went', 'hiking'],
    zh: '雖然當時在下雨，我們還是去遠足了。',
    why: 'Although 放句首帶出讓步子句，逗號後才是主句；唔可以再加 but。',
  },
  {
    id: 'c-p4-2',
    level: 'P4',
    kernels: ['The boy finished his homework.', 'He was tired.'],
    connector: 'After',
    options: [
      { w: 'After', ok: true, why: 'After 表示時間先後：做功課之後才疲倦。' },
      { w: 'Although', ok: false, why: 'Although 係讓步；疲倦唔係讓步，而係時間先後。' },
      { w: 'Because', ok: false, why: 'Because 係原因；句子冇講「因為疲倦所以做功課」。' },
    ],
    tokens: ['After', 'the', 'boy', 'finished', 'his', 'homework', 'he', 'was', 'tired'],
    zh: '男孩做完功課之後，感到很疲倦。',
    why: 'After 引導時間子句；主句用 he 指返 the boy。',
  },
  {
    id: 'c-p4-3',
    level: 'P4',
    kernels: ['The book is due today.', 'You borrowed it from the library.'],
    connector: 'which',
    options: [
      { w: 'which', ok: true, why: 'which 引導關係子句，修飾 The book（物件）。' },
      { w: 'who', ok: false, why: 'who 只修飾人；The book 係物件，所以用 which。' },
      { w: 'because', ok: false, why: 'because 講原因；呢句係描述「你借嘅嗰本書」，唔係原因。' },
    ],
    tokens: ['The', 'book', 'which', 'you', 'borrowed', 'from', 'the', 'library', 'is', 'due', 'today'],
    zh: '你從圖書館借的那本書今天到期。',
    why: 'which 緊貼被修飾嘅名詞 The book；關係子句之後才返回主句 is due today。',
  },
  {
    id: 'c-p5-1',
    level: 'P5',
    kernels: ['I had more time.', 'I would practise the violin.'],
    connector: 'If',
    options: [
      { w: 'If', ok: true, why: 'If 引導第二條件句：與現在事實相反嘅假設。' },
      { w: 'Although', ok: false, why: 'Although 係讓步；呢句係假設「如果有更多時間」，唔係轉折。' },
      { w: 'Because', ok: false, why: 'Because 係原因；呢句用 would，係假設而唔係已發生嘅原因。' },
    ],
    tokens: ['If', 'I', 'had', 'more', 'time', 'I', 'would', 'practise', 'the', 'violin'],
    zh: '如果我有更多時間，我會練習小提琴。',
    why: '第二條件句：If + 過去式（had），主句用 would + 動詞原形（practise）。',
  },
  {
    id: 'c-p5-2',
    level: 'P5',
    kernels: ['She was late.', 'The bus broke down.'],
    connector: 'because',
    options: [
      { w: 'because', ok: true, why: 'because 表示原因：巴士壞咗係遲到嘅原因。' },
      { w: 'so', ok: false, why: 'so 表示結果；「遲到」係結果，「巴士壞咗」係原因，方向相反。' },
      { w: 'although', ok: false, why: 'although 係讓步；呢兩句係因果關係，唔係轉折。' },
    ],
    tokens: ['She', 'was', 'late', 'because', 'the', 'bus', 'broke', 'down'],
    zh: '她遲到了，因為巴士壞了。',
    why: 'because 引導原因子句，放在主句後面；broke down 係「故障」嘅固定配搭。',
  },
  {
    id: 'c-p6-1',
    level: 'P6',
    kernels: ['He finished the race.', 'He broke the record.'],
    connector: 'Not only',
    options: [
      { w: 'Not only', ok: true, why: 'Not only 放句首要用倒裝 did he，後面用 but he also 保持對稱。' },
      { w: 'Although', ok: false, why: 'Although 係讓步；呢句係「不但……而且……」嘅遞進。' },
      { w: 'If', ok: false, why: 'If 係條件；呢句係兩件已完成嘅事，唔係假設。' },
    ],
    tokens: ['Not', 'only', 'did', 'he', 'finish', 'the', 'race', 'but', 'he', 'also', 'broke', 'the', 'record'],
    zh: '他不但完成了比賽，還打破了紀錄。',
    why: 'Not only 置句首用倒裝 did he + 原形 finish；but he also 後面用過去式 broke，兩邊對稱。',
  },
];
