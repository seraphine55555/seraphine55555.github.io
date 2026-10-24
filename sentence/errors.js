/*
 * 句子改錯題庫（2026-10-25，9 題：P4–P6 各 3）
 *
 * 研究（research/sentence-practice-formats.md）指出 error correction 係可離線、
 * 可確定性批改嘅練習：一句只有一個錯處，先點錯字，再揀正確寫法。
 * 每個 item：
 *   tokens    原句（錯字在 wrong index）
 *   fixes     [正確寫法, 干擾項, 干擾項]；UI 會打亂次序
 *   why       文法解釋
 */
window.SENTENCE_ERRORS = [
  {
    id: 'e-p4-1',
    level: 'P4',
    tokens: ['She', 'go', 'to', 'school', 'by', 'bus', 'every', 'day'],
    wrong: 1,
    fixes: ['goes', 'going', 'went'],
    why: '主語 She 是第三人稱單數，現在式動詞要加 -s：goes。',
    zh: '她每天乘巴士上學。',
  },
  {
    id: 'e-p4-2',
    level: 'P4',
    tokens: ['There', 'is', 'many', 'books', 'on', 'the', 'shelf'],
    wrong: 1,
    fixes: ['are', 'was', 'be'],
    why: '主語 many books 是複數，動詞要用 are；There is 只接單數。',
    zh: '書架上有許多書。',
  },
  {
    id: 'e-p4-3',
    level: 'P4',
    tokens: ['He', "don't", 'like', 'carrots'],
    wrong: 1,
    fixes: ["doesn't", 'not', "didn't"],
    why: '主語 He 是第三人稱單數，否定要用 doesn\'t + 動詞原形。',
    zh: '他不喜歡紅蘿蔔。',
  },
  {
    id: 'e-p5-1',
    level: 'P5',
    tokens: ['The', 'children', 'was', 'playing', 'in', 'the', 'park'],
    wrong: 2,
    fixes: ['were', 'is', 'been'],
    why: 'The children 是複數，過去進行式要用 were + V-ing。',
    zh: '孩子們當時正在公園玩耍。',
  },
  {
    id: 'e-p5-2',
    level: 'P5',
    tokens: ['I', 'have', 'saw', 'that', 'film', 'before'],
    wrong: 2,
    fixes: ['seen', 'see', 'seeing'],
    why: '現在完成式 have + 過去分詞；see 的過去分詞是 seen，不是過去式 saw。',
    zh: '我以前看過那部電影。',
  },
  {
    id: 'e-p5-3',
    level: 'P5',
    tokens: ['We', 'have', 'been', 'friends', 'since', 'ten', 'years'],
    wrong: 4,
    fixes: ['for', 'from', 'at'],
    why: 'for + 一段時間（ten years）；since 後面要接過去時間點，不是時長。',
    zh: '我們已經做了十年朋友。',
  },
  {
    id: 'e-p6-1',
    level: 'P6',
    tokens: ['Neither', 'of', 'the', 'boys', 'were', 'ready'],
    wrong: 4,
    fixes: ['was', 'are', 'be'],
    why: 'Neither of + 複數名詞，正式書面語動詞用單數 was。',
    zh: '兩個男孩都未準備好。',
  },
  {
    id: 'e-p6-2',
    level: 'P6',
    tokens: ['The', 'news', 'are', 'very', 'good', 'today'],
    wrong: 2,
    fixes: ['is', 'be', 'were'],
    why: 'news 雖然以 -s 結尾，但屬不可數名詞，動詞用單數 is。',
    zh: '今天的新聞很好。',
  },
  {
    id: 'e-p6-3',
    level: 'P6',
    tokens: ['She', 'suggested', 'that', 'he', 'goes', 'home', 'early'],
    wrong: 4,
    fixes: ['go', 'went', 'going'],
    why: 'suggest that + 主語 + (should) + 動詞原形；所以用 go，不是 goes。',
    zh: '她建議他早點回家。',
  },
];
