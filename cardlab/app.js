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
    'home.empty': { yue: '仲未有卡。撳「影相出卡」開始。', zh: '還沒有卡。按「影相出卡」開始。', en: 'No cards yet. Tap "Photo to cards" to start.' },
    'home.paste': { yue: '貼上建卡', zh: '貼上建卡', en: 'Paste cards' },
    'home.import': { yue: '匯入', zh: '匯入', en: 'Import' },
    'home.export': { yue: '備份', zh: '備份', en: 'Backup' },
    'photo.title': { yue: '影相出卡', zh: '影相出卡', en: 'Photo to cards' },
    'photo.pick': { yue: '📷 揀相／影相', zh: '📷 選相／拍照', en: '📷 Choose / take photo' },
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
      yue: '🔒 撳「開始分析」先會送出呢張相：文字會經 DeepSeek OCR 同對話模型分析。OCR 檔案唔會存入 Files API，亦唔會交給對話模型；相片唔會存喺我哋伺服器，分析完即棄。',
      zh: '🔒 按「開始分析」才會送出這張相：文字會經 DeepSeek OCR 與對話模型分析。OCR 檔案不會存入 Files API，也不會交給對話模型；相片不會存在我們的伺服器，分析完即棄。',
      en: '🔒 Only after you tap Start will this photo be sent: text goes through DeepSeek OCR and the chat model. OCR files are not stored in the Files API nor passed to the chat model; photos are never stored on our server and are discarded after analysis.',
    },
    'photo.analyze': { yue: '開始 AI 分析', zh: '開始 AI 分析', en: 'Start AI analysis' },
    'photo.noKey': { yue: 'AI 未啟用：請喺設定頁入 DeepSeek API key（只存本機）。', zh: 'AI 未啟用：請在設定頁輸入 DeepSeek API key（只存本機）。', en: 'AI is not enabled: add a DeepSeek API key in Settings (stored locally only).' },
    'photo.toSettings': { yue: '去設定入 key', zh: '去設定輸入 key', en: 'Open settings' },
    'photo.compressed': { yue: '已壓縮 {size} · {w}×{h}', zh: '已壓縮 {size} · {w}×{h}', en: 'Compressed {size} · {w}×{h}' },
    'photo.chooseFirst': { yue: '先揀一張相', zh: '請先選一張相', en: 'Choose a photo first' },
    'photo.cap': { yue: '今日已用 {used}／{cap} 張', zh: '今日已用 {used}／{cap} 張', en: 'Used {used}/{cap} today' },
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
    'settings.privacy': { yue: '相片只用一次：分析完即棄，唔入 localStorage／IndexedDB。練習頁完全離線。', zh: '相片只用一次：分析完即棄，不進 localStorage／IndexedDB。練習頁完全離線。', en: 'Photos are used once and discarded — never stored in localStorage/IndexedDB. Practice is fully offline.' },
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
    photo: null, // {blob,width,height,bytes,url}
    ocr: null, // {pages,text,gate}
    analysis: null, // validated value
    confirm: {},
    session: null,
    toast: '',
    error: null,
    analyze: { step: 'idle', steps: { compress: 'idle', ocr: 'idle', understand: 'idle', cards: 'idle' } },
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
    if (!db.decks.length) {
      html += '<p class="empty">' + esc(t('home.empty')) + '</p>';
    } else {
      html += '<ul class="decks">';
      db.decks.forEach(function (d) {
        var stats = M.deckStats(d, now(), db.srs);
        html += '<li><button type="button" class="deck" data-act="deck" data-id="' + esc(d.id) + '">';
        html += '<span class="deck__title">' + esc(d.title) + '</span>';
        html += '<span class="deck__meta">' + esc((d.classification && d.classification.gradeLabel) || '') + ' · ' + esc(t('deck.cards', { n: stats.total })) + '</span>';
        html += '<span class="deck__due">' + esc(t('deck.due', { n: stats.dueToday })) + '</span>';
        html += '</button></li>';
      });
      html += '</ul>';
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
  function viewPhoto() {
    var ai = state.db.settings.ai;
    var hasKey = !!String(ai.key || '').trim();
    var cap = S.photoCap(state.db, now());
    var html = '';
    html += '<section class="section"><h1 class="page-title">' + esc(t('photo.title')) + '</h1>';
    html += '<p class="hint">' + esc(t('photo.tips')) + '</p>';
    html += '<p class="hint hint--soft">' + esc(t('photo.auto')) + '</p>';
    html += '<input id="file-input" class="sr-only" type="file" accept="image/*" capture="environment" />';
    html += '<label class="btn btn--pick" for="file-input" id="btn-pick">' + esc(t('photo.pick')) + '</label>';
    html += '<div id="photo-slot">';
    if (state.photo) {
      html += '<figure class="preview"><img id="photo-preview" alt="preview" src="' + esc(state.photo.url) + '" />';
      html += '<figcaption id="photo-size">' + esc(t('photo.compressed', { size: bytesLabel(state.photo.bytes), w: state.photo.width, h: state.photo.height })) + '</figcaption></figure>';
    }
    html += '</div>';
    if (state.preflight && !state.preflight.ok) {
      html += '<div class="notice notice--warn" id="preflight-warn"><strong>' + esc(t('preflight.title')) + '</strong><ul class="fixlist">';
      state.preflight.issues.forEach(function (code) {
        html += '<li>' + esc(t('preflight.' + code)) + '</li>';
      });
      html += '</ul></div>';
    }
    html += '<p class="privacy" id="privacy">' + esc(t('photo.privacy')) + '</p>';
    if (!hasKey) {
      html += '<div class="notice notice--warn" id="ai-disabled">' + esc(t('photo.noKey')) + ' ';
      html += '<button type="button" class="linkbtn" data-act="settings">' + esc(t('photo.toSettings')) + '</button></div>';
    }
    html += '<button type="button" class="btn btn--primary btn--wide" id="btn-analyze" data-act="analyze"';
    if (!state.photo || !hasKey) html += ' disabled';
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
    if (state.photo) {
      html += '<figure class="thumb"><img alt="preview" src="' + esc(state.photo.url) + '" /></figure>';
    }
    html += '<ol class="steps" id="analyze-steps">';
    html += stepRow('compress', t('analyze.step.compress'));
    html += stepRow('ocr', t('analyze.step.ocr'));
    html += stepRow('understand', t('analyze.step.understand'));
    html += stepRow('cards', t('analyze.step.cards'));
    html += '</ol>';
    if (state.error) {
      var code = state.error.code || 'unknown';
      var key = 'err.' + code;
      if (!DICT[key]) key = DICT[code] ? code : 'err.unknown';
      html += '<div class="notice notice--error" id="analyze-error">' + esc(t(key, state.error.vars || {})) + '</div>';
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
    if (a.knowledgePoints.length > 8) html += '<p class="hint hint--warn">' + esc(t('understand.tooMany')) + '</p>';

    html += '<h3 class="sub">' + esc(t('understand.kps', { n: a.knowledgePoints.length })) + '</h3>';
    html += '<p class="hint hint--soft">' + esc(t('understand.editKp')) + '</p>';
    html += '<ul class="kps" id="u-kps">';
    a.knowledgePoints.forEach(function (kp) {
      var n = a.cards.filter(function (x) { return x.kpId === kp.id; }).length;
      var editing = state.editKpId === kp.id;
      html += '<li class="kp' + (editing ? ' kp--editing' : '') + '" data-kp="' + esc(kp.id) + '">';
      html += '<label class="kp__pick"><input type="checkbox" class="kp-check" data-kp="' + esc(kp.id) + '" checked />' +
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
    if (a.cached) html += '<div class="notice notice--ok" id="cache-hit">' + esc(t('confirm.cached')) + '</div>';
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
          html += '<span class="crow__text"><strong>' + esc(c.front) + '</strong><small>' + esc(c.back) + '</small></span></label>';
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
      html += '<li>' + esc(c.front) + ' <small>' + esc(t('deck.learning')) + ' ' + (s.tries - s.ok) + '✗</small></li>';
    });
    html += '</ol>';
    html += '<div class="toolbar">';
    html += '<button type="button" class="btn btn--primary" data-act="practice" data-id="' + esc(deck.id) + '">' + esc(t('deck.practice')) + '</button>';
    html += '<button type="button" class="btn btn--ghost" data-act="deck-map" data-id="' + esc(deck.id) + '">' + esc(t('deck.map')) + '</button>';
    html += '</div>';
    html += '<div class="toolbar"><button type="button" class="btn btn--danger btn--tiny" data-act="delete-deck" data-id="' + esc(deck.id) + '">' + esc(t('deck.delete')) + '</button></div>';
    html += '</section>';
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
    var extra = P.sentenceWords(cloze.sentence, 3);
    var opts = choiceOptions({ id: card.id, front: card.front, back: cloze.answer }, deck, extra);
    return opts;
  }

  function isYoung(grade) {
    return /^K/.test(grade || '') || grade === 'P1' || grade === 'P2';
  }

  function modeFor(card, deck) {
    var g = (deck.classification && deck.classification.grade) || 'P4';
    var young = isYoung(g);
    if (card.type === 'cloze' && P.parseCloze(card.front)) return young ? 'cloze' : 'typing';
    if (young) {
      if (card.type === 'basic' && choiceOptions(card, deck)) return 'choice';
      return 'flip';
    }
    if (card.type === 'basic' && Array.from(String(card.back || '')).length <= 30) return 'typing';
    if (card.type === 'basic' && choiceOptions(card, deck)) return 'choice';
    return 'flip';
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
    if (session.mode === 'cloze') {
      var cloze = P.parseCloze(card.front);
      html += '<p class="pcard__front">' + esc(cloze ? cloze.sentence : card.front) + '</p>';
    } else {
      html += '<p class="pcard__front">' + esc(card.front) + '</p>';
    }
    html += '</article>';

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
      html += '<div class="options" id="choice-list">';
      opts.forEach(function (o, i) {
        html += '<button type="button" class="choice" data-act="choose" data-i="' + i + '">' + esc(o.text) + '</button>';
      });
      html += '</div>';
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
        html += '<li>' + esc(card ? card.front : a.cardId) + '<small>' + esc(card ? card.back : '') + '</small></li>';
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
    html += '<p class="privacy">' + esc(t('settings.privacy')) + '</p>';
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
      case 'map': return viewMap();
      case 'map-preview': return viewMap();
      case 'practice': return viewPractice();
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
  }

  function go(hash) {
    if (location.hash === hash) { 
      routeFromHash();
      render();
      return;
    }
    location.hash = hash;
  }

  function routeFromHash() {
    var raw = (location.hash || '#/home').replace(/^#\/?/, '');
    var parts = raw.split('/');
    var name = parts[0] || 'home';
    var id = parts[1] || null;
    var known = ['home', 'photo', 'analyze', 'understand', 'confirm', 'deck', 'map', 'map-preview', 'practice', 'done', 'settings', 'paste', 'import'];
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

  function fail(code, gateCode, vars) {
    state.error = { code: code, gate: gateCode || null, vars: vars || {} };
    setStep(state.analyze.step, 'error');
    render();
  }

  async function photoHash() {
    var p = state.photo;
    if (!p) return '';
    if (p.hash) return p.hash;
    try {
      var bytes = p.blob && p.blob.arrayBuffer ? await p.blob.arrayBuffer() : null;
      if (!bytes) return '';
      p.hash = await Ai.sha256Hex(bytes);
    } catch (e) {
      p.hash = ''; // 冇 crypto.subtle 就當冇快取，唔會阻流程
    }
    return p.hash;
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
    };
    var raw = S.readAiCache();
    var next = Ai.cachePut(raw, hash, value, now());
    if (next && next !== raw) S.writeAiCache(next);
  }

  async function runAnalysis() {
    state.error = null;
    state.ocr = null;
    state.analysis = null;
    state.confirm = {};
    state.editCardId = null;
    state.editKpId = null;
    state.newKp = false;
    // 每次分析一條獨立 AbortController + run token：取消真 abort，舊 response 亦唔會再推進。
    var runCtrl = new AbortController();
    state.abort = runCtrl;
    var token = (state.runToken = (state.runToken || 0) + 1);
    function stale() { return state.runToken !== token || runCtrl.signal.aborted; }
    state.analyze.steps = { compress: 'active', ocr: 'idle', understand: 'idle', cards: 'idle' };
    state.route = { name: 'analyze', id: null };
    if (location.hash !== '#/analyze') location.hash = '#/analyze';
    else render();
    if (!state.photo) { fail('unknown'); return; }
    var key = String(state.db.settings.ai.key || '').trim();
    if (!key) { fail('auth'); return; }

    // 1) 壓縮（揀相時已做，呢度只係確認）
    setStep('compress', 'done');

    // P1.1：同一張相 24 小時內用本機快取（設計 §7.6／§18.9）
    // key＝壓縮後 JPEG bytes 嘅 SHA-256；命中就零 OCR／零對話，亦唔扣每日相片上限。
    var hash = await photoHash();
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
    if (cap.remaining <= 0) { fail('rate'); return; }

    // 2) OCR
    setStep('ocr', 'active');
    var form = new FormData();
    form.append('purpose', 'text_recognition');
    form.append('file', state.photo.blob, 'page.jpg');
    var resp;
    try {
      resp = await fetchWithTimeout(Ai.OCR_URL, { method: 'POST', headers: authHeaders(), body: form }, OCR_TIMEOUT, runCtrl);
    } catch (e) {
      if (stale()) return;
      return fail(e && e.name === 'AbortError' ? 'timeout' : 'network');
    }
    if (stale()) return;
    if (!resp.ok) return fail(apiError(resp.status).code);
    var payload;
    try { payload = await resp.json(); } catch (e) { return fail('not_json'); }
    if (stale()) return;
    var pages = P.cleanPages(P.parseOcrPayload(payload));
    var gate = P.qualityGate(pages);
    state.ocr = { pages: pages, text: P.cleanText(pages), gate: gate, raw: payload };
    if (!gate.ok) {
      var vars = {};
      if (gate.stats && typeof gate.stats.chars === 'number') vars.n = gate.stats.chars;
      if (gate.stats && typeof gate.stats.garbage === 'number') vars.p = Math.round(gate.stats.garbage * 100);
      state.analyze.steps.ocr = 'error';
      return fail('gate.' + gate.code, gate.code, vars);
    }
    S.markPhotoUsed(state.db, now());
    setStep('ocr', 'done');

    // 3) 理解
    setStep('understand', 'active');
    var body = Ai.buildChatBody(state.ocr.text);
    var result = await callChat(body, key, runCtrl);
    if (stale()) return;
    if (!result.ok) {
      state.analyze.steps.understand = 'error';
      return fail(result.code, null, result.vars);
    }
    var validated = Ai.validateResult(result.text);
    if (!validated.ok && !validated.aiError) {
      // 格式問題：重試一次（設計 §7.4）
      var retry = await callChat(body, key, runCtrl);
      if (stale()) return;
      if (retry.ok) validated = Ai.validateResult(retry.text);
    }
    if (stale()) return;
    if (!validated.ok) {
      state.analyze.steps.understand = 'error';
      var errKey = validated.aiError ? 'err.ai_' + validated.aiError : 'err.' + (validated.errors[0] || 'unknown');
      if (!DICT[errKey]) errKey = 'err.not_json';
      state.error = { code: errKey.replace('err.', ''), vars: {} };
      return fail(state.error.code);
    }
    setStep('understand', 'done');

    // 4) 出卡
    setStep('cards', 'active');
    state.analysis = validated.value;
    state.confirm = {};
    state.analysis.cards.forEach(function (c) { state.confirm[c.id] = true; });
    state.analysis.ocr = { pages: pages.length, chars: gate.stats.chars, quality: gate.code };
    // 驗證已過、分析已成形 → 先寫快取（任何失敗都行唔到呢一步）
    cacheSave(hash, state.analysis);
    S.clearDraft();
    state.abort = null;
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
    if (!resp.ok) return { ok: false, code: apiError(resp.status).code };
    var data;
    try { data = await resp.json(); } catch (e) { return { ok: false, code: 'not_json' }; }
    var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) return { ok: false, code: 'not_json' };
    return { ok: true, text: content, raw: data };
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
    var body = Ai.buildChatBody(state.ocr ? state.ocr.text : '', {
      regen: true,
      classification: state.analysis.classification,
      topic: state.analysis.topic,
      taxonomy: state.analysis.classification.taxonomy,
      knowledgePoints: kps,
    });
    state.route = { name: 'analyze', id: null };
    state.analyze.steps = { compress: 'done', ocr: 'done', understand: 'done', cards: 'active' };
    state.toast = '';
    if (location.hash !== '#/analyze') location.hash = '#/analyze';
    else render();
    var rCtrl = new AbortController();
    state.abort = rCtrl;
    var rToken = (state.runToken = (state.runToken || 0) + 1);
    var r = await callChat(body, key, rCtrl);
    if (state.runToken !== rToken || rCtrl.signal.aborted) return;
    if (!r.ok) { state.analyze.steps.cards = 'error'; state.abort = null; return fail(r.code, null, r.vars); }
    var v = Ai.validateResult(r.text);
    // 第二次 call 可能只回 cards：補回 classification / topic / kps
    var value = v.ok ? v.value : null;
    if (!value) {
      var loose = Ai.parseJsonLoose(r.text);
      var cardsOnly = loose && Array.isArray(loose.cards) ? validateCardsOnly(loose.cards, kps, state.analysis.classification.taxonomy) : null;
      if (!cardsOnly) {
        state.analyze.steps.cards = 'error';
        return fail(v.errors && v.errors[0] ? v.errors[0] : 'not_json');
      }
      value = {
        classification: state.analysis.classification,
        topic: state.analysis.topic,
        taxonomy: state.analysis.classification.taxonomy,
        knowledgePoints: kps,
        cards: cardsOnly,
      };
    } else {
      value.knowledgePoints = kps;
      value.classification = state.analysis.classification;
      value.topic = state.analysis.topic;
      value.cards = value.cards.filter(function (c) { return keptIds[c.kpId]; });
    }
    state.analysis = value;
    state.analysis.cached = false; // 重出卡已經再 call 過模型，唔再算「用快取」
    state.editKpId = null;
    state.newKp = false;
    state.confirm = {};
    value.cards.forEach(function (c) { state.confirm[c.id] = true; });
    state.analyze.steps.cards = 'done';
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
      out.push({
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
      });
    });
    return out.length ? out : null;
  }

  // ─────────────────────────── 相片 ───────────────────────────
  async function onFile(file) {
    if (!file) return;
    state.error = null;
    var before = state.photo && state.photo.url ? state.photo.url : null;
    var compressed;
    try {
      compressed = await Ai.compressImage(file, { maxEdge: Ai.MAX_EDGE, quality: Ai.JPEG_QUALITY, maxBytes: Ai.MAX_BYTES });
    } catch (e) {
      toast(t('toast.imageDecode'));
      return;
    }
    if (before) { try { URL.revokeObjectURL(before); } catch (e) {} }
    state.photo = {
      blob: compressed.blob,
      width: compressed.width,
      height: compressed.height,
      bytes: compressed.bytes,
      quality: compressed.quality,
      url: URL.createObjectURL(compressed.blob),
    };
    state.preflight = null;
    render();
    // 本機 preflight（太細／矇／反光）：只提示，唔上傳、唔阻擋
    try {
      var snapshot = state.photo;
      Ai.preflight(compressed.blob).then(function (res) {
        if (state.photo === snapshot) {
          state.preflight = res;
          render();
        }
      }).catch(function () { /* preflight 失敗唔影響主流程 */ });
    } catch (e) { /* 舊瀏覽器 */ }
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
        state.error = null;
        go('#/photo');
        break;
      case 'go-photo':
        state.error = null;
        go('#/photo');
        break;
      case 'analyze':
        if (!state.photo) { toast(t('photo.chooseFirst')); return; }
        if (!String(state.db.settings.ai.key || '').trim()) { toast(t('toast.notEnabled')); return; }
        runAnalysis();
        break;
      case 'retry':
        if (!state.photo) { go('#/photo'); return; }
        runAnalysis();
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
      case 'practice':
        startPractice(el.getAttribute('data-id'), 'all');
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
        state.analysis = null;
        state.photo = null;
        state.ocr = null;
        state.preflight = null;
        state.editCardId = null;
        state.mapPreviewDeckId = null;
        toast(t('paste.created', { n: n }));
        startPractice(deckNew.id, 'all');
        break;
      }
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
          topic: { title: t('paste.title2'), summary: '' },
          knowledgePoints: [{ id: 'kp_manual', label: t('paste.title2'), category: '定義', difficulty: 2, detail: '' }],
          cards: parsed.map(function (c, i) {
            return { id: 'c' + (i + 1), kpId: 'kp_manual', category: '定義', difficulty: 2, type: 'basic', front: c.front, back: c.back, mnemonic: '', example: '', uncertain: false, source: 'manual' };
          }),
        };
        var deck2 = S.createDeck(state.db, analysis, {});
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
      if (el.id === 'file-input' && el.files && el.files[0]) {
        onFile(el.files[0]);
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
