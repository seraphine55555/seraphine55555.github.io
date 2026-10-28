/*
 * WordLab 不適合兒童詞典的 headword 排除名單（2026-10-28）
 *
 * 只影響 app 顯示與練習；原始 bulk.js／例句 pack 保留作審計紀錄。
 * 新增項目時，請同步更新 docs/wordlab.md 的「已排除」段與 verify 的 active 總數測試。
 */
window.WORDLAB_BLOCKED = [
  'abortion', 'alcohol', 'ass', 'assassination', 'beer', 'bitch', 'bloody',
  'bomb', 'bullet', 'casino', 'champagne', 'cigar', 'corpse', 'damn', 'drug',
  'fuck', 'fucking', 'guerrilla', 'gun', 'hell', 'hitler', 'homicide',
  'hostage', 'liquor', 'marijuana', 'militia', 'murder', 'pistol', 'racism',
  'raid', 'rifle', 'riot', 'sexuality', 'sexually', 'sexy', 'shit', 'shotgun',
  'slap', 'slavery', 'sword', 'terrorism', 'terrorist', 'tobacco', 'torture',
  'war', 'whip'
];
