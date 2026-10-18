/*
 * 閱讀理解「詞句詳解」（2026-10-18）
 *
 * 每篇文章：4–5 個生字／片語 + 2 個文法點。
 * 設計原則：
 *   - `w`（生字）一定要喺正文出現（lint 會驗）；
 *   - `from` 一定係正文嘅原文片段（lint 會驗 substring）；
 *   - 解釋用中文，例句尽量短，方便家長講一次就明；
 *   - 唔會取代逐題四選項解釋，係額外一層「點解篇文章咁寫」。
 */
window.READING_NOTES = {
  'p1-mycat': {
    vocab: [
      { w: 'grey', pos: 'adj.', zh: '灰色', eg: 'She is white and grey.' },
      { w: 'sleep', pos: 'v.', zh: '睡覺', eg: 'She likes to sleep on my bed.' },
      { w: 'waits', pos: 'v.', zh: '等待（wait 的第三人稱單數）', eg: 'She waits for me at the door.' },
      { w: 'best friend', pos: 'n.', zh: '最好的朋友', eg: 'Mimi is my best friend.' },
    ],
    grammar: [
      {
        point: '第三人稱單數 +s',
        zh: '主語係 he／she／it（或者一隻貓）時，現在式動詞要加 -s：like → likes、wait → waits、say → says。',
        from: 'She likes to sleep',
        eg: 'She likes milk. / Mimi waits at the door.',
      },
      {
        point: '現在簡單式講習慣',
        zh: '每日都會發生的事用現在簡單式，常配 Every morning／every day。',
        from: 'Every morning, she waits for me',
        eg: 'Every morning, I feed my cat.',
      },
    ],
  },

  'p2-schoolbus': {
    vocab: [
      { w: 'school bus', pos: 'n.', zh: '校車', eg: 'Tom takes the school bus every day.' },
      { w: 'late', pos: 'adj.', zh: '遲到；晚了', eg: 'the bus was late' },
      { w: 'driver', pos: 'n.', zh: '司機', eg: 'the driver said sorry' },
      { w: 'on time', pos: 'phr.', zh: '準時', eg: 'still got to school on time' },
    ],
    grammar: [
      {
        point: '過去簡單式',
        zh: '講過去發生嘅事：was／were、waited、said、came。動詞要轉過去式。',
        from: 'the bus was late',
        eg: 'The bus was late. Tom waited for ten minutes.',
      },
      {
        point: 'When 子句',
        zh: 'When + 過去式，表示「當……嘅時候」，後面接另一件已發生嘅事。',
        from: 'When the bus came',
        eg: 'When the bus came, the driver said sorry.',
      },
    ],
  },

  'p3-newgirl': {
    vocab: [
      { w: 'nervous', pos: 'adj.', zh: '緊張', eg: 'She feels nervous.' },
      { w: 'playground', pos: 'n.', zh: '操場', eg: 'She stands alone in the playground.' },
      { w: 'scared', pos: 'adj.', zh: '害怕', eg: 'I was scared this morning.' },
      { w: 'joins', pos: 'v.', zh: '加入（join 的第三人稱單數）', eg: 'Mia smiles and joins the game.' },
    ],
    grammar: [
      {
        point: 'feel + 形容詞',
        zh: '講感受用 feel + 形容詞：feel nervous／feel happy，唔需要加 very 都可以。',
        from: 'She feels nervous.',
        eg: 'I feel happy on the first day.',
      },
      {
        point: 'Do you …? 問句',
        zh: '現在簡單式問句：Do + 主語 + 動詞原形。答句用 Yes, I do.／No, I don’t.',
        from: 'Do you want to play with us?',
        eg: 'Do you want to play? — Yes, I do.',
      },
    ],
  },

  'p3-lunchbox': {
    vocab: [
      { w: 'excited', pos: 'adj.', zh: '興奮', eg: 'He was so excited about the school picnic' },
      { w: 'froze', pos: 'v.', zh: '呆住（freeze 的過去式）', eg: 'he opened his bag and froze' },
      { w: 'wrong', pos: 'adj.', zh: '錯的', eg: 'She had picked up the wrong box' },
      { w: 'shared', pos: 'v.', zh: '分享（share 的過去式）', eg: 'They shared their sandwiches' },
      { w: 'lucky', pos: 'adj.', zh: '幸運', eg: 'Lucky you sat next to me' },
    ],
    grammar: [
      {
        point: 'so … that …',
        zh: '「如此……以致……」：so + 形容詞 + that + 結果。',
        from: 'He was so excited about the school picnic that he did not check his bag.',
        eg: 'He was so tired that he fell asleep.',
      },
      {
        point: '過去式講故事',
        zh: '故事用過去式順序講：put → ran → opened → froze → said → smiled → gave。',
        from: 'he opened his bag and froze',
        eg: 'She opened the box and smiled.',
      },
    ],
  },

  'p3-sciencefair': {
    vocab: [
      { w: 'science fair', pos: 'n.', zh: '科學展覽', eg: 'Class 3A held a science fair' },
      { w: 'vinegar', pos: 'n.', zh: '醋', eg: 'baking soda and vinegar' },
      { w: 'mixture', pos: 'n.', zh: '混合物', eg: 'the mixture went over the table' },
      { w: 'clapped', pos: 'v.', zh: '拍手（clap 的過去式）', eg: 'the class clapped' },
      { w: 'proud', pos: 'adj.', zh: '自豪', eg: 'they felt proud' },
    ],
    grammar: [
      {
        point: '不規則過去式',
        zh: '唔少動詞嘅過去式唔加 -ed：make → made、go → went、say → said、feel → felt。',
        from: 'Amy and Ken made a volcano',
        eg: 'They made a volcano and felt proud.',
      },
      {
        point: '比較級 better',
        zh: 'good 嘅比較級係 better；比較兩次嘗試邊次好。',
        from: 'The second try was better',
        eg: 'This try is better than the first one.',
      },
    ],
  },

  'p4-beans': {
    vocab: [
      { w: 'seeds', pos: 'n.', zh: '種子', eg: 'planted five bean seeds' },
      { w: 'soil', pos: 'n.', zh: '泥土', eg: 'water the soil every morning' },
      { w: 'shoots', pos: 'n.', zh: '嫩芽', eg: 'two tiny green shoots appeared' },
      { w: 'measured', pos: 'v.', zh: '量度（measure 的過去式）', eg: 'They measured the plants every Friday' },
      { w: 'patient', pos: 'adj.', zh: '有耐心', eg: 'told them to be patient' },
    ],
    grammar: [
      {
        point: '過去式敘述實驗',
        zh: '講一次實驗過程用過去式：started、planted、happened、appeared、measured、learned。',
        from: 'Class 4B started a small garden',
        eg: 'We started the experiment last week.',
      },
      {
        point: 'every + 時間（習慣）',
        zh: 'every Friday／every morning 表示規律；同現在簡單式或過去式都用得。',
        from: 'every Friday',
        eg: 'They measured the plants every Friday.',
      },
    ],
  },

  'p4-library': {
    vocab: [
      { w: 'library', pos: 'n.', zh: '圖書館', eg: 'SUNSHINE PRIMARY SCHOOL LIBRARY' },
      { w: 'borrow', pos: 'v.', zh: '借入', eg: 'You may borrow two books' },
      { w: 'return', pos: 'v.', zh: '歸還', eg: 'Return books to the red box' },
      { w: 'public holidays', pos: 'n.', zh: '公眾假期', eg: 'Closed on Sundays and public holidays.' },
      { w: 'welcome', pos: 'adj.', zh: '歡迎', eg: 'Parents are welcome.' },
    ],
    grammar: [
      {
        point: '祈使句（告示）',
        zh: '告示常用祈使句：動詞原形開頭，省略主語 You。',
        from: 'Return books to the red box near the door.',
        eg: 'Return books to the red box. / Show your student card.',
      },
      {
        point: 'may 表示許可',
        zh: 'may + 動詞原形 = 可以（正式、告示語氣）。',
        from: 'You may borrow two books',
        eg: 'You may borrow two books for two weeks.',
      },
    ],
  },

  'p5-oldbicycle': {
    vocab: [
      { w: 'rusty', pos: 'adj.', zh: '生鏽的', eg: 'It was heavy and rusty' },
      { w: 'chain', pos: 'n.', zh: '鏈條', eg: 'the chain often came off' },
      { w: 'repaired', pos: 'v.', zh: '修理（repair 的過去式）', eg: 'He repaired it himself' },
      { w: 'engineer', pos: 'n.', zh: '工程師', eg: 'Mr Lee became an engineer' },
      { w: 'grandchildren', pos: 'n.', zh: '孫仔女', eg: 'His grandchildren laughed' },
    ],
    grammar: [
      {
        point: '反身代名詞 himself',
        zh: '主語同動作接收者係同一個人時用 himself／herself／myself。',
        from: 'He repaired it himself',
        eg: 'She cleaned the room herself.',
      },
      {
        point: 'laugh at（片語）',
        zh: 'laugh at somebody = 嘲笑某人；唔好漏咗 at。',
        from: 'His friends laughed at it',
        eg: 'Do not laugh at other people.',
      },
    ],
  },

  'p6-letter': {
    vocab: [
      { w: 'principal', pos: 'n.', zh: '校長', eg: 'Dear Principal Chan' },
      { w: 'behalf', pos: 'n.', zh: '代表（on behalf of）', eg: 'I am writing on behalf of the Student Council.' },
      { w: 'signatures', pos: 'n.', zh: '簽名', eg: 'collected 120 signatures' },
      { w: 'repair', pos: 'v.', zh: '維修', eg: 'repair the second lift' },
      { w: 'safety', pos: 'n.', zh: '安全', eg: "important for everyone's safety" },
    ],
    grammar: [
      {
        point: '書信格式',
        zh: '正式書信：Dear + 稱謂開頭；結尾用 Yours sincerely，下面簽名。',
        from: 'Yours sincerely,',
        eg: 'Dear Mr Chan, … Yours sincerely, Amy Wong',
      },
      {
        point: 'would like to（禮貌請求）',
        zh: 'would like to + 動詞原形，比 want to 有禮貌，適合寫信。',
        from: 'We would like to ask the school',
        eg: 'We would like to ask for your help.',
      },
    ],
  },
};
