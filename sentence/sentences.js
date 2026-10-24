/*
 * 句子重組題庫（2026-10-24）
 *
 * 12 句：P3–P6 各 3 句，覆蓋 HK 小學常見語法（時態、被動、條件句、關係子句、倒裝）。
 * `tokens` 係正確次序；顯示時自動加句號。每句有中文文法提示＋英文短提示＋全句翻譯。
 */
window.SENTENCE_BANK = [
  {
    id: 'p3-1',
    level: 'P3',
    tokens: ['My', 'sister', 'likes', 'to', 'read', 'comic', 'books', 'after', 'dinner'],
    zh: '我姐姐喜歡在晚飯後看漫畫書。',
    hint: { zh: '主語 My sister 是第三人稱單數，like 要加 -s；like to + 動詞原形表示「喜歡做某事」。', en: 'Third-person singular takes -s: likes. Use "like to + base verb".' },
  },
  {
    id: 'p3-2',
    level: 'P3',
    tokens: ['The', 'children', 'were', 'excited', 'about', 'the', 'school', 'picnic'],
    zh: '孩子們對學校旅行感到興奮。',
    hint: { zh: 'were 是 are 的過去式；be excited about = 對……感到興奮。', en: 'were = past of are; "be excited about" + noun.' },
  },
  {
    id: 'p3-3',
    level: 'P3',
    tokens: ['We', 'should', 'brush', 'our', 'teeth', 'twice', 'a', 'day'],
    zh: '我們應該每天刷牙兩次。',
    hint: { zh: 'should + 動詞原形；twice a day = 每日兩次。', en: 'should + base verb; "twice a day" = two times every day.' },
  },
  {
    id: 'p4-1',
    level: 'P4',
    tokens: ['Although', 'it', 'was', 'raining', 'we', 'decided', 'to', 'go', 'hiking'],
    zh: '雖然當時在下雨，我們還是決定去遠足。',
    hint: { zh: 'Although 引導讓步子句，後面不能再加 but；decide to + 動詞原形。', en: 'Although introduces a contrast clause (no "but"); "decide to + base verb".' },
  },
  {
    id: 'p4-2',
    level: 'P4',
    tokens: ['The', 'students', 'were', 'asked', 'to', 'finish', 'their', 'project', 'by', 'Friday'],
    zh: '學生們被要求在星期五前完成專題。',
    hint: { zh: '被動語態：were asked（be + 過去分詞）；by Friday = 最遲星期五。', en: 'Passive: were + past participle (asked); "by Friday" = no later than Friday.' },
  },
  {
    id: 'p4-3',
    level: 'P4',
    tokens: ['She', 'has', 'been', 'learning', 'the', 'piano', 'since', 'she', 'was', 'five'],
    zh: '她從五歲起就一直在學鋼琴。',
    hint: { zh: '現在完成進行式：has been + V-ing，表示由過去持續到現在；since + 過去時間點。', en: 'Present perfect continuous: has been + -ing; "since" + a past point.' },
  },
  {
    id: 'p5-1',
    level: 'P5',
    tokens: ['If', 'I', 'had', 'more', 'time', 'I', 'would', 'practise', 'the', 'violin', 'every', 'day'],
    zh: '如果我有更多時間，我會每天練習小提琴。',
    hint: { zh: '第二條件句（與現在事實相反）：If + 過去式，would + 動詞原形。', en: 'Second conditional: If + past, would + base verb.' },
  },
  {
    id: 'p5-2',
    level: 'P5',
    tokens: ['The', 'book', 'which', 'you', 'borrowed', 'from', 'the', 'library', 'is', 'due', 'today'],
    zh: '你從圖書館借的那本書今天到期。',
    hint: { zh: 'which 引導關係子句修飾 The book；be due = 到期。', en: '"which" introduces a relative clause; "be due" = must be returned.' },
  },
  {
    id: 'p5-3',
    level: 'P5',
    tokens: ['Not', 'only', 'did', 'he', 'finish', 'the', 'race', 'but', 'he', 'also', 'broke', 'the', 'record'],
    zh: '他不但完成了比賽，還打破了紀錄。',
    hint: { zh: 'Not only 放句首要用倒裝 did he；but also 前後要對稱。', en: '"Not only" at the start needs inversion (did he); "but also" keeps the two parts parallel.' },
  },
  {
    id: 'p6-1',
    level: 'P6',
    tokens: ['The', 'teacher', 'suggested', 'that', 'we', 'should', 'hand', 'in', 'our', 'essays', 'earlier'],
    zh: '老師建議我們早些交論文。',
    hint: { zh: 'suggest that + 主語 + (should) + 動詞原形；hand in = 提交。', en: 'suggest that + subject + (should) + base verb; "hand in" = submit.' },
  },
  {
    id: 'p6-2',
    level: 'P6',
    tokens: ['Had', 'it', 'not', 'been', 'for', 'your', 'help', 'we', 'would', 'have', 'missed', 'the', 'train'],
    zh: '要不是你幫忙，我們就會錯過火車。',
    hint: { zh: '倒裝第三條件句：Had it not been for = If it had not been for；主句用 would have + 過去分詞。', en: 'Inverted third conditional: "Had it not been for..." = "If it had not been for..."; main clause uses would have + past participle.' },
  },
  {
    id: 'p6-3',
    level: 'P6',
    tokens: ['The', 'more', 'you', 'practise', 'the', 'more', 'confident', 'you', 'will', 'become'],
    zh: '你練習得越多，就會越有自信。',
    hint: { zh: 'the + 比較級, the + 比較級 = 越……越……。', en: '"the + comparative, the + comparative" = the more..., the more...' },
  },
];
