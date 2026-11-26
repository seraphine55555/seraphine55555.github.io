/* CardLab app.js — 路由 + 畫面（P1，純靜態、無框架）
 *
 * 流程：主頁 → 影相 → 分析中（壓縮／OCR／理解／出卡）→ 確認 → 練習 → 完成
 * 另外：理解頁、掌握地圖、卡組頁、設定頁、貼上建卡。
 *
 * 私隱：相片只留喺記憶體（state.photo），唔寫 localStorage／IndexedDB；
 *      未撳「開始分析」之前唔會發任何外部請求。
 */
(function (global) {
  'use strict';

  var S = global.CardLabStore;
  var Srs = global.CardLabSrs;
  var P = global.CardLabParse;
  var Ai = global.CardLabAi;
  var M = global.CardLabMap;
  var Pr = global.CardLabPrint;

  var OCR_TIMEOUT = 120000;
  var CHAT_TIMEOUT = 60000;

  // ─────────────────────────── i18n ───────────────────────────
  var DICT = {
    'app.title': { yue: '卡冊 CardLab', zh: '卡冊 CardLab', en: 'CardLab' },
    'app.tag': { yue: '影相出卡', zh: '影相出卡', en: 'Photo to cards' },
    'nav.home': { yue: '主頁', zh: '首頁', en: 'Home' },
    'nav.settings': { yue: '設定', zh: '設定', en: 'Settings' },
    'nav.back': { yue: '返回', zh: '返回', en: 'Back' },
    'home.due': { yue: '今日要練 {n} 張', zh: '今日要練 {n} 張', en: '{n} cards due today' },
    'home.photo': { yue: '📷 影相出卡', zh: '📷 影相出卡', en: '📷 Photo to cards' },
    'home.today': { yue: '今日任務', zh: '今日任務', en: "Today's mission" },
    'home.tricky': { yue: '易錯挑戰', zh: '易錯挑戰', en: 'Tricky cards' },
    'home.all': { yue: '全部卡', zh: '全部卡', en: 'All cards' },
    'home.resume': { yue: '繼續上次溫習（第 {n} 張）', zh: '繼續上次溫習（第 {n} 張）', en: 'Resume last session (card {n})' },
    'home.decks': { yue: '卡冊', zh: '卡冊', en: 'Decks' },
    // P3：卡冊按 AI 分類（科目＋範疇）分組＋篩選
    'decks.filterAll': { yue: '全部', zh: '全部', en: 'All' },
    'decks.filterLabel': { yue: '按分類篩選卡冊', zh: '按分類篩選卡冊', en: 'Filter decks by category' },
    'decks.other': { yue: '其他', zh: '未分類', en: 'Other' },
    'decks.category': { yue: '分類', zh: '分類', en: 'Category' },
    // P4：保留原文參考（A 卡組原文面板＋B 每卡相關原文節錄）
    'source.open': { yue: '📄 原文', zh: '📄 原文', en: '📄 Source text' },
    'source.title': { yue: '原文（OCR）', zh: '原文（OCR）', en: 'Source text (OCR)' },
    'source.local': { yue: '原文只係文字，同卡組一齊存喺呢部機；冇相片。', zh: '原文只是文字，與卡組一起存在這部機；沒有相片。', en: 'Source is text only, stored on this device with the deck — no photos.' },
    'practice.context': { yue: '📖 相關原文', zh: '📖 相關原文', en: '📖 Related source' },
    // P6：AI 整理原文（用戶撳先 call；原文照留，可切換）
    'source.clean': { yue: '✨ AI 整理原文', zh: '✨ AI 整理原文', en: '✨ Tidy up with AI' },
    'source.cleaning': { yue: '整理緊…', zh: '整理中…', en: 'Tidying…' },
    'source.cleanView': { yue: '睇整理後', zh: '看整理後', en: 'Cleaned' },
    'source.rawView': { yue: '睇原文', zh: '看原文', en: 'Original' },
    'source.cleanTitle': { yue: '原文（已整理）', zh: '原文（已整理）', en: 'Source text (tidied)' },
    'source.cleanDone': { yue: '已整理：刪走工作紙標題／指示，原文仍然保留。', zh: '已整理：刪走工作紙標題／指示，原文仍然保留。', en: 'Tidied: worksheet headings/instructions removed; the original is kept.' },
    'source.cleanFail': { yue: '整理失敗，原文冇改到。再試一次。', zh: '整理失敗，原文沒有改動。再試一次。', en: 'Tidy-up failed — original kept. Try again.' },
    'source.cleanShort': { yue: 'AI 刪得太多，為安全起見保留原文。', zh: 'AI 刪掉太多，為安全起見保留原文。', en: 'AI removed too much — original kept for safety.' },
    'home.empty': { yue: '仲未有卡。撳「影相出卡」開始。', zh: '還沒有卡。按「影相出卡」開始。', en: 'No cards yet. Tap "Photo to cards" to start.' },
    'home.paste': { yue: '貼上建卡', zh: '貼上建卡', en: 'Paste cards' },
    'home.import': { yue: '匯入', zh: '匯入', en: 'Import' },
    'home.export': { yue: '備份', zh: '備份', en: 'Backup' },
    'photo.title': { yue: '影相出卡', zh: '影相出卡', en: 'Photo to cards' },
    'photo.pick': { yue: '📷 揀相／影相', zh: '📷 選相／拍照', en: '📷 Choose / take photo' },
    'photo.camera': { yue: '📷 影相', zh: '📷 拍照', en: '📷 Take photo' },
    'photo.album': { yue: '🖼️ 由相簿揀', zh: '🖼️ 从相册选', en: '🖼️ From album' },
    'photo.tips': {
      yue: '光線充足、平放、影正、避反光；影之前可以遮住姓名／學號。',
      zh: '光線充足、平放、拍正、避反光；拍照前可以遮住姓名／學號。',
      en: 'Good light, flat page, straight on, avoid glare. Cover names/IDs before shooting.',
    },
    'photo.auto': {
      yue: 'AI 會自動判斷科目、年級、難度、知識分類。',
      zh: 'AI 會自動判斷科目、年級、難度、知識分類。',
      en: 'AI decides subject, grade, difficulty and knowledge categories.',
    },
    'photo.privacy': {
      yue: '🔒 撳「開始分析」先會送出呢張相：文字會經 DeepSeek OCR 同對話模型分析。OCR 檔案唔會存入 Files API，亦唔會交給對話模型；相片唔會存喺我哋伺服器，分析完即棄。認到嘅原文文字只會同卡組一齊存喺呢部機（冇相片）。',
      zh: '🔒 按「開始分析」才會送出這張相：文字會經 DeepSeek OCR 與對話模型分析。OCR 檔案不會存入 Files API，也不會交給對話模型；相片不會存在我們的伺服器，分析完即棄。認到的原文文字只會與卡組一起存在這部機（沒有相片）。',
      en: '🔒 Only after you tap Start will this photo be sent: text goes through DeepSeek OCR and the chat model. OCR files are not stored in the Files API nor passed to the chat model; photos are never stored on our server and are discarded after analysis. The OCR source text is kept on this device with the deck (text only, no photos).',
    },
    'photo.analyze': { yue: '開始 AI 分析', zh: '開始 AI 分析', en: 'Start AI analysis' },
    'photo.noKey': { yue: 'AI 未啟用：請喺設定頁入 DeepSeek API key（只存本機）。', zh: 'AI 未啟用：請在設定頁輸入 DeepSeek API key（只存本機）。', en: 'AI is not enabled: add a DeepSeek API key in Settings (stored locally only).' },
    'photo.toSettings': { yue: '去設定入 key', zh: '去設定輸入 key', en: 'Open settings' },
    'photo.compressed': { yue: '已壓縮 {size} · {w}×{h}', zh: '已壓縮 {size} · {w}×{h}', en: 'Compressed {size} · {w}×{h}' },
    'photo.chooseFirst': { yue: '先揀一張相', zh: '請先選一張相', en: 'Choose a photo first' },
    'photo.cap': { yue: '今日已用 {used}／{cap} 張', zh: '今日已用 {used}／{cap} 張', en: 'Used {used}/{cap} today' },
    // P2.0／P12：多張相合併成一個卡組（最多 8 張，每 3 張一批分析）
    'photo.multi': {
      yue: '同一課分開幾頁影？相簿可以一次揀最多 8 張，逐張 OCR 之後分批理解、合併成一個卡組。',
      zh: '同一課分開幾頁拍？相冊可以一次選最多 8 張，逐張 OCR 之後分批理解、合併成一個卡組。',
      en: 'Several pages of the same lesson? Pick up to 8 photos from the album — each is OCRed, analysed in batches, then merged into one deck.',
    },
    'photo.count': {
      yue: '已揀 {n}／{max} 張相',
      zh: '已選 {n}／{max} 張相',
      en: 'Selected {n}/{max} photos',
    },
    'photo.nth': { yue: '第 {n} 張', zh: '第 {n} 張', en: 'Photo {n}' },
    'photo.nthErr': { yue: '第 {n} 張相：', zh: '第 {n} 張相：', en: 'Photo {n}: ' },
    'photo.remove': { yue: '移除第 {n} 張相', zh: '移除第 {n} 張相', en: 'Remove photo {n}' },
    'photo.limit': {
      yue: '一次最多 {max} 張相：只加咗頭 {max} 張，其餘請分開分析。',
      zh: '一次最多 {max} 張相：只加了前 {max} 張，其餘請分開分析。',
      en: 'Up to {max} photos at a time — only the first {max} were added.',
    },
    'photo.room': {
      yue: '仲可以加 {n} 張（最多 {max} 張）',
      zh: '還能加 {n} 張（最多 {max} 張）',
      en: 'You can add {n} more (max {max})',
    },
    'photo.split': { yue: '第 {n} 張太大，已自動分半 OCR。', zh: '第 {n} 張太大，已自動分半 OCR。', en: 'Photo {n} was too long — split in half and OCRed.' },
    'err.ocr_empty': {
      yue: 'OCR 冇讀到任何字（已自動重試一次）。試下影近啲、光線好啲，或者分半拍。',
      zh: 'OCR 没有读到任何字（已自动重试一次）。请靠近一点、光线好一点，或分半拍。',
      en: 'OCR returned no text (one automatic retry already ran). Move closer, improve lighting, or split the page.',
    },
    'err.quota': { yue: '今日相片配額唔夠：今次要用 {n} 張，只剩 {left} 張。', zh: '今日相片配額不足：這次要用 {n} 張，只剩 {left} 張。', en: 'Not enough daily photos: this needs {n}, only {left} left.' },
  'analyze.fitQuota': { yue: '只分析頭 {left} 張', zh: '只分析前 {left} 张', en: 'Analyse first {left}' },
  'photo.quotaWarn': { yue: '今日只剩 {left} 張相配額，而家揀咗 {n} 張。', zh: '今日只剩 {left} 张照片配额，现在选了 {n} 张。', en: 'Only {left} photos left today, but {n} selected.' },
  'quota.gate': { yue: '今日已用 {used}／{cap} 張，今次 {n} 張會超出軟上限 {over} 張。照樣分析？', zh: '今日已用 {used}／{cap} 张，这次 {n} 张会超出软上限 {over} 张。照常分析？', en: 'Used {used}/{cap} today; {n} photos would exceed the soft cap by {over}. Analyse anyway?' },
  'quota.force': { yue: '照樣分析', zh: '照常分析', en: 'Analyse anyway' },
  'photo.quotaNone': { yue: '今日 {cap} 張配額已用完（已用 {used} 張）。聽日再試，或喺設定調高每日上限。', zh: '今日 {cap} 张配额已用完（已用 {used} 张）。明天再试，或在设置调高每日上限。', en: 'Daily cap of {cap} photos used up ({used} used). Try tomorrow or raise the cap in settings.' },
  'toast.quotaNone': { yue: '今日配額已用完', zh: '今日配额已用完', en: 'Daily photo quota used up' },
  'toast.capSaved': { yue: '每日上限已改為 {cap} 張', zh: '每日上限已改为 {cap} 张', en: 'Daily cap set to {cap}' },
    'preflight.title': { yue: '相片可能唔夠清楚（仍然可以試）：', zh: '相片可能不夠清楚（仍然可以試）：', en: 'The photo may be unclear (you can still try):' },
    'preflight.too_small': { yue: '解像度太低，影近啲或者用原相。', zh: '解像度太低，拍近一點或用原相。', en: 'Resolution is low — move closer or use the original photo.' },
    'preflight.blurry': { yue: '有啲矇，影多次。', zh: '有點模糊，再拍一次。', en: 'A bit blurry — take another shot.' },
    'preflight.glare': { yue: '有反光，試下移半步避開。', zh: '有反光，試著移半步避開。', en: 'There is glare — shift slightly to avoid it.' },
    'analyze.title': { yue: '分析中', zh: '分析中', en: 'Analysing' },
    'analyze.step.compress': { yue: '壓縮相片', zh: '壓縮相片', en: 'Compress photo' },
    'analyze.step.ocr': { yue: 'OCR 認字', zh: 'OCR 認字', en: 'OCR' },
    'analyze.step.understand': { yue: 'AI 理解', zh: 'AI 理解', en: 'AI understanding' },
    'analyze.step.cards': { yue: '整理成卡', zh: '整理成卡', en: 'Build cards' },
    'analyze.cancel': { yue: '取消', zh: '取消', en: 'Cancel' },
    'analyze.waiting': { yue: '等緊…', zh: '等待中…', en: 'Waiting…' },
    'analyze.done': { yue: '完成', zh: '完成', en: 'Done' },
    'analyze.failed': { yue: '失敗', zh: '失敗', en: 'Failed' },
    'analyze.fix': { yue: '補救方法', zh: '補救方法', en: 'What to do' },
    'analyze.retry': { yue: '再試一次', zh: '再試一次', en: 'Try again' },
    'analyze.rephoto': { yue: '重新影相', zh: '重新拍照', en: 'Retake photo' },
    // P12：多張相分批分析嘅進度
    'analyze.batch': {
      yue: '分批出卡：第 {i}／{n} 批（第 {from}–{to} 張相）',
      zh: '分批出卡：第 {i}／{n} 批（第 {from}–{to} 張相）',
      en: 'Building cards in batches: {i}/{n} (photos {from}–{to})',
    },
    'analyze.ocrAt': {
      yue: 'OCR：第 {i}／{n} 張相',
      zh: 'OCR：第 {i}／{n} 張相',
      en: 'OCR: photo {i}/{n}',
    },
    'understand.title': { yue: 'AI 理解 · 自動分類', zh: 'AI 理解 · 自動分類', en: 'AI understanding' },
    'understand.confidence': { yue: 'AI 判斷信心 {p}%', zh: 'AI 判斷信心 {p}%', en: 'AI confidence {p}%' },
    'understand.lowConfidence': { yue: 'AI 唔肯定年級，係咪 {grade}？', zh: 'AI 不確定年級，是不是 {grade}？', en: 'AI is unsure of the grade — is it {grade}?' },
    'understand.kps': { yue: '知識點 {n} 個', zh: '知識點 {n} 個', en: '{n} knowledge points' },
    'understand.taxonomy': { yue: '知識分類', zh: '知識分類', en: 'Categories' },
    'understand.mastery': { yue: '睇掌握地圖', zh: '看掌握地圖', en: 'View mastery map' },
    'understand.regen': { yue: '重新出卡', zh: '重新出卡', en: 'Regenerate cards' },
    'understand.cards': { yue: '出 {n} 張卡', zh: '出 {n} 張卡', en: 'Make {n} cards' },
    'understand.tooFew': { yue: 'AI 好似捉得太粗，可以加知識點。', zh: 'AI 好像抓得太粗，可以加知識點。', en: 'AI may be too coarse — consider adding knowledge points.' },
    'understand.tooMany': { yue: '知識點有啲多，可以合併。', zh: '知識點有點多，可以合併。', en: 'Quite a few knowledge points — consider merging.' },
    'understand.editKp': { yue: '保留嘅知識點（取消就唔出嗰個）', zh: '保留的知識點（取消就不出那個）', en: 'Keep these knowledge points' },
    'understand.stage': { yue: '學段', zh: '學段', en: 'Stage' },
    'stage.kindergarten': { yue: '幼稚園', zh: '幼稚園', en: 'Kindergarten' },
    'stage.primary': { yue: '小學', zh: '小學', en: 'Primary' },
    'stage.secondary': { yue: '中學', zh: '中學', en: 'Secondary' },
    'stage.university': { yue: '大學', zh: '大學', en: 'University' },
    'understand.grade': { yue: '年級', zh: '年級', en: 'Grade' },
    'understand.topic': { yue: '主題', zh: '主題', en: 'Topic' },
    'understand.kpEdit': { yue: '改', zh: '改', en: 'Edit' },
    'understand.kpName': { yue: '知識點名', zh: '知識點名', en: 'Knowledge point' },
    'understand.kpCat': { yue: '分類', zh: '分類', en: 'Category' },
    'understand.kpDiff': { yue: '難度', zh: '難度', en: 'Difficulty' },
    'understand.kpDelete': { yue: '刪除', zh: '刪除', en: 'Delete' },
    'understand.kpAdd': { yue: '＋ 新增知識點', zh: '＋ 新增知識點', en: '+ Add knowledge point' },
    'understand.kpNew': { yue: '新知識點（≤16 字）', zh: '新知識點（≤16 字）', en: 'New knowledge point (≤16 chars)' },
    'understand.nameEmpty': { yue: '名唔可以留空。', zh: '名稱不可以留空。', en: 'Name cannot be empty.' },
    'understand.saved': { yue: '已更新理解。', zh: '已更新理解。', en: 'Understanding updated.' },
    'analyze.skipped': { yue: '用快取', zh: '用快取', en: 'Cached' },
    'confirm.cached': {
      yue: '用返 24 小時內嘅分析結果（冇再 call OCR／AI，唔扣每日相片上限）。',
      zh: '沿用 24 小時內的分析結果（沒有再 call OCR／AI，不扣每日相片上限）。',
      en: 'Reusing the analysis from the last 24 hours (no OCR/AI call, no daily photo used).',
    },
    'confirm.trimmed': {
      yue: '合併時撞到上限：有 {kp} 個知識點、{cards} 張卡冇納入（其餘全部保留）。',
      zh: '合併時遇到上限：有 {kp} 個知識點、{cards} 張卡未納入（其餘全部保留）。',
      en: 'Merge hit the hard cap: {kp} knowledge points and {cards} cards were left out (everything else kept).',
    },
    'confirm.banner': {
      yue: 'AI 抽到 {n} 個知識點 · 睇地圖／改重點',
      zh: 'AI 抽到 {n} 個知識點 · 看地圖／改重點',
      en: 'AI found {n} knowledge points · view map / edit focus',
    },
    'confirm.title': { yue: '確認卡', zh: '確認卡', en: 'Confirm cards' },
    'confirm.add': { yue: '加入 {n} 張卡', zh: '加入 {n} 張卡', en: 'Add {n} cards' },
    'confirm.selectAll': { yue: '全選', zh: '全選', en: 'Select all' },
    'confirm.none': { yue: '全部取消', zh: '全部取消', en: 'Select none' },
    'confirm.uncertain': { yue: '唔肯定', zh: '不確定', en: 'Uncertain' },
    'confirm.edit': { yue: '改', zh: '改', en: 'Edit' },
    'confirm.save': { yue: '儲存', zh: '儲存', en: 'Save' },
    'confirm.editEmpty': { yue: '正面同背面都唔可以留空。', zh: '正面和背面都不可以留空。', en: 'Front and back cannot be empty.' },
    'common.cancel': { yue: '取消', zh: '取消', en: 'Cancel' },
    'confirm.noCards': { yue: '未有卡', zh: '未有卡', en: 'No cards yet' },
    'confirm.savedOnce': { yue: 'AI 唔會自動儲存，撳「加入」先會存。', zh: 'AI 不會自動儲存，按「加入」才會存。', en: 'AI never auto-saves; only Add stores them.' },
    'map.title': { yue: '掌握地圖', zh: '掌握地圖', en: 'Mastery map' },
    'map.outline': { yue: '大綱模式', zh: '大綱模式', en: 'Outline mode' },
    'map.map': { yue: '地圖模式', zh: '地圖模式', en: 'Map mode' },
    'map.gold': { yue: '熟練', zh: '熟練', en: 'Mastered' },
    'map.blue': { yue: '學習中', zh: '學習中', en: 'Learning' },
    'map.gray': { yue: '新', zh: '新', en: 'New' },
    'map.practiceKp': { yue: '練呢個知識點', zh: '練這個知識點', en: 'Practise this point' },
    'map.preview': { yue: '呢個係預覽，加入卡之後先練得到。', zh: '這是預覽，加入卡之後才練得到。', en: 'This is a preview — add cards to practise.' },
    'map.rootMeta': { yue: '{k} 個知識點 · {c} 張卡 · 熟練 {gold}/{total}', zh: '{k} 個知識點 · {c} 張卡 · 熟練 {gold}/{total}', en: '{k} knowledge points · {c} cards · mastered {gold}/{total}' },
    'deck.cards': { yue: '{n} 張卡', zh: '{n} 張卡', en: '{n} cards' },
    'deck.new': { yue: '新', zh: '新', en: 'New' },
    'deck.learning': { yue: '學習中', zh: '學習中', en: 'Learning' },
    'deck.mastered': { yue: '熟練', zh: '熟練', en: 'Mastered' },
    'deck.due': { yue: '今日到期 {n}', zh: '今日到期 {n}', en: '{n} due today' },
    'deck.practice': { yue: '開始練習', zh: '開始練習', en: 'Start practice' },
    'deck.print': { yue: '🖨 列印字卡', zh: '🖨 打印字卡', en: '🖨 Print cards' },
  'print.title': { yue: '列印字卡', zh: '打印字卡', en: 'Print cards' },
  'print.hint': { yue: '雙面（長邊翻）：正面問題、背面答案，最省紙；單面：答案印喺同一格右下，用手遮住就係自測。', zh: '双面（长边翻）：正面问题、背面答案，最省纸；单面：答案印在同一格右下，用手遮住就是自测。', en: 'Duplex: question front, answer back (most paper-efficient). Single: answer in the same cell, cover it with your hand.' },
  'print.what': { yue: '列印內容', zh: '打印内容', en: 'Content' },
  'print.what.cards': { yue: '字卡 {n}', zh: '卡片 {n}', en: 'Cards {n}' },
  'print.what.vocab': { yue: '詞語生字 {n}', zh: '词语生字 {n}', en: 'Vocabulary {n}' },
  'print.what.both': { yue: '兩樣都要', zh: '两样都要', en: 'Both' },
  'print.vocabTag': { yue: '詞語', zh: '词语', en: 'Vocab' },
  'print.exampleTag': { yue: '例：', zh: '例：', en: 'e.g. ' },
  'print.estBoth': { yue: '字卡 {cards} 張＋詞語 {vocab} 個 → {sheets} 張 A4（{mode}，共 {pages} 頁、每頁 {per} 格）', zh: '卡片 {cards} 张＋词语 {vocab} 个 → {sheets} 张 A4（{mode}，共 {pages} 页、每页 {per} 格）', en: '{cards} cards + {vocab} vocab → {sheets} A4 sheet(s), {mode}, {pages} page(s), {per}/page' },
  'print.size': { yue: '版面', zh: '版面', en: 'Layout' },
  'print.size.big': { yue: '大 85×55mm · 每頁 10', zh: '大 85×55mm · 每页 10', en: 'Large 85×55mm · 10/page' },
  'print.size.mid': { yue: '中 64×44mm · 每頁 18', zh: '中 64×44mm · 每页 18', en: 'Medium 64×44mm · 18/page' },
  'print.size.small': { yue: '小 48×40mm · 每頁 28', zh: '小 48×40mm · 每页 28', en: 'Small 48×40mm · 28/page' },
  'print.mode': { yue: '列印方式', zh: '打印方式', en: 'Sides' },
  'print.mode.duplex': { yue: '雙面（長邊翻）', zh: '双面（长边翻）', en: 'Duplex (long edge)' },
  'print.mode.single': { yue: '單面（答案同格）', zh: '单面（答案同格）', en: 'Single (answer inline)' },
  'print.scope': { yue: '範圍', zh: '范围', en: 'Range' },
  'print.scope.all': { yue: '全部 {n} 張', zh: '全部 {n} 张', en: 'All {n}' },
  'print.scope.unmastered': { yue: '只印未掌握', zh: '只打印未掌握', en: 'Unmastered only' },
  'print.est': { yue: '{n} 張卡 → {sheets} 張 A4（{mode}，共 {pages} 頁、每頁 {per} 張）', zh: '{n} 张卡 → {sheets} 张 A4（{mode}，共 {pages} 页、每页 {per} 张）', en: '{n} cards → {sheets} A4 sheet(s), {mode}, {pages} page(s), {per}/page' },
  'print.do': { yue: '🖨 列印', zh: '🖨 打印', en: '🖨 Print' },
  'print.back': { yue: '返回卡組', zh: '返回卡组', en: 'Back to deck' },
  'print.foot': { yue: '第 {i}／{n} 張紙', zh: '第 {i}／{n} 张纸', en: 'Sheet {i}/{n}' },
  'print.cutTip': { yue: '沿實線剪開；四邊留 10mm 白邊', zh: '沿实线剪开；四边留 10mm 白边', en: 'Cut along the lines; 10mm margin kept' },
  'print.noDeck': { yue: '搵唔到卡組。', zh: '找不到卡组。', en: 'Deck not found.' },
  'deck.map': { yue: '掌握地圖', zh: '掌握地圖', en: 'Mastery map' },
    'deck.week': { yue: '最近 7 日', zh: '最近 7 日', en: 'Last 7 days' },
    'deck.hardest': { yue: '最難 5 張', zh: '最難 5 張', en: 'Hardest 5' },
    'deck.delete': { yue: '刪除卡組', zh: '刪除卡組', en: 'Delete deck' },
    'deck.deleteConfirm': { yue: '確定刪除「{t}」？進度會一齊刪。', zh: '確定刪除「{t}」？進度會一齊刪。', en: 'Delete "{t}"? Its progress will be removed too.' },
    'practice.flip': { yue: '顯示答案', zh: '顯示答案', en: 'Show answer' },
    'practice.remember': { yue: '記得', zh: '記得', en: 'Remembered' },
    'practice.forget': { yue: '唔記得', zh: '不記得', en: "Didn't remember" },
    'practice.typing': { yue: '打答案', zh: '輸入答案', en: 'Type the answer' },
    'practice.submit': { yue: '提交', zh: '提交', en: 'Submit' },
    'practice.tooHard': { yue: '改為翻卡', zh: '改為翻卡', en: 'Switch to flip' },
    'practice.pickOne': { yue: '揀一個答案', zh: '選一個答案', en: 'Pick one answer' },
    'practice.speakFront': { yue: '🔊 讀題目', zh: '🔊 讀題目', en: '🔊 Read question' },
    'practice.speakBack': { yue: '🔊 讀答案', zh: '🔊 讀答案', en: '🔊 Read answer' },
    'practice.noSpeech': { yue: '呢部機未有語音；仍然可以繼續做。', zh: '這台裝置沒有語音；仍然可以繼續做。', en: 'No voice on this device — you can still continue.' },
    'settings.voice': { yue: '朗讀', zh: '朗讀', en: 'Read aloud' },
    'settings.autoRead': { yue: '每次出新題目自動讀出（用本機語音）', zh: '每次出新題目自動讀出（用本機語音）', en: 'Auto-read each new question (device voice)' },
    'practice.progress': { yue: '{i} / {n}', zh: '{i} / {n}', en: '{i} / {n}' },
    'practice.exit': { yue: '退出', zh: '退出', en: 'Exit' },
    'practice.exitConfirm': { yue: '退出會保留進度，下次可以繼續。', zh: '退出會保留進度，下次可以繼續。', en: 'Progress is kept — you can resume next time.' },
    'practice.right': { yue: '✓ 答對', zh: '✓ 答對', en: '✓ Correct' },
    'practice.wrong': { yue: '✗ 答錯，正解：', zh: '✗ 答錯，正解：', en: '✗ Wrong — answer:' },
    'practice.empty': { yue: '呢個卡組冇到期卡。', zh: '這個卡組沒有到期卡。', en: 'No cards due in this deck.' },
    'practice.continue': { yue: '繼續', zh: '繼續', en: 'Continue' },
    'done.title': { yue: '練完喇！', zh: '練完囉！', en: 'All done!' },
    'done.stats': { yue: '記得 {x}／{n}', zh: '記得 {x}／{n}', en: '{x}/{n} remembered' },
    'done.againWrong': { yue: '再練錯嘅 {n} 張', zh: '再練錯的 {n} 張', en: 'Practise {n} wrong ones' },
    'done.home': { yue: '返回主頁', zh: '返回首頁', en: 'Back home' },
    'done.wrongList': { yue: '答錯清單', zh: '答錯清單', en: 'Wrong answers' },
    'done.noneWrong': { yue: '全部記得，好嘢！', zh: '全部記得，好棒！', en: 'All remembered — great!' },
    'settings.title': { yue: '設定', zh: '設定', en: 'Settings' },
    'settings.key': { yue: 'DeepSeek API key（只存呢部機）', zh: 'DeepSeek API key（只存這部機）', en: 'DeepSeek API key (this device only)' },
    'settings.keyHint': { yue: 'key 只寫入本機 localStorage，唔會上傳。OCR 同對話模型共用同一條 key。', zh: 'key 只寫入本機 localStorage，不會上傳。OCR 與對話模型共用同一條 key。', en: 'The key is stored in local storage only. OCR and chat share the same key.' },
    'settings.save': { yue: '儲存', zh: '儲存', en: 'Save' },
    'settings.saved': { yue: '已儲存', zh: '已儲存', en: 'Saved' },
    'settings.ai': { yue: 'AI 供應商：DeepSeek · 模型 {m} · 每日上限 {cap} 張', zh: 'AI 供應商：DeepSeek · 模型 {m} · 每日上限 {cap} 張', en: 'Provider: DeepSeek · model {m} · daily cap {cap}' },
  'settings.capLabel': { yue: '每日相片軟上限（1–500 張）', zh: '每日照片软上限（1–500 张）', en: 'Daily photo soft cap (1–500)' },
  'settings.capHint': { yue: '軟上限：超出只會要你確認一次，唔會硬攔。每張相每次分析扣 1 張；快取命中唔扣。預設 60。', zh: '软上限：超出只会要你确认一次，不会硬拦。每张照片每次分析扣 1 张；缓存命中不扣。默认 60。', en: 'Soft cap: exceeding it just asks once, never blocks. Each photo costs 1 per analysis; cache hits are free. Default 60.' },
  'settings.capSave': { yue: '更新每日上限', zh: '更新每日上限', en: 'Save cap' },
    'settings.privacy': { yue: '相片只用一次：分析完即棄，唔入 localStorage／IndexedDB。卡組原文只有文字（冇相片），同卡組一齊存喺呢部機。練習頁完全離線。', zh: '相片只用一次：分析完即棄，不進 localStorage／IndexedDB。卡組原文只有文字（沒有相片），與卡組一起存在這部機。練習頁完全離線。', en: 'Photos are used once and discarded — never stored in localStorage/IndexedDB. Deck source text (text only, no photos) is kept on this device with the deck. Practice is fully offline.' },
    'settings.data': { yue: '資料', zh: '資料', en: 'Data' },
    'settings.clear': { yue: '清除全部資料', zh: '清除全部資料', en: 'Clear all data' },
    'settings.clearConfirm': { yue: '確定清除全部卡同進度？', zh: '確定清除全部卡和進度？', en: 'Clear all cards and progress?' },
    'settings.lang': { yue: '語言', zh: '語言', en: 'Language' },
    'paste.title': { yue: '貼上建卡', zh: '貼上建卡', en: 'Paste cards' },
    'paste.hint': { yue: '每行一張卡，用「正面 | 背面」格式。', zh: '每行一張卡，用「正面 | 背面」格式。', en: 'One card per line: "front | back".' },
    'paste.placeholder': { yue: '咩係反射？ | 光遇到物件表面折返', zh: '什麼是反射？ | 光遇到物件表面折返', en: "What is reflection? | Light bounces off a surface" },
    'paste.build': { yue: '建立卡組', zh: '建立卡組', en: 'Create deck' },
    'paste.none': { yue: '解析唔到任何卡，請用「正面 | 背面」。', zh: '解析不到任何卡，請用「正面 | 背面」。', en: 'No cards parsed — use "front | back".' },
    'paste.title2': { yue: '貼上卡組', zh: '貼上卡組', en: 'Pasted deck' },
    'paste.created': { yue: '已建立 {n} 張卡', zh: '已建立 {n} 張卡', en: 'Created {n} cards' },
    'import.title': { yue: '匯入備份', zh: '匯入備份', en: 'Import backup' },
    'import.done': { yue: '已匯入 {n} 個卡組', zh: '已匯入 {n} 個卡組', en: 'Imported {n} decks' },
    'import.bad': { yue: '檔案格式唔啱。', zh: '檔案格式不對。', en: 'That file is not a valid backup.' },
    'err.network': { yue: '連唔到網。檢查網絡再試。', zh: '連不上網。檢查網絡再試。', en: 'No connection. Check your network and retry.' },
    'err.auth': { yue: 'API key 唔啱或者過期。去設定頁更新。', zh: 'API key 不對或過期。到設定頁更新。', en: 'Bad or expired API key. Update it in Settings.' },
    'err.balance': { yue: '帳戶餘額不足。去 DeepSeek 平台增值。', zh: '帳戶餘額不足。到 DeepSeek 平台充值。', en: 'Insufficient balance. Top up on the DeepSeek platform.' },
    'err.upload': { yue: 'OCR 上傳失敗（408）。相片可能太大，試下再影。', zh: 'OCR 上傳失敗（408）。相片可能太大，試著再拍。', en: 'OCR upload failed (408). The photo may be too large — retake it.' },
    'err.too_large': { yue: '相片太大（413）。試下影近啲或者用低解像度。', zh: '相片太大（413）。試著拍近一點或用較低解像度。', en: 'Photo too large (413). Move closer or use a lower resolution.' },
    'err.rate': { yue: '請求太密（429）。等一分鐘再試。', zh: '請求太頻繁（429）。等一分鐘再試。', en: 'Too many requests (429). Wait a minute and retry.' },
    'err.server': { yue: 'AI 伺服器出錯（5xx）。等一陣再試。', zh: 'AI 伺服器出錯（5xx）。等一會再試。', en: 'AI server error (5xx). Try again shortly.' },
    'err.bad_request': { yue: 'AI 唔接受呢個請求（400）。檢查 key 同 model。', zh: 'AI 不接受這個請求（400）。檢查 key 和 model。', en: 'AI rejected the request (400). Check the key and model.' },
    'err.timeout': { yue: '超時。網絡慢或者相片太大，試下再影或者分半影。', zh: '逾時。網絡慢或相片太大，試著再拍或分半拍。', en: 'Timed out. Slow network or large photo — retake or split the page.' },
    'err.not_json': { yue: 'AI 回傳格式有問題（唔係 JSON）。再試一次。', zh: 'AI 回傳格式有問題（不是 JSON）。再試一次。', en: 'AI returned invalid format (not JSON). Try again.' },
    'err.diag': { yue: '技術詳情：', zh: '技术详情：', en: 'Details:' },
    'err.truncated_ai': { yue: 'AI 輸出用盡上限（截斷咗）。影半頁或者分開影，再試一次。', zh: 'AI 输出用尽上限（被截断）。拍半页或分开拍，再试一次。', en: 'AI hit the output limit and got cut off. Shoot half a page or split it.' },
    'err.bad_stage': { yue: 'AI 判斷嘅程度唔喺允許清單。', zh: 'AI 判斷的程度不在允許清單。', en: 'AI stage is not in the allowed list.' },
    'err.bad_grade': { yue: '年級同程度唔夾。', zh: '年級與程度不符。', en: 'Grade does not match stage.' },
    'err.bad_subject': { yue: 'AI 判斷嘅科目唔喺清單。', zh: 'AI 判斷的科目不在清單。', en: 'AI subject is not in the list.' },
    'err.bad_difficulty': { yue: '難度唔係 1–5 星。', zh: '難度不是 1–5 星。', en: 'Difficulty is not 1–5.' },
    'err.bad_confidence': { yue: '信心值唔係 0–1。', zh: '信心值不是 0–1。', en: 'Confidence is not 0–1.' },
    'err.bad_taxonomy_count': { yue: '知識分類唔係 3–6 個。', zh: '知識分類不是 3–6 個。', en: 'Taxonomy is not 3–6 categories.' },
    'err.bad_taxonomy_label': { yue: '知識分類名稱唔係 2–6 字。', zh: '知識分類名稱不是 2–6 字。', en: 'A category label is not 2–6 characters.' },
    'err.no_kp': { yue: 'AI 冇抽到知識點。', zh: 'AI 沒有抽出知識點。', en: 'AI found no knowledge points.' },
    'err.too_many_kp': { yue: '知識點太多。', zh: '知識點太多。', en: 'Too many knowledge points.' },
    'err.no_valid_kp': { yue: '知識點資料唔完整。', zh: '知識點資料不完整。', en: 'Knowledge point data is incomplete.' },
    'err.no_cards': { yue: 'AI 冇出卡。試下重新影或者分半影。', zh: 'AI 沒有出卡。試著重新拍或分半拍。', en: 'AI produced no cards. Retake or split the page.' },
    'err.too_many_cards': { yue: 'AI 出太多卡。', zh: 'AI 出太多卡。', en: 'Too many cards.' },
    'err.no_title': { yue: 'AI 冇主題名。', zh: 'AI 沒有主題名。', en: 'AI gave no topic title.' },
    'err.ai_not_study_material': { yue: '呢張唔似課本／筆記（AI 判斷）。影返課本頁。', zh: '這張不像課本／筆記（AI 判斷）。請拍課本頁。', en: 'This does not look like study material. Photograph a textbook page.' },
    'err.ai_low_legibility': { yue: '文字殘缺到 AI 睇唔明。影清楚啲或者分半影。', zh: '文字殘缺到 AI 看不明白。拍清楚一點或分半拍。', en: 'Text too incomplete for AI. Shoot closer or split the page.' },
    'err.unknown': { yue: '分析失敗，再試一次。', zh: '分析失敗，再試一次。', en: 'Analysis failed. Try again.' },
    'gate.too_few_chars': { yue: '睇唔清：呢頁少過 80 字（實際 {n} 字）。影近啲、影清楚啲，或者分半影。', zh: '看不清：這頁少於 80 字（實際 {n} 字）。拍近一點、清楚一點，或分半拍。', en: 'Too little text: fewer than 80 characters (got {n}). Move closer or split the page.' },
    'gate.truncated': { yue: 'OCR 被截斷（內容太長）。縮細範圍或者分兩張影。', zh: 'OCR 被截斷（內容太長）。縮小範圍或分兩張拍。', en: 'OCR was truncated. Narrow the area or split into two photos.' },
    'gate.garbage': { yue: '亂碼太多（{p}%）。影清楚啲、避反光，或者分半影。', zh: '亂碼太多（{p}%）。拍清楚一點、避反光，或分半拍。', en: 'Too much garbage text ({p}%). Shoot clearer, avoid glare, or split the page.' },
    'gate.no_text': { yue: 'OCR 認唔到任何字。影清楚啲或者換一張相。', zh: 'OCR 認不到任何字。拍清楚一點或換一張相。', en: 'OCR found no text. Shoot clearer or use another photo.' },
    'gate.fixTitle': { yue: '可以咁做：', zh: '可以這樣做：', en: 'Try this:' },
    'common.of': { yue: '/', zh: '/', en: '/' },
    'common.close': { yue: '關閉', zh: '關閉', en: 'Close' },
    'common.card': { yue: '卡', zh: '卡', en: 'cards' },
    'common.more': { yue: '更多', zh: '更多', en: 'More' },
    // P13：詞語生字卡（中文書面解釋＋應用範例＋朗讀）
    'vocab.title': { yue: '🔤 詞語生字（{n}）', zh: '🔤 词语生字（{n}）', en: '🔤 Vocabulary ({n})' },
    'vocab.read': { yue: '讀', zh: '读', en: 'Read' },
    'vocab.readEx': { yue: '讀範例', zh: '读范例', en: 'Read example' },
    'vocab.example': { yue: '範例：', zh: '范例：', en: 'Example: ' },
    'vocab.lang.zh': { yue: '中文', zh: '中文', en: 'Chinese' },
    'vocab.lang.en': { yue: '英文', zh: '英文', en: 'English' },
    // P14：詞語生字練習（英文聽寫／中文自評，獨立 SRS key space，唔會污染知識點卡進度）
    'vocab.practice': { yue: '🔤 練詞語（{n}）', zh: '🔤 练词语（{n}）', en: '🔤 Practise vocabulary ({n})' },
    'vocab.practiceTitle': { yue: '🔤 詞語練習', zh: '🔤 词语练习', en: '🔤 Vocabulary practice' },
    'vocab.progress': { yue: '詞語 {i}／{n} · 答對 {ok}', zh: '词语 {i}／{n} · 答对 {ok}', en: 'Word {i}/{n} · correct {ok}' },
    'vocab.enPrompt': { yue: '睇中文解釋，打返英文生字（可以撳 🔊 聽發音）', zh: '看中文解释，输入英文生字（可按 🔊 听发音）', en: 'Read the Chinese meaning, type the English word (tap 🔊 to listen).' },
    'vocab.zhPrompt': { yue: '呢個詞語點解？撳「睇解釋」自己對。', zh: '这个词语什么意思？按「看解释」自己核对。', en: 'What does this word mean? Tap Reveal to check yourself.' },
    'vocab.listen': { yue: '🔊 聽發音', zh: '🔊 听发音', en: '🔊 Listen' },
    'vocab.inputLabel': { yue: '英文生字', zh: '英文生字', en: 'English word' },
    'vocab.check': { yue: '對答案', zh: '对答案', en: 'Check' },
    'vocab.giveup': { yue: '睇答案', zh: '看答案', en: 'Show answer' },
    'vocab.reveal': { yue: '睇解釋', zh: '看解释', en: 'Reveal' },
    'vocab.correct': { yue: '✓ 答對', zh: '✓ 答对', en: '✓ Correct' },
    'vocab.wrong': { yue: '✗ 正確答案：{w}', zh: '✗ 正确答案：{w}', en: '✗ Answer: {w}' },
    'vocab.remember': { yue: '記得', zh: '记得', en: 'Got it' },
    'vocab.forget': { yue: '唔記得', zh: '不记得', en: 'Not yet' },
    'vocab.next': { yue: '下一題', zh: '下一题', en: 'Next' },
    'vocab.finish': { yue: '完成', zh: '完成', en: 'Finish' },
    'vocab.done': { yue: '詞語練習完成：答對 {ok}／{n}', zh: '词语练习完成：答对 {ok}／{n}', en: 'Vocabulary practice done: {ok}/{n} correct' },
    'vocab.again': { yue: '再練一次', zh: '再练一次', en: 'Practise again' },
    'vocab.backDeck': { yue: '返卡組', zh: '回卡组', en: 'Back to deck' },
    'vocab.answer': { yue: '解釋：', zh: '解释：', en: 'Meaning: ' },
    'vocab.none': { yue: '呢個卡組仲未有詞語生字。', zh: '这个卡组还没有词语生字。', en: 'This deck has no vocabulary yet.' },
    'toast.noDeck': { yue: '先加入卡組。', zh: '請先加入卡組。', en: 'Add a deck first.' },
    'toast.notEnabled': { yue: 'AI 未啟用。', zh: 'AI 未啟用。', en: 'AI is not enabled.' },
    'toast.imageDecode': { yue: '讀唔到呢張相，試下另一張。', zh: '讀不到這張相，試另一張。', en: 'Could not read that photo — try another.' },
    'toast.exportFailed': { yue: '匯出失敗，試下再撳。', zh: '匯出失敗，再試一次。', en: 'Export failed — try again.' },
  };

  function t(key, vars) {
    var entry = DICT[key];
    var lang = state.lang || 'zh';
    var s = entry ? (entry[lang] || entry.zh || entry.yue || key) : key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  // ─────────────────────────── 小工具 ───────────────────────────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function bytesLabel(n) {
    if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
    return Math.max(1, Math.round(n / 1024)) + ' KB';
  }
  function stars(n) {
    var v = Math.max(1, Math.min(5, Number(n) || 1));
    return '★★★★★'.slice(0, v) + '☆☆☆☆☆'.slice(0, 5 - v);
  }
  function stateLabel(s) {
    if (s === 'gold') return t('map.gold');
    if (s === 'blue') return t('map.blue');
    return t('map.gray');
  }
  function allCards(db) {
    var out = [];
    db.decks.forEach(function (d) { (d.cards || []).forEach(function (c) { out.push(c); }); });
    return out;
  }
  function seedRandom() {
    // 可重現（測試用 CardLab.__seed）；否則用時間
    if (typeof state.seed === 'number') {
      state.rng = (state.rng * 1103515245 + 12345) & 0x7fffffff;
      return (state.rng % 10000) / 10000;
    }
    return Math.random();
  }

  // ─────────────────────────── state ───────────────────────────
  var state = {
    db: null,
    lang: 'zh',
    route: { name: 'home', id: null },
    photo: null, // {blob,width,height,bytes,url}：state.photos[0] 嘅鏡像（單張流程向後兼容）
    photos: [], // P2.0／P12：多張相（1–8 張），每張 {blob,width,height,bytes,url,preflight}
    ocr: null, // {pages,text,gate}
    analysis: null, // validated value
    confirm: {},
    session: null,
    toast: '',
    error: null,
    analyze: { step: 'idle', steps: { compress: 'idle', ocr: 'idle', understand: 'idle', cards: 'idle' }, batch: null, photoAt: null },
    vsession: null,
    abort: null,
    nowFn: null,
    seed: null,
    rng: 123456789,
    mapPreviewDeckId: null,
    outline: false,
    editCardId: null,
    // P1.1：理解頁編輯（知識點改／刪／新增）
    editKpId: null,
    newKp: false,
    preflight: null,
    // P19：超出每日軟上限時嘅一次性確認狀態 {n, used, cap, over}
    quotaGate: null,
    // P20：列印字卡設定（版面／雙面或單面／範圍）
    print: { size: 'mid', mode: 'duplex', scope: 'all', set: 'cards' },
    // P2.0：理解頁知識點勾選狀態（唔好再靠 DOM checked attribute，遲到嘅重畫會冪走家長嘅勾選）
    kpPick: {},
    // P3：卡冊分類篩選（'' = 全部）
    deckFilter: '',
    // P4：原文面板開關（卡組頁／練習頁共用，每次換頁重設）
    sourceOpen: false,
    // P6：原文「AI 整理」狀態（busy＝有 call 進行中；view＝auto（有整理版就顯示整理版）／raw／clean）
    sourceBusy: false,
    sourceView: 'auto',
  };

  function now() {
    return state.nowFn ? state.nowFn() : Date.now();
  }

  function toast(msg) {
    state.toast = msg;
    render();
    setTimeout(function () {
      if (state.toast === msg) { state.toast = ''; render(); }
    }, 2200);
  }

  // ─────────────────────────── 主頁 ───────────────────────────
  /** 分類顯示名：AI 嘅 fallback「其他」用「未分類」講清楚（三語）。 */
  function catLabel(cat) {
    return cat === Ai.OTHER ? t('decks.other') : cat;
  }

  function viewHome() {
    var db = state.db;
    var due = todayEntries(db).length;
    var tricky = trickyEntries();
    var total = allCards(db).length;
    var draft = S.loadDraft(now());
    var html = '';
    html += '<section class="hero">';
    html += '<p class="hero__kicker">' + esc(t('app.tag')) + '</p>';
    html += '<h1 class="hero__count" id="home-hero-count">' + esc(t('home.due', { n: due })) + '</h1>';
    html += '<button type="button" class="btn btn--primary btn--xl" id="btn-photo" data-act="photo">' + esc(t('home.photo')) + '</button>';
    if (draft) {
      var entryOk = (draft.entries || []).some(function (e) { return !!entryCard(e); });
      if (entryOk) {
        html += '<button type="button" class="btn btn--resume" id="btn-resume" data-act="resume">' + esc(t('home.resume', { n: draft.index + 1 })) + '</button>';
      }
    }
    html += '<div class="kids" id="kid-entries">';
    html += '<button type="button" class="kid" data-act="today"><span aria-hidden="true">🎯</span><strong>' + esc(t('home.today')) + '</strong><small>' + due + '</small></button>';
    if (tricky.length >= 3) {
      html += '<button type="button" class="kid" data-act="tricky"><span aria-hidden="true">🔥</span><strong>' + esc(t('home.tricky')) + '</strong><small>' + tricky.length + '</small></button>';
    }
    html += '<button type="button" class="kid" data-act="all"><span aria-hidden="true">🗂️</span><strong>' + esc(t('home.all')) + '</strong><small>' + total + '</small></button>';
    html += '</div></section>';

    html += '<section class="section" id="deck-list"><h2 class="section__title">' + esc(t('home.decks')) + '</h2>';
    var groups = Ai.groupDecks(db.decks);
    // 篩選咗嘅分類冇晒（例如刪咗最後一個卡組）→ 自動回復「全部」，唔會空白一片。
    var filterOk = state.deckFilter && groups.some(function (g) { return g.category === state.deckFilter; });
    if (!filterOk) state.deckFilter = '';
    if (!db.decks.length) {
      html += '<p class="empty" id="deck-empty">' + esc(t('home.empty')) + '</p>';
    } else {
      html += '<div class="deck-filter" id="deck-filter" role="group" aria-label="' + esc(t('decks.filterLabel')) + '">';
      html += '<button type="button" class="chip' + (state.deckFilter ? '' : ' chip--on') + '" data-act="deck-filter" data-cat="" aria-pressed="' + (state.deckFilter ? 'false' : 'true') + '">' + esc(t('decks.filterAll')) + '</button>';
      groups.forEach(function (g) {
        var on = g.category === state.deckFilter;
        html += '<button type="button" class="chip' + (on ? ' chip--on' : '') + '" data-act="deck-filter" data-cat="' + esc(g.category) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(catLabel(g.category)) + '<span class="chip__n">' + g.decks.length + '</span></button>';
      });
      html += '</div>';
      groups.forEach(function (g) {
        if (state.deckFilter && g.category !== state.deckFilter) return;
        html += '<div class="deck-group" data-cat="' + esc(g.category) + '">';
        html += '<h3 class="deck-group__title">' + esc(catLabel(g.category)) + '</h3>';
        html += '<ul class="decks">';
        g.decks.forEach(function (d) {
          var stats = M.deckStats(d, now(), db.srs);
          html += '<li><button type="button" class="deck" data-act="deck" data-id="' + esc(d.id) + '">';
          html += '<span class="deck__title">' + esc(d.title) + '</span>';
          html += '<span class="deck__meta"><span class="deck__cat">' + esc(catLabel(Ai.deckCategory(d))) + '</span> · ' + esc((d.classification && d.classification.gradeLabel) || '') + ' · ' + esc(t('deck.cards', { n: stats.total })) + '</span>';
          html += '<span class="deck__due">' + esc(t('deck.due', { n: stats.dueToday })) + '</span>';
          html += '</button></li>';
        });
        html += '</ul></div>';
      });
    }
    html += '</section>';

    html += '<section class="section section--tools"><h2 class="section__title">' + esc(t('common.more')) + '</h2><div class="toolbar">';
    html += '<button type="button" class="btn btn--ghost" data-act="paste">' + esc(t('home.paste')) + '</button>';
    html += '<button type="button" class="btn btn--ghost" data-act="import">' + esc(t('home.import')) + '</button>';
    html += '<button type="button" class="btn btn--ghost" data-act="export">' + esc(t('home.export')) + '</button>';
    html += '</div></section>';
    return html;
  }

  // ─────────────────────────── 影相 ───────────────────────────
  /** 頁面上所有已揀相片（舊流程只有 state.photo → 當一張）。 */
  function photoList() {
    if (state.photos && state.photos.length) return state.photos;
    return state.photo ? [state.photo] : [];
  }

  function viewPhoto() {
    var ai = state.db.settings.ai;
    var hasKey = !!String(ai.key || '').trim();
    var cap = S.photoCap(state.db, now());
    var photos = photoList();
    var max = Ai.MAX_PHOTOS;
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(t('photo.title')) + '</h1>';
    html += '<p class="hint">' + esc(t('photo.tips')) + '</p>';
    html += '<p class="hint hint--soft">' + esc(t('photo.auto')) + '</p>';
    html += '<p class="hint hint--soft" id="photo-multi">' + esc(t('photo.multi')) + '</p>';
    // 兩個明確入口：影相（capture=environment，單張）／相簿（冇 capture＋multiple，最多 8 張）。
    html += '<div class="picker">';
    html += '<input id="file-input" class="sr-only" type="file" accept="image/*" capture="environment" />';
    html += '<label class="btn btn--pick" for="file-input" id="btn-pick-camera">' + esc(t('photo.camera')) + '</label>';
    html += '<input id="file-input-album" class="sr-only" type="file" accept="image/*" multiple />';
    html += '<label class="btn btn--pick btn--pick--album" for="file-input-album" id="btn-pick-album">' + esc(t('photo.album')) + '</label>';
    html += '</div>';
    html += '<div id="photo-slot">';
    if (photos.length) {
      html += '<ol class="thumbs" id="photo-thumbs">';
      photos.forEach(function (p, i) {
        html += '<li class="thumb-x" data-index="' + i + '">';
        if (i === 0) html += '<img id="photo-preview" class="thumb-x__img" alt="preview" src="' + esc(p.url) + '" />';
        else html += '<img class="thumb-x__img" alt="preview" src="' + esc(p.url) + '" />';
        html += '<span class="thumb-x__n" id="thumb-n-' + i + '">' + esc(t('photo.nth', { n: i + 1 })) + '</span>';
        html += '<button type="button" class="thumb-x__rm" data-act="remove-photo" data-index="' + i + '" aria-label="' + esc(t('photo.remove', { n: i + 1 })) + '">✕</button>';
        html += '</li>';
      });
      html += '</ol>';
    }
    html += '</div>';
    if (photos.length) {
      var first = photos[0];
      var sumBytes = 0;
      photos.forEach(function (p) { sumBytes += Number(p.bytes) || 0; });
      html += '<p class="hint" id="photo-size">' + esc(t('photo.compressed', { size: bytesLabel(sumBytes), w: first.width, h: first.height }));
      if (photos.length > 1) html += ' · ' + esc(t('photo.count', { n: photos.length, max: max }));
      html += '</p>';
      if (photos.length < max) html += '<p class="hint hint--soft" id="photo-room">' + esc(t('photo.room', { n: max - photos.length, max: max })) + '</p>';
    }
    var warns = [];
    photos.forEach(function (p, i) {
      if (p.preflight && !p.preflight.ok) warns.push({ n: i + 1, issues: p.preflight.issues });
    });
    if (warns.length) {
      html += '<div class="notice notice--warn" id="preflight-warn"><strong>' + esc(t('preflight.title')) + '</strong>';
      warns.forEach(function (w) {
        html += '<ul class="fixlist">';
        if (photos.length > 1) html += '<li class="fixlist__n">' + esc(t('photo.nth', { n: w.n })) + '</li>';
        w.issues.forEach(function (code) {
          html += '<li>' + esc(t('preflight.' + code)) + '</li>';
        });
        html += '</ul>';
      });
      html += '</div>';
    }
    html += '<p class="privacy" id="privacy">' + esc(t('photo.privacy')) + '</p>';
    if (!hasKey) {
      html += '<div class="notice notice--warn" id="ai-disabled">' + esc(t('photo.noKey')) + ' ';
      html += '<button type="button" class="linkbtn" data-act="settings">' + esc(t('photo.toSettings')) + '</button></div>';
    }
    // P18：揀多過今日剩餘配額 → 事前講清楚，並提供「只分析頭 N 張」（唔好等到撳完先報錯）
    if (photos.length > cap.remaining) {
      html += '<div class="notice notice--warn" id="quota-warn">';
      html += esc(t(cap.remaining > 0 ? 'photo.quotaWarn' : 'photo.quotaNone', { left: cap.remaining, n: photos.length, used: cap.used, cap: cap.cap })) + ' ';
      if (cap.remaining > 0) {
        html += '<button type="button" class="linkbtn" data-act="analyze-first">' + esc(t('analyze.fitQuota', { left: cap.remaining })) + '</button> ';
      }
      html += '<button type="button" class="linkbtn" data-act="analyze-force">' + esc(t('quota.force')) + '</button>';
      html += '</div>';
    }
    html += '<button type="button" class="btn btn--primary btn--wide" id="btn-analyze" data-act="analyze"';
    if (!photos.length || !hasKey) html += ' disabled';
    html += '>' + esc(hasKey ? t('photo.analyze') : 'AI 未啟用') + '</button>';
    html += '<p class="hint hint--soft" id="photo-cap">' + esc(t('photo.cap', { used: cap.used, cap: cap.cap })) + '</p>';
    html += '</section>';
    return html;
  }

  // ─────────────────────────── 分析中 ───────────────────────────
  function stepRow(key, label) {
    var st = state.analyze.steps[key] || 'idle';
    var mark = st === 'done' ? '✓' : st === 'error' ? '✗' : st === 'active' ? '…' : st === 'skipped' ? '–' : '○';
    var stateText = st === 'done' ? t('analyze.done') : st === 'error' ? t('analyze.failed') : st === 'active' ? t('analyze.waiting') : st === 'skipped' ? t('analyze.skipped') : '';
    return '<li class="step" data-step="' + esc(key) + '" data-state="' + esc(st) + '"><span class="step__mark" aria-hidden="true">' + mark + '</span><span class="step__label">' + esc(label) + '</span><span class="step__state">' + esc(stateText) + '</span></li>';
  }

  function viewAnalyze() {
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(t('analyze.title')) + '</h1>';
    if (photoList().length) {
      html += '<figure class="thumb" id="analyze-thumbs">';
      photoList().forEach(function (p) {
        html += '<img alt="preview" src="' + esc(p.url) + '" />';
      });
      html += '</figure>';
    }
    html += '<ol class="steps" id="analyze-steps">';
    html += stepRow('compress', t('analyze.step.compress'));
    html += stepRow('ocr', t('analyze.step.ocr'));
    html += stepRow('understand', t('analyze.step.understand'));
    html += stepRow('cards', t('analyze.step.cards'));
    html += '</ol>';
    // P19：超出軟上限 → 一次確認（照樣分析／只分析頭 N 張／返回）
    if (state.quotaGate) {
      var qg = state.quotaGate;
      html += '<div class="notice notice--warn" id="quota-gate">' + esc(t('quota.gate', { n: qg.n, used: qg.used, cap: qg.cap, over: qg.over })) + '</div>';
      html += '<div class="toolbar">';
      html += '<button type="button" class="btn btn--primary" id="btn-analyze-force" data-act="analyze-force">' + esc(t('quota.force')) + '</button>';
      if (qg.cap - qg.used > 0) {
        html += '<button type="button" class="btn btn--ghost" id="btn-analyze-first" data-act="analyze-first">';
        html += esc(t('analyze.fitQuota', { left: qg.cap - qg.used })) + '</button>';
      }
      html += '<button type="button" class="btn btn--ghost" data-act="photo">' + esc(t('nav.back')) + '</button>';
      html += '</div>';
    }
    // P12.2：OCR 逐張進度；之後逐批「只出卡」嘅進度分開顯示
    if (state.analyze.photoAt) {
      html += '<p class="hint" id="analyze-photo-at">' + esc(t('analyze.ocrAt', state.analyze.photoAt)) + '</p>';
    }
    if (state.analyze.batch && Number(state.analyze.batch.n) > 1) {
      html += '<p class="hint" id="analyze-batch">' + esc(t('analyze.batch', state.analyze.batch)) + '</p>';
    }
    if (state.error) {
      var code = state.error.code || 'unknown';
      var key = 'err.' + code;
      if (!DICT[key]) key = DICT[code] ? code : 'err.unknown';
      var errMsg = t(key, state.error.vars || {});
      // P2.0：多張相時錯誤要指出第幾張相（單張唔加前綴，維持原本文案）。
      if (state.error.vars && state.error.vars.photo && Number(state.error.vars.total) > 1) {
        errMsg = t('photo.nthErr', { n: state.error.vars.photo }) + errMsg;
      }
      html += '<div class="notice notice--error" id="analyze-error">' + esc(errMsg) + '</div>';
      if (state.error.diag) {
        // 真機診斷：finish_reason／字數／reasoning 長度／回覆開頭，幫手判斷係截斷定格式錯。
        html += '<p class="hint hint--soft" id="ai-diag">' + esc(t('err.diag')) + ' ' + esc(state.error.diag) + '</p>';
      }
      if (state.error.gate) {
        html += '<p class="hint">' + esc(t('gate.fixTitle')) + '</p>';
        html += '<ul class="fixlist">';
        html += '<li>' + esc(t('analyze.rephoto')) + '</li>';
        if (state.error.gate === 'too_few_chars' || state.error.gate === 'truncated') {
          html += '<li>' + esc(t('gate.truncated')) + '</li>';
        }
        html += '</ul>';
      }
      html += '<div class="toolbar">';
      html += '<button type="button" class="btn btn--primary" data-act="photo">' + esc(t('analyze.rephoto')) + '</button>';
      html += '<button type="button" class="btn btn--ghost" data-act="retry">' + esc(t('analyze.retry')) + '</button>';
      html += '</div>';
    } else {
      html += '<button type="button" class="btn btn--ghost btn--wide" id="btn-cancel" data-act="cancel">' + esc(t('analyze.cancel')) + '</button>';
    }
    html += '</section>';
    return html;
  }

  // ─────────────────────────── 理解頁 ───────────────────────────
  function analysisDeckLike() {
    var a = state.analysis;
    if (!a) return null;
    return {
      title: a.topic.title,
      classification: a.classification,
      topic: a.topic,
      knowledgePoints: a.knowledgePoints,
      cards: a.cards,
      srs: state.db.srs,
    };
  }

  // ── P1.1 理解頁編輯小工具 ──
  function stageLabel(stage) {
    var key = 'stage.' + stage;
    return DICT[key] ? t(key) : stage;
  }

  function catOptions(taxonomy, selected) {
    var out = '';
    (taxonomy || []).forEach(function (cat) {
      out += '<option value="' + esc(cat) + '"' + (cat === selected ? ' selected' : '') + '>' + esc(cat) + '</option>';
    });
    return out;
  }

  function diffOptions(selected) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<option value="' + i + '"' + (Number(selected) === i ? ' selected' : '') + '>' + esc(stars(i)) + '</option>';
    }
    return out;
  }

  /** 家長改過理解（年級／主題／知識點）→ classification.edited = true（設計 §6）。 */
  function markEdited() {
    if (state.analysis && state.analysis.classification) state.analysis.classification.edited = true;
  }

  function viewUnderstand() {
    var a = state.analysis;
    if (!a) return '<p class="empty">' + esc(t('home.empty')) + '</p>';
    var c = a.classification;
    if (!Array.isArray(c.taxonomy) || !c.taxonomy.length) c.taxonomy = ['定義', '應用'];
    var stage = Ai.stageForGrade(c.grade) || c.stage || 'primary';
    var grades = Ai.gradesForStage(stage);
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(t('understand.title')) + '</h1>';
    if (a.cached) html += '<div class="notice notice--ok" id="u-cached">' + esc(t('confirm.cached')) + '</div>';
    html += '<h2 class="topic" id="u-title">' + esc(a.topic.title) + '</h2>';
    html += '<p class="meta" id="u-grade">' + esc(c.subjectLabel || c.subject) + ' · ' + esc(c.gradeLabel || Ai.gradeLabelOf(c.grade)) + ' · <span id="u-stars" class="stars" aria-label="difficulty">' + esc(stars(c.difficulty)) + '</span></p>';
    html += '<p class="meta meta--soft" id="u-confidence">' + esc(t('understand.confidence', { p: Math.round((c.confidence || 0) * 100) })) + '</p>';
    if (Number(c.confidence) < 0.5) {
      html += '<div class="notice notice--warn" id="u-lowconf">' + esc(t('understand.lowConfidence', { grade: c.gradeLabel || Ai.gradeLabelOf(c.grade) })) + '</div>';
    }
    html += '<p class="summary" id="u-summary">' + esc(a.topic.summary || '') + '</p>';
    // P3：卡冊分類（科目＋範疇）——AI 冇回／超長就 fallback 科目 label
    html += '<p class="meta" id="u-category" aria-label="' + esc(t('decks.category')) + '"><span class="chip chip--static">' + esc(catLabel(Ai.categoryOf(a.topic, c))) + '</span></p>';

    // P1.1：主題／年級可改（改咗標 classification.edited = true）
    html += '<div class="uedit" id="u-edit">';
    html += '<div class="urow"><label class="urow__lab" for="u-title-input">' + esc(t('understand.topic')) + '</label>';
    html += '<input id="u-title-input" class="input" type="text" maxlength="60" value="' + esc(a.topic.title) + '" aria-label="' + esc(t('understand.topic')) + '" />';
    html += '<button type="button" class="btn btn--tiny" id="btn-save-title" data-act="save-title">' + esc(t('confirm.save')) + '</button></div>';
    html += '<div class="uclass">';
    html += '<label class="uclass__row"><span>' + esc(t('understand.stage')) + '</span><select id="u-stage" class="input">';
    Object.keys(Ai.STAGES).forEach(function (st) {
      html += '<option value="' + esc(st) + '"' + (st === stage ? ' selected' : '') + '>' + esc(stageLabel(st)) + '</option>';
    });
    html += '</select></label>';
    html += '<label class="uclass__row"><span>' + esc(t('understand.grade')) + '</span><select id="u-grade-sel" class="input">';
    grades.forEach(function (g) {
      html += '<option value="' + esc(g) + '"' + (g === c.grade ? ' selected' : '') + '>' + esc(Ai.gradeLabelOf(g)) + '</option>';
    });
    html += '</select></label>';
    html += '</div></div>';

    if (a.knowledgePoints.length < 4) html += '<p class="hint hint--warn">' + esc(t('understand.tooFew')) + '</p>';
    // P12.1：多頁分批之後知識點自然多過 8；門檻按批數放大，唔好把正常結果當錯誤
    var kpHintMax = Ai.MAX_KP;
    if (a.knowledgePoints.length > kpHintMax) html += '<p class="hint hint--warn">' + esc(t('understand.tooMany')) + '</p>';

    html += '<h3 class="sub">' + esc(t('understand.kps', { n: a.knowledgePoints.length })) + '</h3>';
    html += '<p class="hint hint--soft">' + esc(t('understand.editKp')) + '</p>';
    html += '<ul class="kps" id="u-kps">';
    a.knowledgePoints.forEach(function (kp) {
      var n = a.cards.filter(function (x) { return x.kpId === kp.id; }).length;
      var editing = state.editKpId === kp.id;
      html += '<li class="kp' + (editing ? ' kp--editing' : '') + '" data-kp="' + esc(kp.id) + '">';
      html += '<label class="kp__pick"><input type="checkbox" class="kp-check" data-kp="' + esc(kp.id) + '"' + (state.kpPick[kp.id] !== false ? ' checked' : '') + ' />' +
        '<span class="kp__label">' + esc(kp.label) + '</span><span class="kp__n">' + n + '</span></label>';
      html += '<button type="button" class="btn btn--tiny kp__edit" data-act="edit-kp" data-kp="' + esc(kp.id) + '">' + esc(t('understand.kpEdit')) + '</button>';
      if (editing) {
        html += '<div class="kpform" id="kp-form">';
        html += '<input id="kp-label-input" class="input" type="text" maxlength="16" value="' + esc(kp.label) + '" aria-label="' + esc(t('understand.kpName')) + '" />';
        html += '<label class="kpform__row"><span>' + esc(t('understand.kpCat')) + '</span><select id="kp-cat-select" class="input">' + catOptions(c.taxonomy, kp.category) + '</select></label>';
        html += '<label class="kpform__row"><span>' + esc(t('understand.kpDiff')) + '</span><select id="kp-diff-select" class="input">' + diffOptions(kp.difficulty) + '</select></label>';
        html += '<div class="toolbar toolbar--tight">';
        html += '<button type="button" class="btn btn--primary btn--tiny" data-act="save-kp" data-kp="' + esc(kp.id) + '">' + esc(t('confirm.save')) + '</button>';
        html += '<button type="button" class="btn btn--danger btn--tiny" data-act="delete-kp" data-kp="' + esc(kp.id) + '">' + esc(t('understand.kpDelete')) + '</button>';
        html += '<button type="button" class="btn btn--ghost btn--tiny" data-act="cancel-kp">' + esc(t('common.cancel')) + '</button>';
        html += '</div></div>';
      }
      html += '</li>';
    });
    html += '</ul>';
    if (state.newKp) {
      html += '<div class="kpform kpform--new" id="newkp-form">';
      html += '<input id="newkp-label-input" class="input" type="text" maxlength="16" placeholder="' + esc(t('understand.kpNew')) + '" aria-label="' + esc(t('understand.kpName')) + '" />';
      html += '<label class="kpform__row"><span>' + esc(t('understand.kpCat')) + '</span><select id="newkp-cat-select" class="input">' + catOptions(c.taxonomy, c.taxonomy[0]) + '</select></label>';
      html += '<label class="kpform__row"><span>' + esc(t('understand.kpDiff')) + '</span><select id="newkp-diff-select" class="input">' + diffOptions(2) + '</select></label>';
      html += '<div class="toolbar toolbar--tight">';
      html += '<button type="button" class="btn btn--primary btn--tiny" data-act="save-new-kp" id="btn-save-new-kp">' + esc(t('understand.kpAdd')) + '</button>';
      html += '<button type="button" class="btn btn--ghost btn--tiny" data-act="cancel-new-kp">' + esc(t('common.cancel')) + '</button>';
      html += '</div></div>';
    } else {
      html += '<button type="button" class="btn btn--ghost" id="btn-add-kp" data-act="add-kp">' + esc(t('understand.kpAdd')) + '</button>';
    }

    html += '<h3 class="sub">' + esc(t('understand.taxonomy')) + '</h3>';
    html += '<ul class="tax" id="u-tax">';
    a.classification.taxonomy.forEach(function (cat) {
      var n = a.cards.filter(function (x) { return x.category === cat; }).length;
      if (!n) return;
      html += '<li class="tax__row"><span class="tax__name">' + esc(cat) + '</span><span class="tax__n">' + n + '</span></li>';
    });
    html += '</ul>';
    html += '<div class="toolbar">';
    html += '<button type="button" class="btn btn--ghost" data-act="preview-map">' + esc(t('understand.mastery')) + '</button>';
    html += '<button type="button" class="btn btn--primary" data-act="regen" id="btn-regen">' + esc(t('understand.regen')) + '</button>';
    html += '</div>';
    html += '<div class="toolbar"><button type="button" class="btn btn--primary btn--wide" data-act="confirm" id="btn-to-confirm">' + esc(t('understand.cards', { n: a.cards.length })) + '</button></div>';
    html += '</section>';
    return html;
  }

  // ─────────────────────────── 確認頁 ───────────────────────────
  /** P12.1：合併時若真係撞到硬上限，要講出嚟（唔可以靜靜砍走多頁內容）。 */
  function trimNotes(notes) {
    var out = { kp: 0, cards: 0 };
    (notes || []).forEach(function (n) {
      var s = String(n);
      if (s.indexOf('trimmed_kp:') === 0) out.kp = Number(s.slice(11)) || 0;
      if (s.indexOf('trimmed_cards:') === 0) out.cards = Number(s.slice(14)) || 0;
    });
    return out;
  }

  function selectedCount() {
    if (!state.analysis) return 0;
    return state.analysis.cards.filter(function (c) { return state.confirm[c.id] !== false; }).length;
  }

  function viewConfirm() {
    var a = state.analysis;
    if (!a) return '<p class="empty">' + esc(t('home.empty')) + '</p>';
    var n = selectedCount();
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(t('confirm.title')) + '</h1>';
    html += '<div class="banner" id="confirm-banner"><span>' + esc(t('confirm.banner', { n: a.knowledgePoints.length })) + '</span>';
    html += '<button type="button" class="linkbtn" data-act="understand">' + esc(t('understand.mastery')) + '</button></div>';
    // P3：確認頁都見到今次會存入邊個卡冊分類
    html += '<p class="meta" id="confirm-category" aria-label="' + esc(t('decks.category')) + '"><span class="chip chip--static">' + esc(catLabel(Ai.categoryOf(a.topic, a.classification))) + '</span></p>';
    if (a.cached) html += '<div class="notice notice--ok" id="cache-hit">' + esc(t('confirm.cached')) + '</div>';
    // P12.1：萬一真係撞到合併硬上限（每批 12 kp／40 卡 × 批數），要講清楚少咗幾多，唔靜靜砍
    if (a.trimmed && (a.trimmed.kp || a.trimmed.cards)) {
      html += '<div class="notice notice--warn" id="confirm-trimmed">' + esc(t('confirm.trimmed', a.trimmed)) + '</div>';
    }
    html += '<div class="toolbar toolbar--tight">';
    html += '<button type="button" class="btn btn--tiny" data-act="select-all">' + esc(t('confirm.selectAll')) + '</button>';
    html += '<button type="button" class="btn btn--tiny" data-act="select-none">' + esc(t('confirm.none')) + '</button>';
    html += '</div>';
    html += '<div id="confirm-list">';
    a.knowledgePoints.forEach(function (kp) {
      var cards = a.cards.filter(function (c) { return c.kpId === kp.id; });
      html += '<section class="cgroup" data-kp="' + esc(kp.id) + '">';
      html += '<h3 class="cgroup__head"><span>' + esc(kp.label) + '</span><span class="cgroup__badge">' + esc(kp.category) + ' · ' + cards.length + '</span></h3>';
      if (!cards.length) {
        html += '<p class="empty empty--tiny">' + esc(t('confirm.noCards')) + '</p>';
      } else {
        html += '<ul class="crows">';
        cards.forEach(function (c) {
          var on = state.confirm[c.id] !== false;
          if (state.editCardId === c.id) {
            html += '<li class="crow crow--edit" data-card="' + esc(c.id) + '">';
            html += '<label class="crow__check"><input type="checkbox" class="card-check" data-card="' + esc(c.id) + '"' + (on ? ' checked' : '') + ' />';
            html += '<span class="crow__text">';
            html += '<input class="input edit-input" data-field="front" data-card="' + esc(c.id) + '" maxlength="60" value="' + esc(c.front) + '" aria-label="front" />';
            html += '<input class="input edit-input" data-field="back" data-card="' + esc(c.id) + '" maxlength="120" value="' + esc(c.back) + '" aria-label="back" />';
            html += '</span></label>';
            html += '<span class="crow__meta"><button type="button" class="btn btn--tiny" data-act="save-card" data-card="' + esc(c.id) + '">' + esc(t('confirm.save')) + '</button> ';
            html += '<button type="button" class="btn btn--tiny" data-act="cancel-card">' + esc(t('common.cancel')) + '</button></span>';
            html += '</li>';
            return;
          }
          html += '<li class="crow' + (on ? '' : ' crow--off') + '" data-card="' + esc(c.id) + '">';
          html += '<label class="crow__check"><input type="checkbox" class="card-check" data-card="' + esc(c.id) + '"' + (on ? ' checked' : '') + ' />';
          html += '<span class="crow__text"><strong>' + esc(P.displayFront(c.front)) + '</strong><small>' + esc(c.back) + '</small></span></label>';
          html += '<span class="crow__meta">' + esc(c.category) + ' · ' + esc(stars(c.difficulty)) + '</span>';
          if (c.uncertain) html += '<span class="badge badge--warn">' + esc(t('confirm.uncertain')) + '</span>';
          html += '<button type="button" class="btn btn--tiny" data-act="edit-card" data-card="' + esc(c.id) + '">' + esc(t('confirm.edit')) + '</button>';
          html += '</li>';
        });
        html += '</ul>';
      }
      html += '</section>';
    });
    html += '</div>';
    html += vocabHtml(a.vocabulary);
    html += '<p class="hint hint--soft">' + esc(t('confirm.savedOnce')) + '</p>';
    html += '<div class="stickybar"><button type="button" class="btn btn--primary btn--wide" id="btn-add"' + (n === 0 ? ' disabled' : '') + ' data-act="save-confirm">' + esc(t('confirm.add', { n: n })) + '</button></div>';
    html += '</section>';
    return html;
  }

  // ─────────────────────────── 卡組頁 ───────────────────────────
  function viewDeck(deckId) {
    var deck = S.getDeck(state.db, deckId);
    if (!deck) return '<p class="empty">' + esc(t('home.empty')) + '</p>';
    var stats = M.deckStats(deck, now(), state.db.srs);
    var week = Srs.weekSeries(deck.cards, state.db.srs, now());
    var max = Math.max.apply(null, week.map(function (w) { return w.count; }).concat([1]));
    var hardest = M.hardest(deck, 5, state.db.srs);
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(deck.title) + '</h1>';
    html += '<p class="meta">' + esc((deck.classification && deck.classification.subjectLabel) || '') + ' · ' + esc((deck.classification && deck.classification.gradeLabel) || '') + ' · ' + esc(stars((deck.classification && deck.classification.difficulty) || 1)) + '</p>';
    html += '<ul class="statrow" id="deck-stats">';
    html += '<li><strong>' + stats.newCount + '</strong><span>' + esc(t('deck.new')) + '</span></li>';
    html += '<li><strong>' + stats.learning + '</strong><span>' + esc(t('deck.learning')) + '</span></li>';
    html += '<li><strong>' + stats.mastered + '</strong><span>' + esc(t('deck.mastered')) + '</span></li>';
    html += '</ul>';
    html += '<p class="meta">' + esc(t('deck.due', { n: stats.dueToday })) + '</p>';
    html += '<h3 class="sub">' + esc(t('deck.week')) + '</h3>';
    html += '<ul class="bars" id="week-bars">';
    week.forEach(function (w) {
      var pct = Math.round((w.count / max) * 100);
      html += '<li class="bar"><span class="bar__fill" style="height:' + Math.max(4, pct) + '%"></span><span class="bar__n">' + w.count + '</span><span class="bar__d">' + esc(w.date) + '</span></li>';
    });
    html += '</ul>';
    html += '<h3 class="sub">' + esc(t('deck.hardest')) + '</h3>';
    html += '<ol class="hardest" id="hardest-list">';
    hardest.forEach(function (c) {
      var s = Srs.normalize(state.db.srs[c.id]);
      html += '<li>' + esc(P.displayFront(c.front)) + ' <small>' + esc(t('deck.learning')) + ' ' + (s.tries - s.ok) + '✗</small></li>';
    });
    html += '</ol>';
    html += '<div class="toolbar">';
    html += '<button type="button" class="btn btn--primary" data-act="practice" data-id="' + esc(deck.id) + '">' + esc(t('deck.practice')) + '</button>';
    // P14：有詞語生字先出「練詞語」掣
    if ((deck.vocabulary || []).length) {
      html += '<button type="button" class="btn btn--ghost" id="btn-vocab-practice" data-act="start-vocab" data-id="' + esc(deck.id) + '">' + esc(t('vocab.practice', { n: deck.vocabulary.length })) + '</button>';
    }
    html += '<button type="button" class="btn btn--ghost" data-act="deck-map" data-id="' + esc(deck.id) + '">' + esc(t('deck.map')) + '</button>';
    html += '<button type="button" class="btn btn--ghost" id="btn-print" data-act="print" data-id="' + esc(deck.id) + '">' + esc(t('deck.print')) + '</button>';
    html += '</div>';
    // P4 A：卡組頁「📄 原文」（有 source 才顯示；舊卡組冇就唔會有掣）
    html += sourcePanelHtml(deck);
    // P13：卡組頁「🔤 詞語生字」（有 vocabulary 才顯示）
    html += vocabHtml(deck.vocabulary);
    html += '<div class="toolbar"><button type="button" class="btn btn--danger btn--tiny" data-act="delete-deck" data-id="' + esc(deck.id) + '">' + esc(t('deck.delete')) + '</button></div>';
    html += '</section>';
    return html;
  }

  // ─────────────────────────── 列印字卡（P20） ───────────────────────────
  /** P22：列印內容 = 字卡／詞語生字／兩樣；回傳 [{kind:'card', card}] 或 [{kind:'vocab', vocab}]。 */
  function printItems(deck) {
    var set = state.print.set || 'cards';
    var out = [];
    if (set !== 'vocab') {
      var cards = (deck.cards || []).slice();
      if (state.print.scope === 'unmastered') {
        cards = cards.filter(function (c) { return !Srs.isMastered(state.db.srs[c.id]); });
      }
      cards.forEach(function (c) { out.push({ kind: 'card', card: c }); });
    }
    if (set !== 'cards') {
      Pr.vocabItems(deck.vocabulary).forEach(function (v) { out.push({ kind: 'vocab', vocab: v }); });
    }
    return out;
  }

  function printVocabCount(deck) {
    return Pr.vocabItems(deck.vocabulary).length;
  }

  function printFontVars(size) {
    if (size === 'big') return '--fs:12.5pt;--fsb:11pt;--fsa:8pt;';
    if (size === 'small') return '--fs:8.5pt;--fsb:8pt;--fsa:6pt;';
    return '--fs:10pt;--fsb:9pt;--fsa:7pt;';
  }

  function printDateLabel() {
    var d = new Date(now());
    function p2(v) { return v < 10 ? '0' + v : String(v); }
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }

  function printCardCell(item, n, kind, size) {
    var html = '<li class="printcard" data-n="' + n + '">';
    html += '<span class="printcard__no">' + n + '</span>';
    if (item.kind === 'vocab') {
      var v = item.vocab;
      html += '<span class="printcard__cat">' + esc(t('print.vocabTag')) + '</span>';
      if (kind === 'back') {
        html += '<div class="printcard__t printcard__t--back ' + Pr.fitClass(v.meaning, 'back') + '">' + esc(v.meaning) + '</div>';
        if (v.example) {
          html += '<div class="printcard__eg ' + Pr.fitClass(v.example, 'back') + '">' + esc(t('print.exampleTag')) + esc(v.example) + '</div>';
        }
      } else {
        html += '<div class="printcard__t printcard__word ' + Pr.fitClass(v.word, 'front') + '" lang="' + (v.lang === 'en' ? 'en' : 'zh-HK') + '">' + esc(v.word) + '</div>';
        if (kind === 'single') {
          html += '<div class="printcard__a">' + esc(v.meaning) + '</div>';
          if (v.example) html += '<div class="printcard__eg">' + esc(t('print.exampleTag')) + esc(v.example) + '</div>';
        }
      }
      html += '</li>';
      return html;
    }
    var card = item.card;
    if (String(card.category || '').trim()) html += '<span class="printcard__cat">' + esc(card.category) + '</span>';
    if (kind === 'back') {
      var bt = P.displayFront(card.back);
      html += '<div class="printcard__t printcard__t--back ' + Pr.fitClass(bt, 'back') + '">' + esc(bt) + '</div>';
    } else {
      var ft = P.displayFront(card.front);
      html += '<div class="printcard__t ' + Pr.fitClass(ft, 'front') + '">' + esc(ft) + '</div>';
      if (kind === 'single') html += '<div class="printcard__a">' + esc(P.displayFront(card.back)) + '</div>';
    }
    html += '</li>';
    return html;
  }

  /** 一頁（正面／背面各一頁）：雙面背面會左右鏡像，答案先會印喺同一張卡後面。 */
  function printSheetHtml(deck, cards, kind, pageNo, pageTotal) {
    var p = Pr.preset(state.print.size);
    var list = kind === 'back' ? Pr.mirrorRow(cards, state.print.size) : cards;
    var cellKind = kind === 'back' ? 'back' : (state.print.mode === 'duplex' ? 'front' : 'single');
    var base = (pageNo - 1) * Pr.perSheet(state.print.size);
    var html = '';
    html += '<section class="sheet' + (kind === 'back' ? ' sheet--back' : '') + '" data-kind="' + kind + '" data-page="' + pageNo + '"';
    html += ' style="--cols:' + p.cols + ';--cw:' + p.w + 'mm;--ch:' + p.h + 'mm;' + printFontVars(state.print.size) + '">';
    html += '<header class="sheet__head"><span class="sheet__title">' + esc(deck.title || '') + '</span><span class="sheet__date">' + esc(printDateLabel()) + '</span></header>';
    html += '<ol class="sheet__grid">';
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item) { html += '<li class="printcard printcard--blank" aria-hidden="true"></li>'; continue; }
      var idx = cards.indexOf(item);
      html += printCardCell(item, base + (idx < 0 ? 0 : idx) + 1, cellKind, state.print.size);
    }
    html += '</ol>';
    html += '<footer class="sheet__foot"><span>' + esc(t('print.cutTip')) + '</span><span>' + esc(t('print.foot', { i: pageNo, n: pageTotal })) + '</span></footer>';
    html += '</section>';
    return html;
  }

  function viewPrint(deckId) {
    var deck = S.getDeck(state.db, deckId);
    var html = '';
    if (!deck) {
      html += '<section class="section print-controls"><p class="empty">' + esc(t('print.noDeck')) + '</p>';
      html += '<button type="button" class="btn btn--ghost" data-act="home">' + esc(t('nav.back')) + '</button></section>';
      return html;
    }
    var cards = printItems(deck);
    var vocabN = printVocabCount(deck);
    var est = Pr.estimate(cards.length, state.print.size, state.print.mode);
    var modeLabel = state.print.mode === 'duplex' ? t('print.mode.duplex') : t('print.mode.single');
    html += '<section class="section print-controls">';
    html += '<h1 class="page-title">' + esc(t('print.title')) + '</h1>';
    html += '<p class="hint">' + esc(t('print.hint')) + '</p>';

    html += '<h3 class="sub">' + esc(t('print.what')) + '</h3>';
    html += '<div class="seg" role="group" id="print-set" aria-label="' + esc(t('print.what')) + '">';
    [['cards', t('print.what.cards', { n: (deck.cards || []).length })], ['vocab', t('print.what.vocab', { n: vocabN })], ['both', t('print.what.both')]].forEach(function (st) {
      var on = (state.print.set || 'cards') === st[0];
      var dis = st[0] !== 'cards' && !vocabN;
      html += '<button type="button" class="seg__btn' + (on ? ' is-on' : '') + '" data-act="print-set" data-set="' + st[0] + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + (dis ? ' disabled' : '') + '>' + esc(st[1]) + '</button>';
    });
    html += '</div>';

    html += '<h3 class="sub">' + esc(t('print.size')) + '</h3>';
    html += '<div class="seg" role="group" id="print-size" aria-label="' + esc(t('print.size')) + '">';
    Pr.SIZES.forEach(function (id) {
      var on = state.print.size === id;
      html += '<button type="button" class="seg__btn' + (on ? ' is-on' : '') + '" data-act="print-size" data-size="' + id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(t('print.size.' + id)) + '</button>';
    });
    html += '</div>';

    html += '<h3 class="sub">' + esc(t('print.mode')) + '</h3>';
    html += '<div class="seg" role="group" id="print-mode" aria-label="' + esc(t('print.mode')) + '">';
    [['duplex', 'print.mode.duplex'], ['single', 'print.mode.single']].forEach(function (m) {
      var on = state.print.mode === m[0];
      html += '<button type="button" class="seg__btn' + (on ? ' is-on' : '') + '" data-act="print-mode" data-mode="' + m[0] + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(t(m[1])) + '</button>';
    });
    html += '</div>';

    html += '<h3 class="sub">' + esc(t('print.scope')) + '</h3>';
    html += '<div class="seg" role="group" id="print-scope" aria-label="' + esc(t('print.scope')) + '"' + ((state.print.set || 'cards') === 'vocab' ? ' hidden' : '') + '>';
    [['all', t('print.scope.all', { n: (deck.cards || []).length })], ['unmastered', t('print.scope.unmastered')]].forEach(function (sc) {
      var on = state.print.scope === sc[0];
      html += '<button type="button" class="seg__btn' + (on ? ' is-on' : '') + '" data-act="print-scope" data-scope="' + sc[0] + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(sc[1]) + '</button>';
    });
    html += '</div>';

    var estTxt = t('print.est', { n: cards.length, sheets: est.sheets, pages: est.pages, per: est.per, mode: modeLabel });
    if ((state.print.set || 'cards') === 'both') estTxt = t('print.estBoth', { cards: (deck.cards || []).length, vocab: vocabN, n: cards.length, sheets: est.sheets, pages: est.pages, per: est.per, mode: modeLabel });
    html += '<p class="print-est" id="print-est">' + esc(estTxt) + '</p>';
    html += '<div class="toolbar">';
    html += '<button type="button" class="btn btn--primary" data-act="do-print" id="btn-do-print"' + (cards.length ? '' : ' disabled') + '>' + esc(t('print.do')) + '</button>';
    html += '<button type="button" class="btn btn--ghost" data-act="deck-back" data-id="' + esc(deck.id) + '">' + esc(t('print.back')) + '</button>';
    html += '</div>';
    html += '</section>';
    if (!cards.length) return html;

    var chunks = Pr.chunk(cards, state.print.size);
    html += '<div id="print-sheets" class="print-sheets">';
    chunks.forEach(function (chunk, i) {
      html += printSheetHtml(deck, chunk, 'front', i + 1, chunks.length);
      if (state.print.mode === 'duplex') html += printSheetHtml(deck, chunk, 'back', i + 1, chunks.length);
    });
    html += '</div>';
    return html;
  }

  // ─────────────────────────── 掌握地圖 ───────────────────────────
  function currentMapDeck() {
    if (state.mapPreviewDeckId) {
      return S.getDeck(state.db, state.mapPreviewDeckId) || analysisDeckLike();
    }
    if (state.route.name === 'map' && state.route.id) {
      var d = S.getDeck(state.db, state.route.id);
      if (d) return d;
    }
    if (state.route.name === 'map-preview') return analysisDeckLike();
    return null;
  }

  function viewMap() {
    var deck = currentMapDeck();
    if (!deck) return '<p class="empty">' + esc(t('home.empty')) + '</p>';
    var cols = M.groupByCategory(deck, { srs: state.db.srs });
    var stats = M.mapStats(cols);
    var layer = M.layout(cols.length);
    var isPreview = state.route.name === 'map-preview' || !state.route.id;
    var html = '';
    html += '<section class="section section--map"><h1 class="page-title">' + esc(t('map.title')) + ' · ' + esc((deck.classification && deck.classification.gradeLabel) || '') + '</h1>';
    html += '<div class="maproot" id="map-root"><strong>' + esc(deck.title) + '</strong><small>' +
      esc(t('map.rootMeta', { k: (deck.knowledgePoints || []).length, c: (deck.cards || []).length, gold: stats.gold, total: stats.total })) + '</small></div>';
    html += '<div class="mapwrap" id="map-wrap"><svg id="map-svg" class="mapsvg" aria-hidden="true"></svg>';
    html += '<div class="mapcols cols-' + Math.max(1, Math.min(4, layer.cols)) + (layer.merge ? ' cols-merge' : '') + '" id="map-cols">';
    cols.forEach(function (col) {
      html += '<section class="mapcol" data-category="' + esc(col.category) + '"><h3 class="mapcol__head">' + esc(col.category) + ' <span class="mapcol__n">' + col.kps.length + '</span></h3>';
      col.kps.forEach(function (kp) {
        html += '<button type="button" class="map-kp state--' + esc(kp.state) + '" data-act="practice-kp" data-kp="' + esc(kp.id) + '" data-id="' + esc(deck.id || '') + '">';
        html += '<span class="map-kp__label">' + esc(kp.label) + '</span>';
        html += '<span class="map-kp__meta">' + esc(stateLabel(kp.state)) + ' · ' + kp.count + ' ' + esc(t('common.card')) + '</span>';
        html += '</button>';
      });
      html += '</section>';
    });
    html += '</div></div>';
    html += '<ul class="legend"><li class="legend--gold">■ ' + esc(t('map.gold')) + ' ' + stats.gold + '</li><li class="legend--blue">■ ' + esc(t('map.blue')) + ' ' + stats.blue + '</li><li class="legend--gray">■ ' + esc(t('map.gray')) + ' ' + stats.gray + '</li></ul>';
    html += '<div class="toolbar"><button type="button" class="btn btn--ghost" id="btn-outline" data-act="toggle-outline">' + esc(state.outline ? t('map.map') : t('map.outline')) + '</button></div>';
    if (state.outline) {
      html += '<ul class="outline" id="map-outline">';
      cols.forEach(function (col) {
        html += '<li class="outline__cat">' + esc(col.category) + '<ul>';
        col.kps.forEach(function (kp) {
          html += '<li class="outline__kp"><span>' + esc(kp.label) + '</span><small>' + esc(stateLabel(kp.state)) + ' · ' + kp.count + '</small></li>';
        });
        html += '</ul></li>';
      });
      html += '</ul>';
    } else {
      html += '<p class="hint hint--soft" id="map-hint">' + esc(isPreview ? t('map.preview') : '') + '</p>';
    }
    html += '</section>';
    return html;
  }

  function drawMapLines() {
    var svg = document.getElementById('map-svg');
    var wrap = document.getElementById('map-wrap');
    var root = document.getElementById('map-root');
    var cols = document.getElementById('map-cols');
    if (!svg || !wrap || !root || !cols) return;
    var box = wrap.getBoundingClientRect();
    if (!box.width) return;
    var rb = root.getBoundingClientRect();
    var x0 = rb.left + rb.width / 2 - box.left;
    var y0 = rb.bottom - box.top;
    var paths = '';
    var heads = cols.querySelectorAll('.mapcol__head');
    var rootRectH = rb.height;
    svg.setAttribute('viewBox', '0 0 ' + Math.round(box.width) + ' ' + Math.round(box.height));
    svg.setAttribute('width', String(Math.round(box.width)));
    svg.setAttribute('height', String(Math.round(box.height)));
    for (var i = 0; i < heads.length; i++) {
      var hb = heads[i].getBoundingClientRect();
      var x1 = hb.left + hb.width / 2 - box.left;
      var y1 = hb.top - box.top;
      var midY = y0 + Math.max(18, (y1 - y0) / 2);
      paths += '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' C' + x0.toFixed(1) + ' ' + midY.toFixed(1) + ' ' + x1.toFixed(1) + ' ' + midY.toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" />';
    }
    svg.innerHTML = paths;
    void rootRectH;
  }

  // ─────────────────────────── 練習 ───────────────────────────
  function cardById(deck, id) {
    if (!deck) return null;
    for (var i = 0; i < deck.cards.length; i++) if (deck.cards[i].id === id) return deck.cards[i];
    return null;
  }

  /** 練習隊列一律用 {d: deckId, c: cardId}，令「今日／全部／易錯」可以跨卡組（F3/F4）。 */
  function entryCard(e) {
    if (!e) return null;
    return cardById(S.getDeck(state.db, e.d), e.c);
  }

  function entryDeck(e) {
    return e ? S.getDeck(state.db, e.d) : null;
  }

  function currentEntry() {
    var s = state.session;
    return s ? s.queue[s.index] : null;
  }

  function allEntries() {
    var out = [];
    state.db.decks.forEach(function (d) {
      (d.cards || []).forEach(function (c) { out.push({ d: d.id, c: c.id }); });
    });
    return out;
  }

  function entrySrs(e) {
    var c = entryCard(e);
    return Srs.normalize(c ? state.db.srs[c.id] : null);
  }

  function entryDifficulty(e) {
    var c = entryCard(e);
    return c ? Number(c.difficulty) || 1 : 1;
  }

  function byDifficultyEntry(a, b) {
    var d = entryDifficulty(a) - entryDifficulty(b);
    if (d !== 0) return d;
    return String(a.c).localeCompare(String(b.c));
  }

  /** 今日任務：到期 ＋ 新卡，跨卡組，補到每日目標（唔會包未到期嘅舊卡）。 */
  function todayEntries(db) {
    var t = now();
    var due = [];
    var fresh = [];
    allEntries().forEach(function (e) {
      var s = entrySrs(e);
      if (s.tries > 0 && s.due <= t) due.push(e);
      else if (s.tries === 0) fresh.push(e);
    });
    due.sort(function (a, b) {
      return entrySrs(a).due - entrySrs(b).due || byDifficultyEntry(a, b);
    });
    fresh.sort(byDifficultyEntry);
    return due.concat(fresh).slice(0, db.settings.dailyGoal);
  }

  /** 全部卡：到期先、新卡次、其餘（未到期但練過）最後；組內由淺入深。 */
  function allEntriesSorted() {
    var t = now();
    var due = [];
    var fresh = [];
    var rest = [];
    allEntries().forEach(function (e) {
      var s = entrySrs(e);
      if (s.tries > 0 && s.due <= t) due.push(e);
      else if (s.tries === 0) fresh.push(e);
      else rest.push(e);
    });
    due.sort(byDifficultyEntry);
    fresh.sort(byDifficultyEntry);
    rest.sort(byDifficultyEntry);
    return due.concat(fresh, rest);
  }

  /** 易錯挑戰：★4–5 或答錯最多，跨卡組，按答錯次數再按難度排序，取 3 張。 */
  function trickyEntries() {
    var items = allEntries().map(function (e) {
      var s = entrySrs(e);
      return { e: e, wrong: s.tries - s.ok, diff: entryDifficulty(e) };
    }).filter(function (x) { return x.diff >= 4 || x.wrong > 0; });
    items.sort(function (a, b) { return (b.wrong - a.wrong) || (b.diff - a.diff) || byDifficultyEntry(a.e, b.e); });
    return items.slice(0, 3).map(function (x) { return x.e; });
  }

  function exerciseCards(deck, filter) {
    if (filter === 'wrong') return deck.cards;
    if (filter && filter.indexOf('kp:') === 0) {
      return Srs.buildQueue(deck.cards, state.db.srs, now(), { filter: filter.slice(3) });
    }
    return Srs.buildQueue(deck.cards, state.db.srs, now(), {});
  }

  function startPractice(deckId, filter, opts) {
    var o = opts || {};
    var entries;
    if (o.entries) {
      entries = o.entries;
    } else {
      var deck = S.getDeck(state.db, deckId);
      if (!deck) { toast(t('toast.noDeck')); return; }
      var cards = o.cardIds
        ? o.cardIds.map(function (id) { return cardById(deck, id); }).filter(Boolean)
        : exerciseCards(deck, filter);
      entries = cards.map(function (c) { return { d: deck.id, c: c.id }; });
    }
    entries = entries.filter(function (e) { return !!entryCard(e); });
    if (!entries.length) { toast(t('practice.empty')); return; }
    state.session = {
      deckId: deckId || null,
      filter: filter || 'all',
      queue: entries,
      index: o.index || 0,
      answers: o.answers || [],
      revealed: false,
      feedback: null,
      mode: null,
    };
    go('#/practice');
  }

  /** 4 選 1：干擾項由同卡組其他卡背面抽、字串去重；唔夠 3 個 → 退回翻卡。 */
  function choiceOptions(card, deck, extra) {
    var answer = card.back;
    var pool = (deck.cards || []).filter(function (c) {
      return c.id !== card.id && c.front !== card.front && c.back && c.back !== answer;
    });
    var seen = Object.create(null);
    seen[answer] = 1;
    var opts = [{ text: answer, correct: true }];
    var usable = pool.filter(function (c) {
      var key = String(c.back).trim();
      if (seen[key]) return false;
      seen[key] = 1;
      return true;
    });
    // 洗牌（可重現）
    for (var i = usable.length - 1; i > 0; i--) {
      var j = Math.floor(seedRandom() * (i + 1));
      var tmp = usable[i];
      usable[i] = usable[j];
      usable[j] = tmp;
    }
    usable.slice(0, 3).forEach(function (c) { opts.push({ text: c.back, correct: false }); });
    (extra || []).forEach(function (txt) {
      if (opts.length >= 4) return;
      var key = String(txt).trim();
      if (!key || seen[key]) return;
      seen[key] = 1;
      opts.push({ text: key, correct: false });
    });
    if (opts.length < 4) return null; // 唔夠干擾項：唔可以出 3 個選項
    var last = opts.length;
    for (var k = last - 1; k > 0; k--) {
      var m = Math.floor(seedRandom() * (k + 1));
      var tv = opts[k];
      opts[k] = opts[m];
      opts[m] = tv;
    }
    return opts;
  }

  function clozeOptions(card, deck) {
    var cloze = P.parseCloze(card.front);
    if (!cloze) return null;
    // P10（用戶真機截圖）：正解唔可以攞 `{{ }}` 括號內文字——模型成日照抄
    // `{{answer}}`，令選項出現字面值 "answer"。卡片規格係 back 才是答案
    // （flip／打字模式一直用 card.back）。back 空或者係佔位符字面值 ⇒ 回 null，
    // 由呼叫方退回 flip，寧願翻卡都唔出一條揀唔到正解嘅選擇題。
    var answer = String(card.back == null ? '' : card.back).trim();
    if (P.isPlaceholderAnswer(answer)) return null;
    var extra = P.sentenceWords(cloze.sentence, 3);
    var opts = choiceOptions({ id: card.id, front: card.front, back: answer }, deck, extra);
    return opts;
  }

  function isYoung(grade) {
    return /^K/.test(grade || '') || grade === 'P1' || grade === 'P2';
  }

  function modeFor(card, deck) {
    var g = (deck.classification && deck.classification.grade) || 'P4';
    var young = isYoung(g);
    if (young) {
      if (card.type === 'cloze' && P.parseCloze(card.front)) return 'cloze';
      if (card.type === 'basic' && choiceOptions(card, deck)) return 'choice';
      return 'flip';
    }
    // 家長問答：P3+ 一律「睇題 → 揭曉答案 → 記得／唔記得」，唔使打字
    return 'flip';
  }

  // ── P14：詞語生字練習（英文：睇中文打英文；中文：翻卡自評）──
  function vocabSrsKey(deckId, id) { return 'vocab|' + deckId + '|' + id; }

  function startVocabPractice(deckId) {
    var deck = S.getDeck(state.db, deckId);
    if (!deck) return;
    var vocab = Ai.sanitizeVocabulary(deck.vocabulary);
    if (!vocab.length) { toast(t('vocab.none')); return; }
    state.vsession = {
      deckId: deckId,
      ids: vocab.map(function (v) { return v.id; }),
      index: 0,
      revealed: false,
      answered: false,
      last: null,
      ok: 0,
      done: false,
    };
    state.route = { name: 'vocab-practice', id: deckId };
    go('#/vocab-practice/' + deckId);
  }

  function currentVocabItem() {
    var s = state.vsession;
    if (!s) return null;
    var deck = S.getDeck(state.db, s.deckId);
    if (!deck) return null;
    var vocab = Ai.sanitizeVocabulary(deck.vocabulary);
    var id = s.ids[s.index];
    for (var i = 0; i < vocab.length; i++) if (vocab[i].id === id) return { deck: deck, item: vocab[i] };
    return null;
  }

  function recordVocab(deckId, id, ok) {
    var key = vocabSrsKey(deckId, id);
    state.db.srs[key] = Srs.review(Srs.normalize(state.db.srs[key]), !!ok, now());
    S.save(state.db);
  }

  function answerVocab(correct) {
    var s = state.vsession;
    var cur = currentVocabItem();
    if (!s || !cur || s.answered) return;
    recordVocab(s.deckId, cur.item.id, correct);
    s.answered = true;
    s.last = { correct: !!correct };
    if (correct) s.ok += 1;
    render();
  }

  function vocabNext() {
    var s = state.vsession;
    if (!s) return;
    s.index += 1;
    s.revealed = false;
    s.answered = false;
    s.last = null;
    if (s.index >= s.ids.length) { s.done = true; s.index = s.ids.length - 1; }
    render();
  }

  function viewVocabPractice() {
    var s = state.vsession;
    if (!s) return '<p class="empty">' + esc(t('vocab.none')) + '</p>';
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(t('vocab.practiceTitle')) + '</h1>';
    if (s.done) {
      html += '<div class="notice notice--ok" id="vocab-done">' + esc(t('vocab.done', { ok: s.ok, n: s.ids.length })) + '</div>';
      html += '<div class="toolbar"><button type="button" class="btn btn--primary" data-act="start-vocab" data-id="' + esc(s.deckId) + '">' + esc(t('vocab.again')) + '</button>';
      html += '<button type="button" class="btn btn--ghost" data-act="deck" data-id="' + esc(s.deckId) + '">' + esc(t('vocab.backDeck')) + '</button></div></section>';
      return html;
    }
    var cur = currentVocabItem();
    if (!cur) return '<p class="empty">' + esc(t('vocab.none')) + '</p>';
    var v = cur.item;
    html += '<p class="meta" id="vocab-progress">' + esc(t('vocab.progress', { i: s.index + 1, n: s.ids.length, ok: s.ok })) + '</p>';
    html += '<div class="vcard" id="vocab-card" data-lang="' + esc(v.lang) + '">';
    if (v.lang === 'en') {
      html += '<p class="hint hint--soft">' + esc(t('vocab.enPrompt')) + '</p>';
      html += '<p class="vocab__meaning" id="vocab-prompt">' + esc(v.meaning) + '</p>';
      html += '<button type="button" class="btn btn--tiny" data-act="say" data-say="' + esc(v.word) + '" aria-label="' + esc(t('vocab.listen')) + '">' + esc(t('vocab.listen')) + '</button>';
      if (!s.answered) {
        html += '<label class="hint" for="vocab-input">' + esc(t('vocab.inputLabel')) + '</label>';
        html += '<input class="input" id="vocab-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" />';
        html += '<div class="toolbar"><button type="button" class="btn btn--primary" id="btn-vocab-check" data-act="vocab-check">' + esc(t('vocab.check')) + '</button>';
        html += '<button type="button" class="btn btn--ghost" id="btn-vocab-giveup" data-act="vocab-giveup">' + esc(t('vocab.giveup')) + '</button></div>';
      }
    } else {
      html += '<p class="hint hint--soft">' + esc(t('vocab.zhPrompt')) + '</p>';
      html += '<p class="vocab__word" id="vocab-prompt">' + esc(v.word) + '</p>';
      html += '<button type="button" class="btn btn--tiny" data-act="say" data-say="' + esc(v.word) + '" aria-label="' + esc(t('vocab.read')) + '">' + esc(t('vocab.read')) + '</button>';
      if (!s.revealed && !s.answered) {
        html += '<div class="toolbar"><button type="button" class="btn btn--primary" id="btn-vocab-reveal" data-act="vocab-reveal">' + esc(t('vocab.reveal')) + '</button></div>';
      }
    }
    if (s.answered) {
      var correct = !!(s.last && s.last.correct);
      html += '<div class="notice ' + (correct ? 'notice--ok' : 'notice--warn') + '" id="vocab-result" data-correct="' + (correct ? '1' : '0') + '">' + esc(correct ? t('vocab.correct') : t('vocab.wrong', { w: v.word })) + '</div>';
    }
    if (s.revealed || s.answered) {
      if (v.lang !== 'en' || s.answered) {
        html += '<p class="vocab__meaning" id="vocab-answer">' + esc(t('vocab.answer')) + esc(v.meaning) + '</p>';
      }
      if (v.example) {
        html += '<p class="vocab__ex">' + esc(t('vocab.example')) + '<span lang="' + (v.lang === 'en' ? 'en' : 'zh-HK') + '">' + esc(v.example) + '</span>';
        html += ' <button type="button" class="btn btn--tiny" data-act="say" data-say="' + esc(v.example) + '" aria-label="' + esc(t('vocab.readEx')) + '">🔊</button></p>';
      }
    }
    if (s.answered) {
      var lastItem = s.index + 1 >= s.ids.length;
      html += '<div class="toolbar">';
      html += '<button type="button" class="btn btn--primary" id="btn-vocab-next" data-act="vocab-next">' + esc(lastItem ? t('vocab.finish') : t('vocab.next')) + '</button>';
      html += '</div>';
    } else if (s.revealed) {
      // 中文：揭曉後自評（記得／唔記得）→ 記 SRS 再落下一題
      html += '<div class="toolbar">';
      html += '<button type="button" class="btn btn--primary" data-act="vocab-self" data-ok="1">' + esc(t('vocab.remember')) + '</button>';
      html += '<button type="button" class="btn btn--ghost" data-act="vocab-self" data-ok="0">' + esc(t('vocab.forget')) + '</button>';
      html += '</div>';
    }
    html += '</div></section>';
    return html;
  }

  function viewPractice() {
    var session = state.session;
    if (!session) return '<p class="empty">' + esc(t('practice.empty')) + '</p>';
    var entry = currentEntry();
    var deck = entryDeck(entry);
    var card = entryCard(entry);
    if (!card || !deck) return '<p class="empty">' + esc(t('practice.empty')) + '</p>';
    if (!session.mode) session.mode = modeFor(card, deck);
    var html = '';
    html += '<section class="section section--practice">';
    html += '<div class="pbar"><span id="progress-text">' + esc(t('practice.progress', { i: session.index + 1, n: session.queue.length })) + '</span>';
    html += '<button type="button" class="linkbtn" data-act="exit-practice">' + esc(t('practice.exit')) + '</button></div>';
    html += '<article class="pcard" id="practice-card" data-mode="' + esc(session.mode) + '">';
    // cloze 卡一律顯示填空線（＿＿），唔好顯示 {{answer}} 原文
    html += '<p class="pcard__front" id="practice-front">' + esc(P.displayFront(card.front)) + '</p>';
    html += '</article>';
    // P9：讀題目（所有模式都有；冇語音時 handleSpeak 會 toast 提示）
    html += '<div class="toolbar toolbar--tight"><button type="button" class="btn btn--ghost btn--wide" data-act="speak-front" id="btn-speak-front">' + esc(t('practice.speakFront')) + '</button></div>';
    // P4 A：練習頁都可以開返卡組原文（有 source 才顯示）
    html += sourcePanelHtml(deck);
    // P4 B：有 context 先出「📖 相關原文」；<details> 默認收起（唔好一開就爆答案），揭曉後仍然可看
    if (card.context) {
      html += '<details class="pctx" id="practice-context"><summary>' + esc(t('practice.context')) + '</summary>';
      html += '<p class="pctx__body" id="practice-context-body">' + esc(card.context) + '</p></details>';
    }

    if (session.needsContinue) {
      html += '<div class="feedback feedback--' + (session.feedback && session.feedback.correct ? 'ok' : 'bad') + '" id="practice-feedback">';
      html += session.feedback && session.feedback.correct ? esc(t('practice.right')) : esc(t('practice.wrong')) + esc(card.back);
      if (card.mnemonic) html += '<br /><span class="mnemonic">💡 ' + esc(card.mnemonic) + '</span>';
      html += '</div>';
      html += '<div class="toolbar"><button type="button" class="btn btn--primary btn--wide" data-act="advance" id="btn-continue">' + esc(t('practice.continue')) + '</button></div>';
      html += '</section>';
      return html;
    }

    if (session.mode === 'flip') {
      if (session.revealed) {
        html += '<div class="panswer" id="practice-answer"><p class="pcard__back">' + esc(card.back) + '</p>';
        if (card.mnemonic) html += '<p class="mnemonic">💡 ' + esc(card.mnemonic) + '</p>';
        if (card.example) html += '<p class="example">' + esc(card.example) + '</p>';
        html += '</div>';
        // P9：揭曉後可以讀答案
        html += '<div class="toolbar toolbar--tight"><button type="button" class="btn btn--ghost btn--wide" data-act="speak-back" id="btn-speak-back">' + esc(t('practice.speakBack')) + '</button></div>';
        html += '<div class="toolbar toolbar--split">';
        html += '<button type="button" class="btn btn--danger" data-act="answer" data-correct="0" id="btn-forget">' + esc(t('practice.forget')) + '</button>';
        html += '<button type="button" class="btn btn--ok" data-act="answer" data-correct="1" id="btn-remember">' + esc(t('practice.remember')) + '</button>';
        html += '</div>';
      } else {
        html += '<button type="button" class="btn btn--primary btn--wide" id="btn-reveal" data-act="reveal">' + esc(t('practice.flip')) + '</button>';
      }
    } else if (session.mode === 'choice' || session.mode === 'cloze') {
      var opts = state.session.optsCache;
      var key = card.id + ':' + session.index;
      if (!opts || state.session.optsKey !== key) {
        opts = session.mode === 'cloze' ? clozeOptions(card, deck) : choiceOptions(card, deck);
        if (!opts) {
          session.mode = 'flip';
          state.session.optsCache = null;
          return viewPractice();
        }
        session.optsCache = opts;
        session.optsKey = key;
      }
      html += '<p class="phint" id="choice-hint">' + esc(t('practice.pickOne')) + '</p>';
      html += '<div class="options" id="choice-list">';
      opts.forEach(function (o, i) {
        html += '<button type="button" class="choice" data-act="choose" data-i="' + i + '">' + esc(o.text) + '</button>';
      });
      html += '</div>';
      // 逃生掣（2026-11-18 用戶回報）：4 選 1／填空模式冇「顯示答案」⇒ 用戶以為壞機。
      // 撳一下即轉 flip 並直接揭曉（之後照樣用「記得／唔記得」記 SRS）。
      html += '<div class="toolbar"><button type="button" class="btn btn--ghost btn--wide" data-act="show-answer" id="btn-show-answer">' + esc(t('practice.flip')) + '</button></div>';
    } else if (session.mode === 'typing') {
      html += '<label class="sr-only" for="type-input">' + esc(t('practice.typing')) + '</label>';
      html += '<input id="type-input" class="type-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(t('practice.typing')) + '" />';
      html += '<div class="toolbar toolbar--split">';
      html += '<button type="button" class="btn btn--ghost" data-act="to-flip">' + esc(t('practice.tooHard')) + '</button>';
      html += '<button type="button" class="btn btn--primary" id="btn-type-submit" data-act="submit-type">' + esc(t('practice.submit')) + '</button>';
      html += '</div>';
    }

    if (session.feedback) {
      html += '<div class="feedback feedback--' + (session.feedback.correct ? 'ok' : 'bad') + '" id="practice-feedback">';
      html += session.feedback.correct ? esc(t('practice.right')) : esc(t('practice.wrong')) + esc(card.back);
      html += '</div>';
      if (session.needsContinue) {
        html += '<div class="toolbar"><button type="button" class="btn btn--primary btn--wide" data-act="advance" id="btn-continue">' + esc(t('practice.continue')) + '</button></div>';
      }
    }
    html += '</section>';
    return html;
  }

  function answerCurrent(correct, typed) {
    var session = state.session;
    if (!session) return;
    var entry = currentEntry();
    var deck = entryDeck(entry);
    var card = entryCard(entry);
    if (!card || !deck) return;
    var at = now();
    S.gradeSrs(state.db, card.id, !!correct, at);
    session.answers.push({ cardId: card.id, deckId: entry.d, correct: !!correct, at: at, typed: typed || '' });
    // 門戶共用進度事件（本機；練習頁仍然零外部請求）
    try {
      if (global.HubProgress) global.HubProgress.log({ app: 'cardlab', skill: 'card', correct: !!correct, ms: 0 });
    } catch (e) { /* HubProgress 壞咗唔影響練習 */ }
    session.feedback = { correct: !!correct };
    session.optsCache = null;
    session.optsKey = null;
    session.revealed = true;
    saveDraftNow();
    if (correct) {
      advance();
      return;
    }
    // 答錯：留住正解，等小朋友撳「繼續」
    session.needsContinue = true;
    render();
  }

  function saveDraftNow() {
    var s = state.session;
    if (!s) return;
    if (s.index >= s.queue.length) { S.clearDraft(); return; }
    S.saveDraft({
      deckId: s.deckId,
      entries: s.queue,
      index: s.index,
      answers: s.answers,
      filter: s.filter,
      savedAt: now(),
    });
  }

  function advance() {
    var s = state.session;
    if (!s) return;
    s.index += 1;
    s.revealed = false;
    s.feedback = null;
    s.needsContinue = false;
    s.mode = null;
    s.optsCache = null;
    s.optsKey = null;
    if (s.index >= s.queue.length) {
      state.lastAnswers = s.answers.slice();
      state.doneDeckId = s.deckId || (currentEntry() && currentEntry().d) || null;
      state.session = null;
      S.clearDraft();
      go('#/done');
      return;
    }
    saveDraftNow();
    render();
  }

  // ─────────────────────────── 完成頁 ───────────────────────────
  function viewDone() {
    var answers = state.lastAnswers || [];
    var n = answers.length;
    var x = answers.filter(function (a) { return a.correct; }).length;
    var wrong = answers.filter(function (a) { return !a.correct; });
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(t('done.title')) + '</h1>';
    html += '<p class="bigstat" id="done-stats">' + esc(t('done.stats', { x: x, n: n })) + '</p>';
    html += '<div class="toolbar">';
    if (wrong.length) {
      html += '<button type="button" class="btn btn--primary" data-act="again-wrong">' + esc(t('done.againWrong', { n: wrong.length })) + '</button>';
    }
    html += '<button type="button" class="btn btn--ghost" data-act="home">' + esc(t('done.home')) + '</button>';
    html += '</div>';
    html += '<h3 class="sub">' + esc(t('done.wrongList')) + '</h3>';
    if (!wrong.length) {
      html += '<p class="empty">' + esc(t('done.noneWrong')) + '</p>';
    } else {
      html += '<ul class="wronglist" id="wrong-list">';
      wrong.forEach(function (a) {
        var d = S.getDeck(state.db, a.deckId || state.doneDeckId);
        var card = d ? cardById(d, a.cardId) : null;
        html += '<li>' + esc(card ? P.displayFront(card.front) : a.cardId) + '<small>' + esc(card ? card.back : '') + '</small></li>';
      });
      html += '</ul>';
    }
    html += '</section>';
    return html;
  }

  // ─────────────────────────── 設定／貼上／匯入 ───────────────────────────
  function viewSettings() {
    var ai = state.db.settings.ai;
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(t('settings.title')) + '</h1>';
    html += '<label class="field"><span>' + esc(t('settings.key')) + '</span>';
    html += '<input id="key-input" class="input" type="password" autocomplete="off" spellcheck="false" value="' + esc(ai.key) + '" placeholder="sk-…" />';
    html += '<small class="hint hint--soft">' + esc(t('settings.keyHint')) + '</small></label>';
    html += '<button type="button" class="btn btn--primary" data-act="save-key" id="btn-save-key">' + esc(t('settings.save')) + '</button>';
    html += '<p class="meta">' + esc(t('settings.ai', { m: ai.model, cap: ai.dailyPhotoCap })) + '</p>';
    html += '<label class="field"><span>' + esc(t('settings.capLabel')) + '</span>';
    html += '<input id="cap-input" class="input" type="number" min="1" max="500" inputmode="numeric" value="' + esc(String(ai.dailyPhotoCap)) + '" />';
    html += '<small class="hint hint--soft">' + esc(t('settings.capHint')) + '</small></label>';
    html += '<button type="button" class="btn btn--ghost" data-act="save-cap" id="btn-save-cap">' + esc(t('settings.capSave')) + '</button>';
    html += '<p class="privacy">' + esc(t('settings.privacy')) + '</p>';
    html += '<h3 class="sub">' + esc(t('settings.voice')) + '</h3>';
    html += '<label class="check"><input id="autoread-input" type="checkbox" data-act="toggle-autoread"' + (state.db.settings.autoRead ? ' checked' : '') + ' /> <span>' + esc(t('settings.autoRead')) + '</span></label>';
    html += '<h3 class="sub">' + esc(t('settings.data')) + '</h3>';
    html += '<div class="toolbar">';
    html += '<button type="button" class="btn btn--ghost" data-act="export">' + esc(t('home.export')) + '</button>';
    html += '<button type="button" class="btn btn--ghost" data-act="import">' + esc(t('home.import')) + '</button>';
    html += '<button type="button" class="btn btn--ghost" data-act="paste">' + esc(t('home.paste')) + '</button>';
    html += '</div>';
    html += '<div class="toolbar"><button type="button" class="btn btn--danger" data-act="clear-all">' + esc(t('settings.clear')) + '</button></div>';
    html += '</section>';
    return html;
  }

  function viewPaste() {
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(t('paste.title')) + '</h1>';
    html += '<p class="hint">' + esc(t('paste.hint')) + '</p>';
    html += '<textarea id="paste-input" class="textarea" rows="8" placeholder="' + esc(t('paste.placeholder')) + '"></textarea>';
    html += '<button type="button" class="btn btn--primary btn--wide" data-act="paste-build" id="btn-paste-build">' + esc(t('paste.build')) + '</button>';
    html += '</section>';
    return html;
  }

  function viewImport() {
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(t('import.title')) + '</h1>';
    html += '<input id="import-file" class="input" type="file" accept="application/json,.json" />';
    html += '<button type="button" class="btn btn--ghost btn--wide" data-act="home">' + esc(t('nav.back')) + '</button>';
    html += '</section>';
    return html;
  }

  // ─────────────────────────── render ───────────────────────────
  function currentView() {
    var r = state.route;
    switch (r.name) {
      case 'home': return viewHome();
      case 'photo': return viewPhoto();
      case 'analyze': return viewAnalyze();
      case 'understand': return viewUnderstand();
      case 'confirm': return viewConfirm();
      case 'deck': return viewDeck(r.id);
      case 'print': return viewPrint(r.id);
      case 'map': return viewMap();
      case 'map-preview': return viewMap();
      case 'practice': return viewPractice();
    case 'vocab-practice': return viewVocabPractice();
      case 'done': return viewDone();
      case 'settings': return viewSettings();
      case 'paste': return viewPaste();
      case 'import': return viewImport();
      default: return viewHome();
    }
  }

  function render() {
    var view = document.getElementById('view');
    if (!view) return;
    view.innerHTML = currentView();
    // P14：英文詞語聽寫 —— 自動聚焦，Enter 直接對答案
    var vInput = document.getElementById('vocab-input');
    if (vInput) {
      try { vInput.focus(); } catch (e) {}
      vInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault();
          doAction('vocab-check', vInput);
        }
      });
    }
    var backBtn = document.getElementById('btn-back');
    if (backBtn) backBtn.hidden = state.route.name === 'home';
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      var on = b.getAttribute('data-lang') === state.lang;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-on', on);
    });
    if (state.route.name === 'map' || state.route.name === 'map-preview') {
      requestAnimationFrame(drawMapLines);
      setTimeout(drawMapLines, 60);
    }
    var toastEl = document.getElementById('toast');
    if (toastEl) {
      toastEl.textContent = state.toast || '';
      toastEl.hidden = !state.toast;
    }
    autoSpeakCurrent();
  }

  // ── P9 朗讀（本機 speechSynthesis，零第三方；冇語音就靜靜唔做）──
  function hasSpeech() {
    return typeof window !== 'undefined' && !!window.speechSynthesis && !!window.SpeechSynthesisUtterance;
  }

  function isCJKText(text) {
    return /[\u3400-\u9fff]/.test(String(text || ''));
  }

  /** 讀一段文字：中文 zh-HK、英文 en-US；每次先 cancel 上一次，唔會疊聲。 */
  function speakText(text) {
    var txt = String(text == null ? '' : text).replace(/＿+/g, ' ').trim();
    if (!txt) return false;
    if (!hasSpeech()) {
      toast(t('practice.noSpeech'));
      return false;
    }
    try {
      var u = new window.SpeechSynthesisUtterance(txt);
      var cjk = isCJKText(txt);
      u.lang = cjk ? 'zh-HK' : 'en-US';
      u.rate = cjk ? 0.85 : 0.75;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      state.lastSpoken = { text: txt, lang: u.lang, rate: u.rate };
      return true;
    } catch (e) {
      return false;
    }
  }

  /** 自動讀新卡題目：同一個 index 只讀一次（揭示答案都唔會重讀）。 */
  function autoSpeakCurrent() {
    if (!state.session || !state.db || !state.db.settings.autoRead) return;
    if (!hasSpeech()) return;
    var entry = currentEntry();
    var card = entryCard(entry);
    if (!card) return;
    var key = (state.session.deckId || '') + '|' + card.id + '|' + state.session.index;
    if (state.spokeKey === key) return;
    state.spokeKey = key;
    speakText(P.displayFront(card.front));
  }

  function go(hash) {
    state.sourceOpen = false;
    state.sourceView = 'auto';
    if (location.hash === hash) { 
      routeFromHash();
      render();
      return;
    }
    location.hash = hash;
  }

  // ── P13：詞語生字卡（純文字，跟卡組一齊存；中文書面解釋＋應用範例＋朗讀）──
  function vocabHtml(list) {
    var items = Ai.sanitizeVocabulary(list);
    if (!items.length) return '';
    var html = '';
    html += '<section class="vocab" id="vocab">';
    html += '<h3 class="sub">' + esc(t('vocab.title', { n: items.length })) + '</h3>';
    html += '<ul class="vocab__list">';
    items.forEach(function (v) {
      html += '<li class="vocab__item" data-vocab="' + esc(v.id) + '" data-lang="' + esc(v.lang) + '">';
      html += '<div class="vocab__head">';
      html += '<strong class="vocab__word" lang="' + (v.lang === 'en' ? 'en' : 'zh-HK') + '">' + esc(v.word) + '</strong>';
      html += '<span class="vocab__lang">' + esc(t('vocab.lang.' + v.lang)) + '</span>';
      html += '<button type="button" class="btn btn--tiny" data-act="say" data-say="' + esc(v.word) + '" aria-label="' + esc(t('vocab.read') + ' ' + v.word) + '">🔊 ' + esc(t('vocab.read')) + '</button>';
      html += '</div>';
      html += '<p class="vocab__meaning">' + esc(v.meaning) + '</p>';
      if (v.example) {
        html += '<p class="vocab__ex">' + esc(t('vocab.example')) + '<span lang="' + (v.lang === 'en' ? 'en' : 'zh-HK') + '">' + esc(v.example) + '</span>';
        html += ' <button type="button" class="btn btn--tiny" data-act="say" data-say="' + esc(v.example) + '" aria-label="' + esc(t('vocab.readEx')) + '">🔊</button>';
        html += '</p>';
      }
      html += '</li>';
    });
    html += '</ul>';
    html += '</section>';
    return html;
  }

  // ─────────────────────────── P4：原文面板 ───────────────────────────
  /** 由 deck.source 取顯示用原文（sanitize 之後補返 AI 整理版 clean）。 */
  function sourceOf(deck) {
    var raw = deck && deck.source;
    var base = Ai.sanitizeSource(raw);
    if (!base) return null;
    base.clean = raw && typeof raw.clean === 'string' && raw.clean.trim() ? raw.clean : '';
    return base;
  }

  /**
   * 卡組原文面板：有 source 先出「📄 原文」掣；面板默認收起。
   * P6：未整理時有「✨ AI 整理原文」掣（撳先 call）；整理完可以「睇原文／睇整理後」切換。
   * 內容用 esc() 逐字轉義；格式交 Ai.formatSourceText（分段＋去殘骸）。
   */
  function sourcePanelHtml(deck) {
    var src = sourceOf(deck);
    if (!src) return '';
    var showClean = !!src.clean && state.sourceView !== 'raw';
    var bodyText = showClean ? src.clean : src.text;
    var html = '';
    html += '<div class="toolbar toolbar--tight"><button type="button" class="btn btn--ghost" id="btn-source" data-act="toggle-source" aria-expanded="' + (state.sourceOpen ? 'true' : 'false') + '" aria-controls="source-panel">' + esc(t('source.open')) + '</button>';
    if (src.clean) {
      html += '<button type="button" class="btn btn--tiny" id="btn-source-view" data-act="source-view">' + esc(t(showClean ? 'source.rawView' : 'source.cleanView')) + '</button>';
    } else if (state.sourceBusy) {
      html += '<span class="meta" id="source-busy">' + esc(t('source.cleaning')) + '</span>';
    } else {
      html += '<button type="button" class="btn btn--tiny" id="btn-clean-source" data-act="clean-source" data-id="' + esc(deck.id) + '">' + esc(t('source.clean')) + '</button>';
    }
    html += '</div>';
    if (state.sourceOpen) {
      html += '<section class="srcpanel" id="source-panel" aria-label="' + esc(t('source.title')) + '">';
      html += '<div class="srcpanel__head"><h3 class="srcpanel__title">' + esc(t(showClean ? 'source.cleanTitle' : 'source.title')) + '</h3>';
      html += '<button type="button" class="btn btn--tiny btn--ghost" id="btn-source-close" data-act="toggle-source">' + esc(t('common.close')) + '</button></div>';
      html += '<div class="srcpanel__body" id="source-text">' + esc(Ai.formatSourceText(bodyText)) + '</div>';
      html += '<p class="hint hint--soft">' + esc(t('source.local')) + '</p>';
      html += '</section>';
    }
    return html;
  }

  /**
   * P6：叫 AI 整理原文（用戶撳掣先 call；一次文字 call，冇相片、唔扣每日相片上限）。
   * 成功 → 存 deck.source.clean（原文 source.text 照留），自動開面板顯示整理後。
   * 失敗／整理後太短（<30%）→ 保留原文，只出 toast。
   */
  async function cleanSource(deck) {
    if (!deck || !deck.source) return;
    var key = String(state.db.settings.ai.key || '').trim();
    if (!key) { toast(t('toast.notEnabled')); return; }
    if (state.sourceBusy) return;
    state.sourceBusy = true;
    state.sourceOpen = true;
    render();
    var resp = null;
    try {
      resp = await fetchWithTimeout(Ai.CHAT_URL, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(Ai.buildSourceCleanBody(deck.source.text)),
      }, CHAT_TIMEOUT, null);
    } catch (e) {
      state.sourceBusy = false;
      render();
      toast(t('source.cleanFail'));
      return;
    }
    state.sourceBusy = false;
    if (!resp.ok) { render(); toast(t('source.cleanFail')); return; }
    var data = null;
    try { data = await resp.json(); } catch (e) { data = null; }
    var choice = data && data.choices && data.choices[0];
    var content = Ai.messageText(choice && choice.message);
    var finish = (choice && choice.finish_reason) || '';
    var res = Ai.validateSourceClean(content, { original: deck.source.text });
    if (finish === 'length' || !res.ok) {
      toast(!res.ok && res.errors && res.errors[0] === 'clean_too_short' ? t('source.cleanShort') : t('source.cleanFail'));
      return;
    }
    deck.source.clean = res.clean;
    deck.source.cleanAt = now();
    S.save(state.db);
    state.sourceView = 'clean';
    toast(t('source.cleanDone'));
    render();
  }

  function routeFromHash() {
    var raw = (location.hash || '#/home').replace(/^#\/?/, '');
    var parts = raw.split('/');
    var name = parts[0] || 'home';
    var id = parts[1] || null;
    var known = ['home', 'photo', 'analyze', 'understand', 'confirm', 'deck', 'map', 'map-preview', 'practice', 'done', 'settings', 'paste', 'import', 'vocab-practice', 'print'];
    if (known.indexOf(name) < 0) name = 'home';
    state.route = { name: name, id: id ? decodeURIComponent(id) : null };
    if (name === 'home' || name === 'photo') {
      if (name === 'photo' && state.photo) {
        // 重入影相頁保留預覽
      }
    }
  }

  // ─────────────────────────── 分析流程 ───────────────────────────
  function setStep(name, value) {
    state.analyze.steps[name] = value;
    state.analyze.step = name;
    render();
  }

  function fetchWithTimeout(url, opts, ms, runCtrl) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    if (runCtrl) {
      if (runCtrl.signal.aborted) ctrl.abort();
      else runCtrl.signal.addEventListener('abort', function () { ctrl.abort(); });
    }
    var o = Object.assign({}, opts, { signal: ctrl.signal });
    return fetch(url, o).finally(function () { clearTimeout(timer); });
  }

  function authHeaders(extra) {
    return Object.assign({ Authorization: 'Bearer ' + state.db.settings.ai.key }, extra || {});
  }

  function apiError(status, err) {
    var code = Ai.errorCode(status, err);
    return { code: code, status: status, detail: err && err.message ? String(err.message).slice(0, 200) : '' };
  }

  function fail(code, gateCode, vars, diag) {
    state.error = { code: code, gate: gateCode || null, vars: vars || {}, diag: diag || '' };
    // P18：只把「進行中」嗰步標紅。配額／key 呢類前置失敗發生喺 OCR 之前，
    //      舊寫法用 state.analyze.step（可能仍係上一次嘅 compress）→ 明明壓縮成功都顯示 ✗ 失敗。
    var steps = state.analyze.steps || {};
    Object.keys(steps).forEach(function (k) {
      if (steps[k] === 'active') steps[k] = 'error';
    });
    render();
  }

  /**
   * P2.0：快取 key＝所有壓縮後 JPEG bytes 按次序串接後嘅 SHA-256。
   * 單張時等於該張 bytes 嘅 SHA-256（同 P1.1 逐字兼容）；任何一張唔同／次序調換 → key 都唔同。
   */
  async function photosHash() {
    var list = photoList();
    if (!list.length) return '';
    try {
      var bufs = [];
      for (var i = 0; i < list.length; i++) {
        var blob = list[i].blob;
        if (!blob || !blob.arrayBuffer) return '';
        bufs.push(new Uint8Array(await blob.arrayBuffer()));
      }
      return await Ai.photoSetHash(bufs);
    } catch (e) {
      return ''; // 冇 crypto.subtle 就當冇快取，唔會阻流程
    }
  }

  /** 讀 24 小時同相快取；命中回 analysis value，否則 null。 */
  function cacheLookup(hash) {
    if (!hash) return null;
    var raw = S.readAiCache();
    var res = Ai.cacheGet(raw, hash, now());
    if (res.text && res.text !== raw) S.writeAiCache(res.text); // touch／清過期／清壞資料
    return res.status === 'hit' ? res.value : null;
  }

  /** 分析成功（已過 ai.js 本機驗證）之後才寫快取；只寫文字分析，冇相片。 */
  function cacheSave(hash, analysis) {
    if (!hash || !analysis || !analysis.classification) return;
    var value = {
      classification: analysis.classification,
      topic: analysis.topic,
      taxonomy: analysis.classification.taxonomy,
      knowledgePoints: analysis.knowledgePoints,
      cards: analysis.cards,
      ocr: analysis.ocr || null,
      // P4 A：快取都存原文（純文字）；命中先有原文睇。舊 entry 冇 source 照樣命中。
      source: analysis.source || null,
    };
    var raw = S.readAiCache();
    var next = Ai.cachePut(raw, hash, value, now());
    if (next && next !== raw) S.writeAiCache(next);
  }

  /** 一次 OCR 呼叫：回 {ok, payload} 或 {ok:false, code}。 */
  async function ocrOnce(blob, filename, runCtrl) {
    var form = new FormData();
    form.append('purpose', 'text_recognition');
    form.append('file', blob, filename);
    var resp;
    try {
      resp = await fetchWithTimeout(Ai.OCR_URL, { method: 'POST', headers: authHeaders(), body: form }, OCR_TIMEOUT, runCtrl);
    } catch (e) {
      return { ok: false, code: e && e.name === 'AbortError' ? 'timeout' : 'network' };
    }
    if (!resp.ok) return { ok: false, code: apiError(resp.status).code };
    var bodyText = '';
    try { bodyText = await resp.text(); } catch (e) { return { ok: false, code: 'network' }; }
    var payload = Ai.parseEnvelope(bodyText);
    if (!payload) return { ok: false, code: 'not_json' };
    return { ok: true, payload: payload };
  }

  /** P15：OCR 回空內容（0 字）——唔係圖冇字，通常係一次失手；呢種情況先自動重試，仍然空才報錯。 */
  function isOcrEmpty(gate) {
    if (!gate || gate.ok) return false;
    if (gate.code !== 'too_few_chars' && gate.code !== 'no_text') return false;
    return (Number(gate.stats && gate.stats.chars) || 0) === 0;
  }

  function gateVars(gate) {
    var vars = {};
    if (gate && gate.stats && typeof gate.stats.chars === 'number') vars.n = gate.stats.chars;
    if (gate && gate.stats && typeof gate.stats.garbage === 'number') vars.p = Math.round(gate.stats.garbage * 100);
    return vars;
  }

  function mergeVars(a, b) {
    var out = {};
    var k;
    for (k in a || {}) if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k];
    for (k in b || {}) if (Object.prototype.hasOwnProperty.call(b, k)) out[k] = b[k];
    return out;
  }

  async function runAnalysis(opts) {
    state.error = null;
    if (!(opts && opts.force)) state.quotaGate = null;
    state.ocr = null;
    state.analysis = null;
    state.confirm = {};
    state.editCardId = null;
    state.editKpId = null;
    state.newKp = false;
    state.kpPick = {};
    // 每次分析一條獨立 AbortController + run token：取消真 abort，舊 response 亦唔會再推進。
    var runCtrl = new AbortController();
    state.abort = runCtrl;
    var token = (state.runToken = (state.runToken || 0) + 1);
    function stale() { return state.runToken !== token || runCtrl.signal.aborted; }
    state.analyze.steps = { compress: 'active', ocr: 'idle', understand: 'idle', cards: 'idle' };
    state.analyze.batch = null;
    state.analyze.photoAt = null;
    state.route = { name: 'analyze', id: null };
    if (location.hash !== '#/analyze') location.hash = '#/analyze';
    else render();
    if (!photoList().length) { fail('unknown'); return; }
    var photos = photoList().slice();
    var photoN = photos.length;
    var key = String(state.db.settings.ai.key || '').trim();
    if (!key) { fail('auth'); return; }

    // 1) 壓縮（揀相時已做，呢度只係確認）
    setStep('compress', 'done');

    // P1.1：同一張相 24 小時內用本機快取（設計 §7.6／§18.9）
    // P2.0：key＝所有相片壓縮後 JPEG bytes 串接嘅 SHA-256（單張時同 P1.1 一樣）。
    // 命中就零 OCR／零對話，亦唔扣每日相片上限。
    var hash = await photosHash();
    if (stale()) return;
    var cachedValue = cacheLookup(hash);
    if (cachedValue) {
      state.analysis = cachedValue;
      state.analysis.cached = true;
      state.ocr = null;
      state.confirm = {};
      state.analysis.cards.forEach(function (c) { state.confirm[c.id] = true; });
      state.analyze.steps = { compress: 'done', ocr: 'skipped', understand: 'skipped', cards: 'done' };
      S.clearDraft();
      state.abort = null;
      state.route = { name: 'confirm', id: null };
      go('#/confirm');
      return;
    }
    var cap = S.photoCap(state.db, now());
    // P19：每日上限改成「軟上限」——超出唔再硬攔，改為喺分析頁要一次明確確認（防呆但唔阻你做正事）。
    if (photoN > cap.remaining && !(opts && opts.force)) {
      state.quotaGate = { n: photoN, used: cap.used, cap: cap.cap, over: photoN - cap.remaining };
      state.analyze.steps = { compress: 'done', ocr: 'idle', understand: 'idle', cards: 'idle' };
      state.analyze.step = 'compress';
      render();
      return;
    }
    state.quotaGate = null;

    // 2) 逐張 OCR（保留頁序；任何一張失敗都指出第幾張、唔入快取）
    var plan = Ai.planBatches(photoN, Ai.PHOTO_BATCH);
    var mergedPages = [];
    var photoPages = [];
    var perPhoto = [];
    var splitAny = false;
    var charsTotal = 0;
    setStep('ocr', 'active');
    for (var pi = 0; pi < photoN; pi++) {
      state.analyze.photoAt = { i: pi + 1, n: photoN };
      if (state.route.name === 'analyze') render();
      var photo = photos[pi];
      var photoVars = { photo: pi + 1, total: photoN };
      var one = await ocrOnce(photo.blob, 'page-' + (pi + 1) + '.jpg', runCtrl);
      if (stale()) return;
      if (!one.ok) { state.analyze.steps.ocr = 'error'; return fail(one.code, null, photoVars); }
      var pages = P.cleanPages(P.parseOcrPayload(one.payload));
      var gate = P.qualityGate(pages);
      // P15：空內容先自動重試一次（同一張相、同一份 bytes；每日配額唔會再扣）
      if (isOcrEmpty(gate)) {
        var retryOne = await ocrOnce(photo.blob, 'page-' + (pi + 1) + '-retry.jpg', runCtrl);
        if (stale()) return;
        if (retryOne.ok) {
          var retryPages = P.cleanPages(P.parseOcrPayload(retryOne.payload));
          var retryGate = P.qualityGate(retryPages);
          if (!isOcrEmpty(retryGate)) { pages = retryPages; gate = retryGate; }
        }
        if (isOcrEmpty(gate)) {
          state.analyze.steps.ocr = 'error';
          return fail('ocr_empty', 'ocr_empty', photoVars);
        }
      }
      var split = false;
      if (!gate.ok && gate.code === 'truncated') {
        // 跨頁大圖：OCR 輸出被截斷 → 自動沿長邊切兩半、逐半再 OCR。
        // 仍然係同一張相（配額只扣 1、快取 key 不變）。
        try {
          var halves = await Ai.splitInHalf(photo.blob);
          var merged = [];
          for (var hi = 0; hi < halves.length; hi++) {
            var halfRes = await ocrOnce(halves[hi].blob, 'page-' + (pi + 1) + '-' + (hi + 1) + '.jpg', runCtrl);
            if (stale()) return;
            if (!halfRes.ok) { state.analyze.steps.ocr = 'error'; return fail(halfRes.code, null, photoVars); }
            var halfPages = P.cleanPages(P.parseOcrPayload(halfRes.payload));
            var halfGate = P.qualityGate(halfPages);
            if (!halfGate.ok) {
              state.analyze.steps.ocr = 'error';
              return fail('gate.' + halfGate.code, halfGate.code, mergeVars(gateVars(halfGate), photoVars));
            }
            merged = merged.concat(halfPages);
          }
          pages = P.cleanPages(merged);
          gate = P.qualityGate(pages);
          split = true;
        } catch (e) {
          // 切圖失敗就照原本嘅截斷提示
        }
      }
      if (!gate.ok) {
        state.analyze.steps.ocr = 'error';
        return fail('gate.' + gate.code, gate.code, mergeVars(gateVars(gate), photoVars));
      }
      charsTotal += Number(gate.stats && gate.stats.chars) || 0;
      if (split) splitAny = true;
      perPhoto.push({ index: pi + 1, pages: pages.length, chars: gate.stats.chars, quality: gate.code, split: split });
      photoPages.push(pages);
      mergedPages = mergedPages.concat(pages);
    }
    state.analyze.photoAt = null;

    var allPages = P.cleanPages(mergedPages);
    var mergedGate = P.qualityGate(allPages);
    if (!mergedGate.ok) {
      state.analyze.steps.ocr = 'error';
      return fail('gate.' + mergedGate.code, mergedGate.code, mergeVars(gateVars(mergedGate), { total: photoN }));
    }
    // 批次文字只係「切開原文」，用嚟分批出卡；知識點由整份理解決定（P12.2）
    var batchPagesList = plan.map(function (seg) {
      var arr = [];
      for (var k = seg.from; k < seg.to; k++) arr = arr.concat(photoPages[k] || []);
      return P.cleanPages(arr);
    });
    for (var bgi = 0; bgi < batchPagesList.length; bgi++) {
      var bGate = P.qualityGate(batchPagesList[bgi]);
      if (!bGate.ok) {
        state.analyze.steps.ocr = 'error';
        return fail('gate.' + bGate.code, bGate.code, mergeVars(gateVars(bGate), { total: photoN }));
      }
    }
    var batchTexts = batchPagesList.map(function (list) { return P.cleanText(list); });
    var ocrText = P.cleanText(allPages);
    state.ocr = {
      pages: allPages,
      text: ocrText,
      gate: mergedGate,
      raw: null,
      split: splitAny,
      photos: perPhoto,
      count: photoN,
      batches: batchTexts,
      batchPlan: plan,
    };
    S.markPhotoUsed(state.db, now(), photoN);
    setStep('ocr', 'done');

    var failValidate = function (validated, text, diag, vars) {
      state.analyze.steps.understand = 'error';
      var errKey = validated.aiError ? 'err.ai_' + validated.aiError : 'err.' + ((validated.errors && validated.errors[0]) || 'unknown');
      if (!DICT[errKey]) errKey = 'err.not_json';
      state.error = { code: errKey.replace('err.', ''), vars: vars || {} };
      return fail(state.error.code, null, vars || {}, diag || ('JSON 解析失敗 · 開頭：' + String(text || '').slice(0, 100)));
    };

    // 單批（≤ Ai.PHOTO_BATCH 張）：維持一次過理解＋出卡（同舊行為／舊成本一樣）
    if (plan.length === 1) {
      setStep('understand', 'active');
      var result = await callChat(Ai.buildChatBody(ocrText), key, runCtrl);
      if (stale()) return;
      // P16：envelope 唔係 JSON（HTTP 200 但 body 壞）→ 自動重試一次（同一個 body）
      if (!result.ok && result.code === 'not_json') {
        var envRetry = await callChat(Ai.buildChatBody(ocrText), key, runCtrl);
        if (stale()) return;
        result = envRetry;
      }
      if (!result.ok) {
        state.analyze.steps.understand = 'error';
        return fail(result.code, null, result.vars, result.diag);
      }
      var validated = Ai.validateResult(result.text, { ocrText: ocrText });
      var lastText = result.text;
      var lastDiag = result.diag;
      if (!validated.ok && !validated.aiError) {
        var retry = await callChat(Ai.buildChatBody(ocrText, { retry: true }), key, runCtrl);
        if (stale()) return;
        if (retry.ok) {
          validated = Ai.validateResult(retry.text, { ocrText: ocrText });
          lastText = retry.text;
          lastDiag = retry.diag;
        } else if (retry.diag) {
          lastDiag = retry.diag;
        }
      }
      if (stale()) return;
      if (!validated.ok) return failValidate(validated, lastText, lastDiag, null);
      setStep('understand', 'done');
      setStep('cards', 'active');
      // P17：本地合併重複知識點／重複問題（AI 會把同一概念拆成幾個）
      var singleValue = Ai.mergeDuplicateKps(validated.value);
      state.analysis = {
        classification: validated.value.classification,
        topic: validated.value.topic,
        taxonomy: validated.value.taxonomy,
        knowledgePoints: singleValue.knowledgePoints,
        cards: singleValue.cards,
        vocabulary: validated.value.vocabulary || [],
        cleanSource: validated.value.cleanSource,
      };
    } else {
      // 多批（4–8 張）：① 一次過理解整份教材（知識點數量由內容決定，唔關批次事）
      setStep('understand', 'active');
      var undBody = Ai.buildChatBody(ocrText, { understand: true });
      var und = await callChat(undBody, key, runCtrl);
      if (stale()) return;
      if (!und.ok && und.code === 'not_json') {
        var undEnvRetry = await callChat(undBody, key, runCtrl);
        if (stale()) return;
        und = undEnvRetry;
      }
      if (!und.ok) {
        state.analyze.steps.understand = 'error';
        return fail(und.code, null, und.vars, und.diag);
      }
      var uv = Ai.validateResult(und.text, { ocrText: ocrText, requireCards: false });
      var undText = und.text;
      var undDiag = und.diag;
      if (!uv.ok && !uv.aiError) {
        var undRetry = await callChat(Ai.buildChatBody(ocrText, { understand: true, retry: true }), key, runCtrl);
        if (stale()) return;
        if (undRetry.ok) {
          uv = Ai.validateResult(undRetry.text, { ocrText: ocrText, requireCards: false });
          undText = undRetry.text;
          undDiag = undRetry.diag;
        } else if (undRetry.diag) {
          undDiag = undRetry.diag;
        }
      }
      if (stale()) return;
      if (!uv.ok) return failValidate(uv, undText, undDiag, { total: photoN });
      var kps = uv.value.knowledgePoints;
      setStep('understand', 'done');

      // ② 逐批只出卡（用同一份知識點清單；卡數預算逐批遞減）
      setStep('cards', 'active');
      var cardLists = [];
      var budget = Ai.MAX_CARDS;
      var cardFail = null;
      for (var bi = 0; bi < plan.length; bi++) {
        var seg = plan[bi];
        state.analyze.batch = { i: bi + 1, n: plan.length, from: seg.from + 1, to: seg.to };
        if (state.route.name === 'analyze') render();
        var opts = {
          regen: true,
          classification: uv.value.classification,
          topic: uv.value.topic,
          taxonomy: uv.value.taxonomy,
          knowledgePoints: kps,
          batch: { i: bi + 1, n: plan.length, from: seg.from + 1, to: seg.to },
          maxCards: budget,
          textMax: 12000,
        };
        var cr = await callChat(Ai.buildChatBody(batchTexts[bi], opts), key, runCtrl);
        if (stale()) return;
        if (!cr.ok && cr.code === 'not_json') {
          var crRetry = await callChat(Ai.buildChatBody(batchTexts[bi], opts), key, runCtrl);
          if (stale()) return;
          cr = crRetry;
        }
        if (!cr.ok) { cardFail = { code: cr.code, vars: cr.vars, diag: cr.diag }; break; }
        var cv = Ai.validateResult(cr.text, { ocrText: batchTexts[bi] });
        var got = cv.ok ? cv.value.cards : null;
        if (!got) {
          // 只回 cards 嘅回覆用寬鬆驗證（同 P1.1 重出卡一樣）
          var loose = Ai.parseJsonLoose(cr.text);
          got = loose && Array.isArray(loose.cards) ? validateCardsOnly(loose.cards, kps, uv.value.taxonomy) : null;
        }
        if (!got || !got.length) {
          cardFail = { code: 'no_cards', diag: cv.diag || '' };
          break;
        }
        cardLists.push(got);
        budget = Math.max(4, budget - got.length);
      }
      state.analyze.batch = null;
      if (cardFail) {
        state.analyze.steps.cards = 'error';
        return fail(cardFail.code || 'no_cards', null, null, cardFail.diag);
      }
      var mergedCards = Ai.mergeCardSets(cardLists);
      if (!mergedCards.ok) {
        state.analyze.steps.cards = 'error';
        return fail('no_cards');
      }
      // P17：合併重複知識點（同標籤）＋同一問題只留一張卡＋冇卡知識點丟走
      var packed = Ai.mergeDuplicateKps({ knowledgePoints: kps, cards: mergedCards.cards });
      kps = packed.knowledgePoints;
      mergedCards = { cards: packed.cards };
      var kpById = Object.create(null);
      kps.forEach(function (kp) { kpById[kp.id] = kp; });
      state.analysis = {
        classification: uv.value.classification,
        topic: uv.value.topic,
        taxonomy: uv.value.taxonomy,
        knowledgePoints: kps,
        vocabulary: uv.value.vocabulary || [],
        cards: mergedCards.cards.map(function (c) {
          var kp = kpById[c.kpId];
          if (kp) c.category = kp.category;
          return c;
        }),
        cleanSource: uv.value.cleanSource,
      };
      var trimmed = trimNotes(mergedCards.notes);
      if (trimmed.cards) state.analysis.trimmed = trimmed;
    }
    state.confirm = {};
    state.analysis.cards.forEach(function (c) { state.confirm[c.id] = true; });
    state.analysis.ocr = { pages: allPages.length, chars: charsTotal, quality: mergedGate.code, photos: photoN, batches: plan.length };
    // P4 A：由整份 OCR 原文砌卡組 source（純文字；已經過品質閘同本機驗證）
    state.analysis.source = Ai.sanitizeSource({ text: ocrText, pages: allPages.length, chars: charsTotal, at: now() });
    // P7：理解 call 已回咗「整理後原文」→ 存喺 source.clean（原文 source.text 照留，可切換）
    var cleanSource = state.analysis.cleanSource || '';
    if (state.analysis.source && cleanSource) state.analysis.source.clean = cleanSource;
    delete state.analysis.cleanSource;
    // 驗證已過、分析已成形 → 先寫快取（任何失敗都行唔到呢一步）
    cacheSave(hash, state.analysis);
    S.clearDraft();
    state.abort = null;
    state.analyze.batch = null;
    setStep('cards', 'done');
    state.route = { name: 'confirm', id: null };
    go('#/confirm');
  }

  async function callChat(body, key, runCtrl) {
    var resp;
    try {
      resp = await fetchWithTimeout(Ai.CHAT_URL, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      }, CHAT_TIMEOUT, runCtrl);
    } catch (e) {
      return { ok: false, code: e && e.name === 'AbortError' ? 'timeout' : 'network' };
    }
    if (!resp.ok) return { ok: false, code: apiError(resp.status).code, diag: 'HTTP ' + resp.status };
    // P16：HTTP 200 都可能唔係 JSON（代理 HTML／空 body／SSE）——先讀 text，再容錯解析；
    //      失敗時把「收到幾長、開頭係咩」寫入技術詳情，唔再只講一句「唔係 JSON」。
    var bodyText = '';
    try { bodyText = await resp.text(); } catch (e) { return { ok: false, code: 'network' }; }
    var data = Ai.parseEnvelope(bodyText);
    if (!data) {
      return {
        ok: false,
        code: 'not_json',
        diag: 'HTTP ' + resp.status + ' · body 長度=' + bodyText.length + ' · 開頭=' + String(bodyText).slice(0, 80).replace(/\s+/g, ' '),
      };
    }
    var choice = data && data.choices && data.choices[0];
    var msg = choice && choice.message;
    // content 可能係字串、多段陣列，或者 thinking model 只填 reasoning_content
    var content = Ai.messageText(msg);
    var finish = (choice && choice.finish_reason) || '';
    var rLen = msg && typeof msg.reasoning_content === 'string' ? msg.reasoning_content.length : 0;
    var diag = 'finish=' + (finish || '?') + ' · 字數=' + (content ? content.length : 0) + ' · reasoning=' + rLen;
    if (finish === 'length') {
      // 內容被截斷：唔好當係「格式錯」，直接叫家長影半頁（真機：thinking 會用晒 token）
      return { ok: false, code: 'truncated_ai', diag: diag };
    }
    if (!content) {
      diag += ' · envelope=' + (data ? Object.keys(data).join('/') : '?');
      return { ok: false, code: 'not_json', diag: diag };
    }
    diag += ' · 開頭=' + content.slice(0, 80).replace(/\s+/g, ' ');
    return { ok: true, text: content, raw: data, diag: diag, finish: finish };
  }

  /** 第二次 call：只回 cards，帶已修正嘅 understanding。 */
  async function regenerateCards() {
    if (!state.analysis) return;
    var key = String(state.db.settings.ai.key || '').trim();
    if (!key) { toast(t('toast.notEnabled')); return; }
    var keep = {};
    document.querySelectorAll('.kp-check').forEach(function (el) {
      keep[el.getAttribute('data-kp')] = el.checked;
    });
    var kps = state.analysis.knowledgePoints.filter(function (kp) { return keep[kp.id] !== false; });
    if (!kps.length) { toast(t('toast.noDeck')); return; }
    var keptIds = {};
    kps.forEach(function (kp) { keptIds[kp.id] = 1; });
    // P12：分批分析過嘅卡組要逐批重出卡，再合併去重（用全份 text 會被 4000 字 slice 剪走後幾頁）
    var ocrPlan = (state.ocr && Array.isArray(state.ocr.batchPlan) && state.ocr.batchPlan.length) ? state.ocr.batchPlan : [];
    var ocrBatches = (state.ocr && Array.isArray(state.ocr.batches) && state.ocr.batches.length) ? state.ocr.batches : [state.ocr ? state.ocr.text : ''];
    function regenBatch(bi) {
      var b = null;
      if (ocrBatches.length > 1) {
        var seg = ocrPlan[bi] || null;
        b = { i: bi + 1, n: ocrBatches.length, from: seg ? seg.from + 1 : 0, to: seg ? seg.to : 0 };
      }
      return b;
    }
    function regenOpts(bi) {
      var o = {
        regen: true,
        classification: state.analysis.classification,
        topic: state.analysis.topic,
        taxonomy: state.analysis.classification.taxonomy,
        knowledgePoints: kps,
      };
      var b = regenBatch(bi);
      if (b) o.batch = b;
      o.textMax = 12000;
      return o;
    }
    state.route = { name: 'analyze', id: null };
    state.analyze.steps = { compress: 'done', ocr: 'done', understand: 'done', cards: 'active' };
    state.toast = '';
    if (location.hash !== '#/analyze') location.hash = '#/analyze';
    else render();
    var rCtrl = new AbortController();
    state.abort = rCtrl;
    var rToken = (state.runToken = (state.runToken || 0) + 1);
    // P12.2：重出卡都係「知識點固定、逐批只出卡」，最後用 mergeCardSets 合併去重
    var cardLists = [];
    for (var bi = 0; bi < ocrBatches.length; bi++) {
      state.analyze.batch = regenBatch(bi);
      if (state.route.name === 'analyze') render();
      var r = await callChat(Ai.buildChatBody(ocrBatches[bi], regenOpts(bi)), key, rCtrl);
      if (state.runToken !== rToken || rCtrl.signal.aborted) return;
      if (!r.ok) { state.analyze.steps.cards = 'error'; state.analyze.batch = null; state.abort = null; return fail(r.code, null, r.vars); }
      var v = Ai.validateResult(r.text);
      // 第二次 call 可能只回 cards：用 validateCardsOnly 補回
      var got = v.ok ? v.value.cards : null;
      if (!got) {
        var loose = Ai.parseJsonLoose(r.text);
        got = loose && Array.isArray(loose.cards) ? validateCardsOnly(loose.cards, kps, state.analysis.classification.taxonomy) : null;
        if (!got) {
          state.analyze.steps.cards = 'error';
          state.analyze.batch = null;
          return fail(v.errors && v.errors[0] ? v.errors[0] : 'not_json');
        }
      }
      cardLists.push(got.filter(function (c) { return keptIds[c.kpId]; }));
    }
    var mergedCards = Ai.mergeCardSets(cardLists);
    if (!mergedCards.ok) {
      state.analyze.steps.cards = 'error';
      state.analyze.batch = null;
      return fail(mergedCards.errors[0] || 'no_cards');
    }
    var packedRegen = Ai.mergeDuplicateKps({ knowledgePoints: kps, cards: mergedCards.cards });
    var value = {
      classification: state.analysis.classification,
      topic: state.analysis.topic,
      taxonomy: state.analysis.classification.taxonomy,
      knowledgePoints: packedRegen.knowledgePoints,
      cards: packedRegen.cards,
      // P13：重出卡只換卡，詞語生字照舊保留
      vocabulary: state.analysis.vocabulary || [],
    };
    // P4 A：重新出卡只換 cards，卡組原文 source 照舊保留（唔會因為 regen 冇咗原文）
    var keptSource = state.analysis.source || null;
    state.analysis = value;
    if (keptSource) state.analysis.source = keptSource;
    state.analysis.cached = false; // 重出卡已經再 call 過模型，唔再算「用快取」
    state.editKpId = null;
    state.newKp = false;
    state.confirm = {};
    value.cards.forEach(function (c) { state.confirm[c.id] = true; });
    state.analyze.steps.cards = 'done';
    state.analyze.batch = null;
    state.abort = null;
    state.route = { name: 'confirm', id: null };
    go('#/confirm');
  }

  function validateCardsOnly(cards, kps, taxonomy) {
    var ids = {};
    kps.forEach(function (kp) { ids[kp.id] = kp; });
    var out = [];
    var seen = {};
    (cards || []).forEach(function (c, i) {
      if (!c || typeof c !== 'object') return;
      var kp = ids[c.kpId];
      if (!kp) return;
      var front = Ai.stripHtml(c.front || '');
      var back = Ai.stripHtml(c.back || '');
      if (!front || !back) return;
      var f = Ai.truncate(front, 60);
      var b = Ai.truncate(back, 120);
      var key = c.kpId + '|' + f.text.toLowerCase();
      if (seen[key]) return;
      seen[key] = 1;
      var type = Ai.CARD_TYPES.indexOf(c.type) >= 0 ? c.type : 'basic';
      if (type === 'cloze' && !/\{\{[^{}]*\}\}/.test(f.text)) return;
      // P4 B：cards-only 重出卡都保留 optional context（≤200 字、去 HTML）
      var ctx = Ai.truncate(Ai.stripHtml(c.context || ''), 200).text;
      var outCard = {
        id: 'c' + (i + 1),
        kpId: c.kpId,
        category: kp.category,
        difficulty: Math.max(1, Math.min(5, Number(c.difficulty) || kp.difficulty || 1)),
        type: type,
        front: f.text,
        back: b.text,
        mnemonic: Ai.truncate(Ai.stripHtml(c.mnemonic || ''), 30).text,
        example: Ai.truncate(Ai.stripHtml(c.example || ''), 80).text,
        uncertain: c.uncertain === true,
      };
      if (ctx) outCard.context = ctx;
      out.push(outCard);
    });
    return out.length ? out : null;
  }

  // ─────────────────────────── 相片 ───────────────────────────
  /**
   * P2.0／P12：相簿可以一次揀最多 8 張（append；相機入口維持單張 → replace）。
   * 逐張壓縮（長邊 2048／JPEG 0.9）＋縮圖；超過 8 張只取頭 8 張並提示。
   */
  async function onFiles(files, opts) {
    var o = opts || {};
    var picked = Array.prototype.slice.call(files || []).filter(Boolean);
    if (!picked.length) return;
    state.error = null;
    state.preflight = null;
    var cur = o.replace ? [] : photoList().slice();
    var max = Ai.MAX_PHOTOS;
    var room = Math.max(0, max - cur.length);
    if (!room) { toast(t('photo.limit', { max: max })); return; }
    if (picked.length > room) toast(t('photo.limit', { max: max }));
    var take = picked.slice(0, room);
    // 上限用純函數再守一次（同 node 單元測試同一把尺：1–8 張才放行）
    if (!Ai.photoCountCheck(cur.length + take.length).ok) return;
    if (o.replace) releasePhotoUrls(photoList().slice());
    var added = [];
    for (var i = 0; i < take.length; i++) {
      var compressed;
      try {
        compressed = await Ai.compressImage(take[i], { maxEdge: Ai.MAX_EDGE, quality: Ai.JPEG_QUALITY, maxBytes: Ai.MAX_BYTES });
      } catch (e) {
        toast(t('toast.imageDecode'));
        continue;
      }
      var photo = {
        blob: compressed.blob,
        width: compressed.width,
        height: compressed.height,
        bytes: compressed.bytes,
        quality: compressed.quality,
        url: URL.createObjectURL(compressed.blob),
        preflight: null,
      };
      cur.push(photo);
      added.push(photo);
    }
    state.photos = cur;
    state.photo = cur.length ? cur[0] : null;
    render();
    // 本機 preflight（太細／矇／反光）：只提示，唔上傳、唔阻擋；逐張各自記住結果
    added.forEach(function (photo) {
      try {
        Ai.preflight(photo.blob).then(function (res) {
          photo.preflight = res;
          state.preflight = (state.photos[0] && state.photos[0].preflight) || null;
          // 只喺影相頁重畫：遲到嘅 preflight 結果唔應該重畫理解／確認頁
          // （會冪走家長未儲存嘅勾選／輸入）。
          if (state.photos.indexOf(photo) >= 0 && state.route.name === 'photo') render();
        }).catch(function () { /* preflight 失敗唔影響主流程 */ });
      } catch (e) { /* 舊瀏覽器 */ }
    });
  }

  /** 逐張移除（P2.0）。移除最後一張 → 影相頁回到未揀相。 */
  /** P18：只保留頭 n 張（配額不足時一鍵縮到剩餘配額），其餘釋放 objectURL。 */
  function trimPhotosTo(n) {
    var list = photoList().slice();
    var keep = Math.max(0, Math.min(list.length, Math.floor(Number(n)) || 0));
    releasePhotoUrls(list.slice(keep));
    state.photos = list.slice(0, keep);
    state.photo = state.photos.length ? state.photos[0] : null;
    state.preflight = state.photo ? state.photo.preflight : null;
  }

  function removePhoto(index) {
    var list = photoList().slice();
    var i = Math.floor(Number(index));
    if (!isFinite(i) || i < 0 || i >= list.length) return;
    var gone = list.splice(i, 1)[0];
    releasePhotoUrls(gone ? [gone] : []);
    state.photos = list;
    state.photo = list.length ? list[0] : null;
    state.preflight = state.photo ? state.photo.preflight : null;
    state.error = null;
    render();
  }

  /**
   * 釋放縮圖 objectURL（只喺確認畫面唔再引用之後）。
   * 立即 revoke 會令仍然掛喺 DOM 嘅 <img> 變成 ERR_FILE_NOT_FOUND，
   * 所以延後少少、而且 revoke 之前再確認一次「已經冇任何相用緊呢條 URL」。
   */
  function releasePhotoUrls(gone) {
    var urls = (gone || []).map(function (p) { return p && p.url; }).filter(Boolean);
    if (!urls.length) return;
    setTimeout(function () {
      var live = photoList().map(function (p) { return p.url; });
      urls.forEach(function (u) {
        if (live.indexOf(u) < 0) { try { URL.revokeObjectURL(u); } catch (e) {} }
      });
    }, 3000);
  }

  // ─────────────────────────── 事件 ───────────────────────────
  function patchAnalysisDeck(allow) {
    var a = state.analysis;
    a.cards = a.cards.filter(function (c) { return allow[c.id] !== false; });
    state.analysis = a;
  }

  function doAction(act, el) {
    switch (act) {
      case 'photo':
      case 'go-photo':
        state.error = null;
        state.quotaGate = null;
        go('#/photo');
        break;
      case 'analyze':
        if (!photoList().length) { toast(t('photo.chooseFirst')); return; }
        if (!String(state.db.settings.ai.key || '').trim()) { toast(t('toast.notEnabled')); return; }
        state.quotaGate = null;
        runAnalysis();
        break;
      case 'analyze-force':
        // P19：用戶明確確認超出軟上限 → 照做
        if (!photoList().length) { toast(t('photo.chooseFirst')); return; }
        state.quotaGate = null;
        runAnalysis({ force: true });
        break;
      case 'retry':
        if (!photoList().length) { go('#/photo'); return; }
        state.quotaGate = null;
        runAnalysis();
        break;
      case 'analyze-first': {
        // P18／P19：用今日剩餘配額分析頭 N 張（其餘相唔會扣配額）
        var left = S.photoCap(state.db, now()).remaining;
        if (left <= 0) { toast(t('toast.quotaNone')); return; }
        state.quotaGate = null;
        trimPhotosTo(left);
        if (!photoList().length) { go('#/photo'); return; }
        state.error = null;
        runAnalysis();
        break;
      }
      case 'save-cap': {
        var capEl = document.getElementById('cap-input');
        var saved = S.setDailyPhotoCap(state.db, capEl ? capEl.value : '');
        toast(t('toast.capSaved', { cap: saved }));
        render();
        break;
      }
      case 'remove-photo':
        removePhoto(el.getAttribute('data-index'));
        break;
      case 'cancel':
        state.runToken = (state.runToken || 0) + 1;
        if (state.abort) {
          try { state.abort.abort(); } catch (e) {}
          state.abort = null;
        }
        state.analyze.steps = { compress: 'idle', ocr: 'idle', understand: 'idle', cards: 'idle' };
        state.error = null;
        state.route = { name: 'photo', id: null };
        go('#/photo');
        break;
      case 'home':
        if (state.session) { saveDraftNow(); state.session = null; }
        go('#/home');
        break;
      case 'settings':
        go('#/settings');
        break;
      case 'today': {
        var tq = todayEntries(state.db);
        if (!tq.length) { toast(t('practice.empty')); return; }
        startPractice(null, 'today', { entries: tq });
        break;
      }
      case 'all': {
        var aq = allEntriesSorted();
        if (!aq.length) { toast(t('practice.empty')); return; }
        startPractice(null, 'all', { entries: aq });
        break;
      }
      case 'tricky': {
        var te = trickyEntries();
        if (te.length < 3) { toast(t('practice.empty')); return; }
        startPractice(null, 'tricky', { entries: te });
        break;
      }
      case 'resume': {
        var draft = S.loadDraft(now());
        if (!draft) { toast(t('practice.empty')); return; }
        var existing = (draft.entries || []).filter(function (e) { return !!entryCard(e); });
        if (!existing.length) { S.clearDraft(); toast(t('practice.empty')); return; }
        state.session = {
          deckId: draft.deckId || null,
          filter: draft.filter || 'all',
          queue: existing,
          index: Math.min(draft.index || 0, existing.length - 1),
          answers: draft.answers || [],
          revealed: false,
          feedback: null,
          mode: null,
        };
        go('#/practice');
        break;
      }
      case 'deck':
        go('#/deck/' + encodeURIComponent(el.getAttribute('data-id')));
        break;
      case 'deck-filter':
        // P3：首頁卡冊分類篩選（'' = 全部）
        state.deckFilter = el.getAttribute('data-cat') || '';
        render();
        break;
      case 'toggle-source':
        // P4：卡組頁／練習頁「📄 原文」面板開／關（唔改 session，練習進度唔會斷）
        state.sourceOpen = !state.sourceOpen;
        render();
        break;
      case 'source-view':
        // P7：原文 ↔ AI 整理後 切換（默認顯示整理後；第一下切去原文）
        state.sourceView = state.sourceView === 'raw' ? 'clean' : 'raw';
        render();
        break;
      case 'clean-source': {
        // P6：用戶撳先叫 AI 整理原文（唔會自動 call／唔會覆蓋原文）
        var srcDeck = S.getDeck(state.db, el.getAttribute('data-id'));
        if (srcDeck) cleanSource(srcDeck);
        break;
      }
      case 'practice':
        startPractice(el.getAttribute('data-id'), 'all');
        break;
      case 'print':
        go('#/print/' + (el.getAttribute('data-id') || ''));
        break;
      case 'print-set':
        state.print.set = el.getAttribute('data-set') === 'vocab' ? 'vocab' : el.getAttribute('data-set') === 'both' ? 'both' : 'cards';
        render();
        break;
      case 'print-size':
        state.print.size = el.getAttribute('data-size') || 'mid';
        render();
        break;
      case 'print-mode':
        state.print.mode = el.getAttribute('data-mode') === 'single' ? 'single' : 'duplex';
        render();
        break;
      case 'print-scope':
        state.print.scope = el.getAttribute('data-scope') === 'unmastered' ? 'unmastered' : 'all';
        render();
        break;
      case 'do-print':
        try { window.print(); } catch (e) {}
        break;
      case 'deck-back':
        go('#/deck/' + (el.getAttribute('data-id') || ''));
        break;
      case 'deck-map':
        state.mapPreviewDeckId = null;
        state.outline = false;
        go('#/map/' + encodeURIComponent(el.getAttribute('data-id')));
        break;
      case 'preview-map':
        state.mapPreviewDeckId = null;
        state.outline = false;
        go('#/map-preview');
        break;
      case 'understand':
        go('#/understand');
        break;
      case 'confirm':
        go('#/confirm');
        break;
      case 'regen':
        regenerateCards();
        break;
      case 'select-all':
        state.analysis.cards.forEach(function (c) { state.confirm[c.id] = true; });
        render();
        break;
      case 'select-none':
        state.analysis.cards.forEach(function (c) { state.confirm[c.id] = false; });
        render();
        break;
      case 'edit-card':
        state.editCardId = el.getAttribute('data-card');
        render();
        break;
      case 'cancel-card':
        state.editCardId = null;
        render();
        break;
      case 'save-card': {
        var cid = el.getAttribute('data-card');
        var cardEdit = null;
        (state.analysis.cards || []).forEach(function (c) { if (c.id === cid) cardEdit = c; });
        if (!cardEdit) return;
        var fe = document.querySelector('.edit-input[data-field="front"][data-card="' + cid + '"]');
        var be = document.querySelector('.edit-input[data-field="back"][data-card="' + cid + '"]');
        var f = Ai.truncate(Ai.stripHtml(fe ? fe.value : ''), 60).text;
        var b = Ai.truncate(Ai.stripHtml(be ? be.value : ''), 120).text;
        if (!f || !b) { toast(t('confirm.editEmpty')); return; }
        cardEdit.front = f;
        cardEdit.back = b;
        cardEdit.edited = true;
        state.editCardId = null;
        render();
        break;
      }
      case 'save-title': {
        var tiEl = document.getElementById('u-title-input');
        var newTitle = Ai.sanitizeTopicTitle(tiEl ? tiEl.value : '');
        if (!newTitle) { toast(t('understand.nameEmpty')); return; }
        if (!state.analysis || !state.analysis.topic) return;
        state.analysis.topic.title = newTitle;
        markEdited();
        toast(t('understand.saved'));
        break;
      }
      case 'edit-kp':
        state.editKpId = el.getAttribute('data-kp');
        state.newKp = false;
        render();
        break;
      case 'cancel-kp':
        state.editKpId = null;
        render();
        break;
      case 'save-kp': {
        var editKpId = el.getAttribute('data-kp');
        var editKp = null;
        (state.analysis.knowledgePoints || []).forEach(function (x) { if (x.id === editKpId) editKp = x; });
        if (!editKp) return;
        var nameEl = document.getElementById('kp-label-input');
        var catEl = document.getElementById('kp-cat-select');
        var diffEl = document.getElementById('kp-diff-select');
        var kpLabel = Ai.sanitizeKpLabel(nameEl ? nameEl.value : '');
        if (!kpLabel) { toast(t('understand.nameEmpty')); return; }
        var taxList = state.analysis.classification.taxonomy || [];
        var kpCat = catEl ? catEl.value : editKp.category;
        if (taxList.indexOf(kpCat) < 0) kpCat = editKp.category; // 下拉只可揀 taxonomy 內；再守一層
        var kpRes = Ai.updateKp(state.analysis, editKpId, {
          label: kpLabel,
          category: kpCat,
          difficulty: diffEl ? diffEl.value : editKp.difficulty,
        });
        if (!kpRes.ok) { toast(t('understand.nameEmpty')); return; }
        state.analysis.knowledgePoints = kpRes.knowledgePoints;
        state.analysis.cards = kpRes.cards;
        state.editKpId = null;
        markEdited();
        toast(t('understand.saved'));
        break;
      }
      case 'delete-kp': {
        var delKpId = el.getAttribute('data-kp');
        var delRes = Ai.deleteKp(state.analysis, delKpId);
        state.analysis.knowledgePoints = delRes.knowledgePoints;
        state.analysis.cards = delRes.cards;
        state.editKpId = null;
        markEdited();
        toast(t('understand.saved'));
        break;
      }
      case 'add-kp':
        state.newKp = true;
        state.editKpId = null;
        render();
        break;
      case 'cancel-new-kp':
        state.newKp = false;
        render();
        break;
      case 'save-new-kp': {
        var newNameEl = document.getElementById('newkp-label-input');
        var newCatEl = document.getElementById('newkp-cat-select');
        var newDiffEl = document.getElementById('newkp-diff-select');
        var newLabel = Ai.sanitizeKpLabel(newNameEl ? newNameEl.value : '');
        if (!newLabel) { toast(t('understand.nameEmpty')); return; }
        var aNew = state.analysis;
        var taxNow = aNew.classification.taxonomy || ['定義'];
        var newCat = newCatEl ? newCatEl.value : taxNow[0];
        if (taxNow.indexOf(newCat) < 0) newCat = taxNow[0];
        var newRes = Ai.addKp(aNew, {
          label: newLabel,
          category: newCat,
          difficulty: newDiffEl ? newDiffEl.value : 2,
        }, function () { return S.uid('kp'); });
        if (!newRes.ok) { toast(t('understand.nameEmpty')); return; }
        aNew.knowledgePoints = newRes.knowledgePoints;
        aNew.cards = newRes.cards;
        state.newKp = false;
        markEdited();
        toast(t('understand.saved'));
        break;
      }
      case 'save-confirm': {
        var n = selectedCount();
        if (!n) return;
        var deckNew = S.createDeck(state.db, state.analysis, { allow: state.confirm });
        state.deckFilter = ''; // 新卡組任何分類都要即刻見返
        state.analysis = null;
        state.photo = null;
        state.photos = [];
        state.ocr = null;
        state.preflight = null;
        state.editCardId = null;
        state.mapPreviewDeckId = null;
        toast(t('paste.created', { n: n }));
        startPractice(deckNew.id, 'all');
        break;
      }
      case 'speak-front': {
        var sc = entryCard(currentEntry());
        if (sc) speakText(P.displayFront(sc.front));
        break;
      }
      case 'speak-back': {
        var sb = entryCard(currentEntry());
        if (sb) speakText(sb.back);
        break;
      }
      case 'say': {
        // P13：詞語生字朗讀（文字喺 data-say；唔經 state，避免重畫後對唔上）
        speakText(el.getAttribute('data-say') || '');
        break;
      }
      case 'start-vocab':
        startVocabPractice(el.getAttribute('data-id') || '');
        break;
      case 'vocab-check': {
        var cur = currentVocabItem();
        var input = document.getElementById('vocab-input');
        var typed = input ? input.value : '';
        if (!cur || !String(typed).trim()) { toast(t('photo.chooseFirst')); break; }
        answerVocab(P.answersMatch(typed, cur.item.word));
        break;
      }
      case 'vocab-giveup':
        answerVocab(false);
        break;
      case 'vocab-reveal':
        if (state.vsession) { state.vsession.revealed = true; render(); }
        break;
      case 'vocab-self':
        answerVocab(el.getAttribute('data-ok') === '1');
        break;
      case 'vocab-next':
        vocabNext();
        break;
      case 'reveal':
        state.session.revealed = true;
        render();
        break;
      case 'answer':
        answerCurrent(el.getAttribute('data-correct') === '1');
        break;
      case 'advance':
        if (state.session) state.session.needsContinue = false;
        advance();
        break;
      case 'choose': {
        var idx = Number(el.getAttribute('data-i'));
        var opts = state.session.optsCache || [];
        var picked = opts[idx];
        if (!picked) return;
        answerCurrent(!!picked.correct, picked.text);
        break;
      }
      case 'submit-type': {
        var inputEl = document.getElementById('type-input');
        var entry0 = currentEntry();
        var card0 = entryCard(entry0);
        if (!card0) return;
        var typed = inputEl ? inputEl.value : '';
        if (!String(typed).trim()) return;
        answerCurrent(P.answersMatch(typed, card0.back), typed);
        break;
      }
      case 'to-flip':
        state.session.mode = 'flip';
        state.session.optsCache = null;
        render();
        break;
      case 'show-answer':
        // 由 4 選 1／填空轉翻卡並即刻揭曉（唔使撳兩次）
        state.session.mode = 'flip';
        state.session.revealed = true;
        state.session.optsCache = null;
        state.session.optsKey = null;
        render();
        break;
      case 'exit-practice':
        saveDraftNow();
        state.session = null;
        go('#/home');
        break;
      case 'again-wrong': {
        var wrong = (state.lastAnswers || []).filter(function (a) { return !a.correct; });
        if (!wrong.length) return;
        var entries = wrong.map(function (a) { return { d: a.deckId || state.doneDeckId, c: a.cardId }; }).filter(function (e) { return !!entryCard(e); });
        if (!entries.length) return;
        startPractice(null, 'wrong', { entries: entries });
        break;
      }
      case 'practice-kp': {
        var kpId = el.getAttribute('data-kp');
        var deckId = state.route.id || el.getAttribute('data-id');
        var deckKp = deckId ? S.getDeck(state.db, deckId) : null;
        if (!deckKp) { toast(t('map.preview')); return; }
        startPractice(deckKp.id, 'kp:' + kpId);
        break;
      }
      case 'toggle-outline':
        state.outline = !state.outline;
        render();
        break;
      case 'delete-deck': {
        var d = S.getDeck(state.db, el.getAttribute('data-id'));
        if (!d) return;
        if (global.confirm && !global.confirm(t('deck.deleteConfirm', { t: d.title }))) return;
        S.deleteDeck(state.db, d.id);
        go('#/home');
        break;
      }
      case 'save-key': {
        var ki = document.getElementById('key-input');
        S.setKey(state.db, ki ? ki.value : '');
        toast(t('settings.saved'));
        break;
      }
      case 'export': {
        var data = S.exportJson(state.db);
        try {
          var blob = new Blob([data], { type: 'application/json' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'cardlab-backup.json';
          document.body.appendChild(a);
          a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        } catch (e) { toast(t('toast.exportFailed')); }
        break;
      }
      case 'import':
        go('#/import');
        break;
      case 'paste':
        go('#/paste');
        break;
      case 'paste-build': {
        var ta = document.getElementById('paste-input');
        var parsed = P.parsePastedCards(ta ? ta.value : '');
        if (!parsed.length) { toast(t('paste.none')); return; }
        var analysis = {
          classification: {
            stage: 'primary', grade: 'P4', gradeLabel: '小四', subject: 'general', subjectLabel: '常識',
            difficulty: 2, confidence: 1, taxonomy: ['定義', '應用'], taxonomyVersion: 1,
          },
          topic: { title: t('paste.title2'), summary: '', category: '其他' },
          knowledgePoints: [{ id: 'kp_manual', label: t('paste.title2'), category: '定義', difficulty: 2, detail: '' }],
          cards: parsed.map(function (c, i) {
            return { id: 'c' + (i + 1), kpId: 'kp_manual', category: '定義', difficulty: 2, type: 'basic', front: c.front, back: c.back, mnemonic: '', example: '', uncertain: false, source: 'manual' };
          }),
        };
        var deck2 = S.createDeck(state.db, analysis, {});
        state.deckFilter = '';
        toast(t('paste.created', { n: parsed.length }));
        go('#/deck/' + encodeURIComponent(deck2.id));
        break;
      }
      case 'clear-all': {
        if (global.confirm && !global.confirm(t('settings.clearConfirm'))) return;
        var fresh = S.blank();
        fresh.settings.lang = state.lang;
        fresh.settings.ai.key = state.db.settings.ai.key;
        state.db = fresh;
        S.save(state.db);
        S.clearDraft();
        S.clearAiCache();
        Srs && void 0;
        go('#/home');
        break;
      }
      default:
        break;
    }
  }

  function bind() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!el) return;
      if (el.tagName === 'INPUT') return;
      e.preventDefault();
      doAction(el.getAttribute('data-act'), el);
    });

    document.addEventListener('change', function (e) {
      var el = e.target;
      if (!el) return;
      if ((el.id === 'file-input' || el.id === 'file-input-album') && el.files && el.files.length) {
        var pickedFiles = Array.prototype.slice.call(el.files);
        var fromAlbum = el.id === 'file-input-album';
        el.value = ''; // 清空 value：同一張相再揀都會再觸發 change
        // P2.0／P12：相機入口維持單張（取代）；相簿入口可以一次揀最多 8 張（累加）。
        onFiles(pickedFiles, { replace: !fromAlbum });
        return;
      }
      if (el.id === 'autoread-input') {
        state.db.settings.autoRead = !!el.checked;
        S.save(state.db);
        return;
      }
      if (el.id === 'u-stage' && state.analysis) {
        var cStage = state.analysis.classification;
        var stageGrades = Ai.gradesForStage(el.value);
        if (!stageGrades.length) return;
        cStage.stage = el.value;
        if (stageGrades.indexOf(cStage.grade) < 0) cStage.grade = stageGrades[0];
        cStage.gradeLabel = Ai.gradeLabelOf(cStage.grade);
        markEdited();
        render();
        return;
      }
      if (el.id === 'u-grade-sel' && state.analysis) {
        var cGrade = state.analysis.classification;
        var pickedGrade = String(el.value || '').trim().toUpperCase();
        var pickedStage = Ai.stageForGrade(pickedGrade);
        if (!pickedStage || !Ai.isValidPair(pickedStage, pickedGrade)) return;
        cGrade.stage = pickedStage;
        cGrade.grade = pickedGrade;
        cGrade.gradeLabel = Ai.gradeLabelOf(pickedGrade);
        markEdited();
        render();
        return;
      }
      if (el.classList && el.classList.contains('kp-check')) {
        // 記住勾選狀態：任何遲到嘅 render 都唔會冪走家長嘅選擇
        state.kpPick[el.getAttribute('data-kp')] = el.checked;
        return;
      }
      if (el.classList && el.classList.contains('card-check')) {
        var id = el.getAttribute('data-card');
        state.confirm[id] = el.checked;
        var row = el.closest('.crow');
        if (row) row.classList.toggle('crow--off', !el.checked);
        var btn = document.getElementById('btn-add');
        var n = selectedCount();
        if (btn) {
          btn.textContent = t('confirm.add', { n: n });
          btn.disabled = n === 0;
        }
        return;
      }
      if (el.id === 'import-file' && el.files && el.files[0]) {
        var reader = new FileReader();
        reader.onload = function () {
          var r = S.importJson(state.db, String(reader.result || ''));
          if (!r.ok) { toast(t('import.bad')); return; }
          toast(t('import.done', { n: r.added }));
          go('#/home');
        };
        reader.readAsText(el.files[0]);
        return;
      }
      if (el.id === 'key-input') {
        S.setKey(state.db, el.value);
        return;
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target && e.target.id === 'type-input') {
        e.preventDefault();
        var btn = document.getElementById('btn-type-submit');
        if (btn) doAction('submit-type', btn);
      }
    });

    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.lang = btn.getAttribute('data-lang');
        state.db.settings.lang = state.lang;
        S.save(state.db);
        render();
      });
    });

    global.addEventListener('hashchange', function () {
      routeFromHash();
      render();
      if (state.route.name === 'practice' && !state.session) go('#/home');
    });

    global.addEventListener('resize', function () {
      if (state.route.name === 'map') drawMapLines();
    });
  }

  // ─────────────────────────── 示範資料（第一次開） ───────────────────────────
  function seedDemoIfEmpty() {
    if (state.db.decks.length) return;
    // 唔自動加示範卡：唔想混淆真資料。只喺測試 seed 時用。
  }

  // ─────────────────────────── boot ───────────────────────────
  function boot() {
    state.db = S.load();
    state.lang = state.db.settings.lang || 'zh';
    routeFromHash();
    if (state.route.name === 'done') {
      state.lastAnswers = [];
      state.doneDeckId = null;
    }
    if (state.route.name === 'practice') state.route = { name: 'home', id: null };
    if (state.route.name === 'analyze') state.route = { name: 'photo', id: null };
    seedDemoIfEmpty();
    bind();
    if (!location.hash) location.hash = '#/home';
    if ('serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.register('sw.js').catch(function () { /* 離線功能停用，app 照用 */ });
      } catch (e) { /* 舊瀏覽器 */ }
    }
    render();
  }

  // 完成頁需要最後一節答案：由 advance() 記住（見上面）。

  // i18n 靜態 header
  function renderChrome() {
    var brand = document.querySelector('.brand strong');
    if (brand) brand.textContent = t('app.title');
    var tag = document.querySelector('.brand small');
    if (tag) tag.textContent = t('app.tag');
    var back = document.getElementById('btn-back');
    if (back) back.setAttribute('aria-label', t('nav.back'));
    var set = document.getElementById('btn-settings');
    if (set) set.setAttribute('aria-label', t('nav.settings'));
  }

  var _render = render;
  render = function () {
    _render();
    renderChrome();
  };

  // 對外（測試／除錯用；唔含任何 key）
  global.CardLab = {
    state: state,
    actions: {
      setClock: function (fn) { state.nowFn = fn; },
      setSeed: function (n) { state.seed = n; state.rng = n || 123456789; },
      route: function (hash) { location.hash = hash; },
      answer: answerCurrent,
      startPractice: startPractice,
      go: go,
    },
    modules: { store: S, srs: Srs, parse: P, ai: Ai, map: M },
    dict: DICT,
    t: t,
    render: function () { render(); },
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
