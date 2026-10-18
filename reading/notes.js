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
    translation: [
      '這是我養的貓 Mimi。牠是白色和灰色的。牠喜歡睡在我的床上。',
      '每天早上，牠都在門口等我。我給牠牛奶，牠就說：「喵！」Mimi 是我最好的朋友。',
    ],
    vocab: [
      { w: 'grey', ipa: '/ɡreɪ/', pos: 'adj.', zh: '灰色', eg: 'She is white and grey.' },
      { w: 'sleep', ipa: '/sliːp/', pos: 'v.', zh: '睡覺', eg: 'She likes to sleep on my bed.' },
      { w: 'waits', ipa: '/weɪts/', pos: 'v.', zh: '等待（wait 的第三人稱單數）', eg: 'She waits for me at the door.' },
      { w: 'best friend', ipa: '/ˌbest ˈfrend/', pos: 'n.', zh: '最好的朋友', eg: 'Mimi is my best friend.' },
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
      {
        point: '形容詞放 be 動詞後面',
        zh: '形容詞放喺 is／are 後面描述主語：She is white and grey。',
        from: 'She is white and grey.',
        eg: 'The cat is black and white.',
      },
      {
        point: '形容詞 + 名詞',
        zh: 'best friend：形容詞（best）放名詞（friend）前面。',
        from: 'my best friend',
        eg: 'She is my best friend.',
      },
      {
        point: '介詞 on／at（位置）',
        zh: 'on my bed（喺床上）、at the door（喺門口）：位置用 on／at。',
        from: 'on my bed',
        eg: 'The book is on the table.',
      },
    ],
  },

  'p2-schoolbus': {
    translation: [
      'Tom 每天坐校車上學。校車在七點半到。Tom 和他的朋友 Ben 一起坐。',
      '他們談論足球。有一天，校車遲了。Tom 等了十分鐘。',
      '校車來的時候，司機說了對不起。Tom 和 Ben 仍然準時到學校。',
    ],
    vocab: [
      { w: 'school bus', ipa: '/ˈskuːl bʌs/', pos: 'n.', zh: '校車', eg: 'Tom takes the school bus every day.' },
      { w: 'late', ipa: '/leɪt/', pos: 'adj.', zh: '遲到；晚了', eg: 'the bus was late' },
      { w: 'driver', ipa: '/ˈdraɪvə/', pos: 'n.', zh: '司機', eg: 'the driver said sorry' },
      { w: 'on time', ipa: '/ɒn ˈtaɪm/', pos: 'phr.', zh: '準時', eg: 'still got to school on time' },
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
      {
        point: 'at + 時間點',
        zh: 'at seven thirty = 喺七點半；具體時間點用 at。',
        from: 'at seven thirty',
        eg: 'The bus comes at eight o’clock.',
      },
      {
        point: 'every day（頻率）',
        zh: 'every day = 每日；放句尾表示習慣。',
        from: 'every day',
        eg: 'I read every day.',
      },
      {
        point: 'still（仍然）',
        zh: 'still 放動詞前面，表示「仍然、依然」。',
        from: 'still got to school',
        eg: 'He was tired but still finished his homework.',
      },
    ],
  },

  'p3-newgirl': {
    translation: [
      '新學期的第一天，Mia 覺得很緊張。她獨自站在操場上。',
      '一個叫 Sara 的女孩走過來問：「你想和我們一起玩嗎？」',
      'Mia 微笑著，加入了遊戲。',
      '放學時，Mia 對媽媽說：「我今早很害怕，但現在我交到朋友了！」',
    ],
    vocab: [
      { w: 'nervous', ipa: '/ˈnɜːvəs/', pos: 'adj.', zh: '緊張', eg: 'She feels nervous.' },
      { w: 'playground', ipa: '/ˈpleɪɡraʊnd/', pos: 'n.', zh: '操場', eg: 'She stands alone in the playground.' },
      { w: 'scared', ipa: '/skeəd/', pos: 'adj.', zh: '害怕', eg: 'I was scared this morning.' },
      { w: 'joins', ipa: '/dʒɔɪnz/', pos: 'v.', zh: '加入（join 的第三人稱單數）', eg: 'Mia smiles and joins the game.' },
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
      {
        point: 'was／were（過去式 be）',
        zh: '講過去嘅狀態用 was／were：I was scared = 我當時好驚。',
        from: 'I was scared this morning.',
        eg: 'She was happy yesterday.',
      },
      {
        point: 'named（過去分詞作形容詞）',
        zh: 'a girl named Sara = 一個叫 Sara 嘅女仔；named 修飾 girl。',
        from: 'A girl named Sara',
        eg: 'I have a dog named Lucky.',
      },
      {
        point: '現在簡單式第三人稱',
        zh: '主語係 she 時，動詞加 -s：stands、smiles、joins。',
        from: 'She stands alone',
        eg: 'She stands by the door.',
      },
    ],
  },

  'p3-lunchbox': {
    translation: [
      '學校旅行那天，家明太興奮了，沒有檢查自己的袋子。他拿起袋子就跑去校車。',
      '午餐時，他打開袋子，呆住了。裏面是一個粉紅色飯盒，不是他的藍色飯盒！',
      '「那是我的飯盒！」一個女孩說。她叫阿美。她拿錯了家明的飯盒。',
      '他們交換飯盒，一起笑了。阿美分享了她的三明治，家明給了她一塊餅乾。',
      '「幸好你坐在我旁邊。」她說。',
    ],
    vocab: [
      { w: 'excited', ipa: '/ɪkˈsaɪtɪd/', pos: 'adj.', zh: '興奮', eg: 'He was so excited about the school picnic' },
      { w: 'froze', ipa: '/frəʊz/', pos: 'v.', zh: '呆住（freeze 的過去式）', eg: 'he opened his bag and froze' },
      { w: 'wrong', ipa: '/rɒŋ/', pos: 'adj.', zh: '錯的', eg: 'She had picked up the wrong box' },
      { w: 'shared', ipa: '/ʃeəd/', pos: 'v.', zh: '分享（share 的過去式）', eg: 'They shared their sandwiches' },
      { w: 'lucky', ipa: '/ˈlʌki/', pos: 'adj.', zh: '幸運', eg: 'Lucky you sat next to me' },
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
      {
        point: '名詞所有格 his／her',
        zh: 'his = his box（他的午餐盒）；用代名詞避免重複名詞。',
        from: 'but his was red',
        eg: 'Her bag is blue; his is red.',
      },
      {
        point: '過去完成式 had + 過去分詞',
        zh: 'had picked 表示「喺故事之前已經發生」嘅事。',
        from: 'She had picked up the wrong box',
        eg: 'When I arrived, he had left.',
      },
      {
        point: '引號與直接引語',
        zh: '直接引語用引號包住；say／ask 可以放引語前或後。',
        from: "That's my box!",
        eg: '"That is my bag!" she said.',
      },
    ],
  },

  'p3-sciencefair': {
    translation: [
      '3A 班舉辦了一場科學展覽。每個學生都要展示一個實驗。',
      'Amy 和 Ken 用醋和小蘇打做了一座火山。第一次只冒出幾個氣泡。',
      '第二次比較好，但混合物溢出桌面。他們清理好，再試一次。',
      '這次，泡沫升得很高！全班拍手，老師說：「最好的部分不是火山，而是你們嘗試了三次。」',
      '他們沒有贏得第一名，但很自豪。',
    ],
    vocab: [
      { w: 'science fair', ipa: '/ˈsaɪəns feə/', pos: 'n.', zh: '科學展覽', eg: 'Class 3A held a science fair' },
      { w: 'vinegar', ipa: '/ˈvɪnɪɡə/', pos: 'n.', zh: '醋', eg: 'baking soda and vinegar' },
      { w: 'mixture', ipa: '/ˈmɪkstʃə/', pos: 'n.', zh: '混合物', eg: 'the mixture went over the table' },
      { w: 'clapped', ipa: '/klæpt/', pos: 'v.', zh: '拍手（clap 的過去式）', eg: 'the class clapped' },
      { w: 'proud', ipa: '/praʊd/', pos: 'adj.', zh: '自豪', eg: 'they felt proud' },
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
      {
        point: 'have to（必須）',
        zh: 'had to = 當時必須；後面接動詞原形 show。',
        from: 'had to show one experiment',
        eg: 'We had to finish the work.',
      },
      {
        point: '次數：three times',
        zh: 'once／twice／three times 表示次數；tried three times = 試了三次。',
        from: 'you tried three times',
        eg: 'I read it three times.',
      },
      {
        point: 'over（越過、溢出）',
        zh: 'over the table = 流過／溢出到桌面。',
        from: 'went over the table',
        eg: 'The water went over the cup.',
      },
    ],
  },

  'p4-beans': {
    translation: [
      '上個月，4B 班在課室外開始了一個小花園。他們在盒子裏種了五顆豆種子。',
      'Miss Chan 叫他們要有耐心，每天早上淋水在泥土上，但不要太多。',
      '起初，什麼都沒有發生。到了第八天，兩棵小小的綠色嫩芽出現了。',
      '他們每個星期五量度植物。四星期後，最高的植物有 18 厘米。',
      '他們學會了植物需要時間生長。',
    ],
    vocab: [
      { w: 'seeds', ipa: '/siːdz/', pos: 'n.', zh: '種子', eg: 'planted five bean seeds' },
      { w: 'soil', ipa: '/sɔɪl/', pos: 'n.', zh: '泥土', eg: 'water the soil every morning' },
      { w: 'shoots', ipa: '/ʃuːts/', pos: 'n.', zh: '嫩芽', eg: 'two tiny green shoots appeared' },
      { w: 'measured', ipa: '/ˈmeʒəd/', pos: 'v.', zh: '量度（measure 的過去式）', eg: 'They measured the plants every Friday' },
      { w: 'patient', ipa: '/ˈpeɪʃnt/', pos: 'adj.', zh: '有耐心', eg: 'told them to be patient' },
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
      {
        point: 'At first（起初）',
        zh: 'At first = 起初；後面通常用 but／then 講後來嘅變化。',
        from: 'At first, nothing happened',
        eg: 'At first, I was nervous.',
      },
      {
        point: 'tell somebody to do',
        zh: 'tell + 人 + to + 動詞：told them to be patient。',
        from: 'told them to be patient',
        eg: 'She told me to wait.',
      },
      {
        point: '最高級 tallest',
        zh: 'the + 最高級（tallest）表示「最……」。',
        from: 'the tallest plant was 18 cm',
        eg: 'He is the tallest boy in class.',
      },
    ],
  },

  'p4-library': {
    translation: [
      '陽光小學圖書館。開放時間：星期一至五上午八時至下午四時三十分（中午十二時至一時關閉午餐）。',
      '星期六上午九時至中午十二時。星期日及公眾假期休息。',
      '規則：你可以借兩本書，為期兩星期。把書歸還到門旁的紅色箱。',
      '圖書館內不准飲食。請保持安靜。故事時間：星期六上午十一時。歡迎家長參加。',
    ],
    vocab: [
      { w: 'library', ipa: '/ˈlaɪbrəri/', pos: 'n.', zh: '圖書館', eg: 'SUNSHINE PRIMARY SCHOOL LIBRARY' },
      { w: 'borrow', ipa: '/ˈbɒrəʊ/', pos: 'v.', zh: '借入', eg: 'You may borrow two books' },
      { w: 'return', ipa: '/rɪˈtɜːn/', pos: 'v.', zh: '歸還', eg: 'Return books to the red box' },
      { w: 'public holidays', ipa: '/ˌpʌblɪk ˈhɒlədeɪz/', pos: 'n.', zh: '公眾假期', eg: 'Closed on Sundays and public holidays.' },
      { w: 'welcome', ipa: '/ˈwelkəm/', pos: 'adj.', zh: '歡迎', eg: 'Parents are welcome.' },
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
      {
        point: 'from … to …（由…到…）',
        zh: 'Monday to Friday = 星期一至五；表示日期或時間範圍。',
        from: 'Monday to Friday',
        eg: 'The shop is open from 9 to 5.',
      },
      {
        point: 'closed（形容詞）',
        zh: 'Closed on Sundays = 星期日休息；closed 係形容詞，唔係動詞。',
        from: 'Closed on Sundays',
        eg: 'The library is closed today.',
      },
      {
        point: 'for + 時間長度',
        zh: 'for two weeks = 為期兩星期。',
        from: 'two books for two weeks',
        eg: 'You can keep it for three days.',
      },
    ],
  },

  'p5-oldbicycle': {
    translation: [
      '李先生還是男孩的時候，每天騎一輛舊單車上學。它又重又生鏽，鏈條經常甩掉。',
      '他的朋友笑它，但李先生不介意。他自己修理它，並學會了機器怎樣運作。',
      '很多年後，李先生成為工程師。上星期，他在父母的儲物室找到同一輛單車。',
      '他把它清潔好，裝上新輪胎，騎它到公園。「它很慢，」他說，「但它仍然能動。」',
      '他的孫子笑了，這次李先生和他們一起笑。',
    ],
    vocab: [
      { w: 'rusty', ipa: '/ˈrʌsti/', pos: 'adj.', zh: '生鏽的', eg: 'It was heavy and rusty' },
      { w: 'chain', ipa: '/tʃeɪn/', pos: 'n.', zh: '鏈條', eg: 'the chain often came off' },
      { w: 'repaired', ipa: '/rɪˈpeəd/', pos: 'v.', zh: '修理（repair 的過去式）', eg: 'He repaired it himself' },
      { w: 'engineer', ipa: '/ˌendʒɪˈnɪə/', pos: 'n.', zh: '工程師', eg: 'Mr Lee became an engineer' },
      { w: 'grandchildren', ipa: '/ˈɡræntʃɪldrən/', pos: 'n.', zh: '孫仔女', eg: 'His grandchildren laughed' },
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
      {
        point: '不規則過去式 rode',
        zh: 'ride 嘅過去式係 rode（唔係加 -ed）。',
        from: 'he rode an old bicycle',
        eg: 'She rode her bike to school.',
      },
      {
        point: '片語動詞 come off',
        zh: 'come off = 甩脫、掉下；chain came off = 鏈條甩咗。',
        from: 'the chain often came off',
        eg: 'The button came off my shirt.',
      },
      {
        point: '片語動詞 put on',
        zh: 'put on = 裝上／穿上；put on new tyres = 裝上新輪胎。',
        from: 'put on new tyres',
        eg: 'Put on your coat.',
      },
    ],
  },

  'p6-letter': {
    translation: [
      '陳校長：我代表學生會寫信。我們有一個建議，想請學校做。',
      '校園的後樓梯很暗，下雨時很滑。上個月，兩名學生在那裏跌倒。',
      '我們已在請願信上收集了 120 個簽名。我們想請學校維修第二部升降機，並在樓梯加燈。',
      '如果現在未能開始維修，學校可否至少在休息時間開放教員升降機？',
      '我們明白資源有限。然而，我們認為安全對每個人都很重要。我們希望很快收到您的回覆。',
      '此致　學生會主席 Amy Wong',
    ],
    vocab: [
      { w: 'principal', ipa: '/ˈprɪnsəpl/', pos: 'n.', zh: '校長', eg: 'Dear Principal Chan' },
      { w: 'behalf', ipa: '/bɪˈhɑːf/', pos: 'n.', zh: '代表（on behalf of）', eg: 'I am writing on behalf of the Student Council.' },
      { w: 'signatures', ipa: '/ˈsɪɡnətʃəz/', pos: 'n.', zh: '簽名', eg: 'collected 120 signatures' },
      { w: 'repair', ipa: '/rɪˈpeə/', pos: 'v.', zh: '維修', eg: 'repair the second lift' },
      { w: 'safety', ipa: '/ˈseɪfti/', pos: 'n.', zh: '安全', eg: "important for everyone's safety" },
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
      {
        point: '現在完成式 have + 過去分詞',
        zh: 'have collected = 已經收集到；強調到目前為止嘅結果。',
        from: 'have collected 120 signatures',
        eg: 'We have collected 100 signatures.',
      },
      {
        point: 'If + 現在式，could + 原形',
        zh: '禮貌提出替代方案：If…cannot…, could…?',
        from: 'If the repair cannot start now',
        eg: 'If you are busy, could we meet tomorrow?',
      },
      {
        point: 'However（然而）',
        zh: 'However 放句首，後面加逗號，表示轉折。',
        from: 'However, we think',
        eg: 'It was raining. However, we went out.',
      },
    ],
  },
  'p4-wallet': {
    translation: [
      '星期一，Ben 在校車地板上找到一個棕色錢包。他打開它，看到一張車票卡、一張照片和二十元。',
      '他第一個念頭是把錢留給自己，但他想起老師的話：「誠實的人會歸還不屬於自己的東西。」',
      '他把錢包交給司機。第二天早上，一位老婆婆來到學校辦公室。錢包是她的。',
      '她感謝 Ben，並送他一小盒餅乾。Ben 覺得比拿著那些錢更快樂。',
    ],
    vocab: [
      { w: 'wallet', ipa: '/ˈwɒlɪt/', pos: 'n.', zh: '錢包', eg: 'Ben found a brown wallet.' },
      { w: 'honest', ipa: '/ˈɒnɪst/', pos: 'adj.', zh: '誠實的', eg: 'Honest people return what is not theirs.' },
      { w: 'office', ipa: '/ˈɒfɪs/', pos: 'n.', zh: '辦公室', eg: 'an old lady came to the school office' },
      { w: 'cookies', ipa: '/ˈkʊkiz/', pos: 'n.', zh: '餅乾', eg: 'a small box of cookies' },
      { w: 'happier', ipa: '/ˈhæpiə/', pos: 'adj.', zh: '更快樂（happy 的比較級）', eg: 'Ben felt happier' },
    ],
    grammar: [
      {
        point: '過去式講故事',
        zh: '故事用過去式順序講：found、opened、saw、gave、came、thanked、felt。',
        from: 'Ben found a brown wallet',
        eg: 'She found a wallet and gave it to the driver.',
      },
      {
        point: '名詞所有格 hers',
        zh: 'hers = her wallet（她的錢包）；同 my／mine、your／yours 一樣，後面唔再加名詞。',
        from: 'The wallet was hers.',
        eg: 'This bag is mine; that one is hers.',
      },
      {
        point: 'but 轉折',
        zh: 'but 連接兩個相反意思：想留錢，但想起老師的話。',
        from: 'but he remembered his teacher',
        eg: 'He was tired, but he finished his work.',
      },
      {
        point: '比較級 happier than',
        zh: 'happy → happier；比較兩樣嘢用 than。',
        from: 'happier than he would have',
        eg: 'She feels happier than before.',
      },
      {
        point: '引號引用別人的話',
        zh: '用引號包住直接引語；呢句係老師講嘅話，所以用引號。',
        from: 'Honest people return what is not theirs.',
        eg: 'My teacher said, "Be honest."',
      },
    ],
  },
};
