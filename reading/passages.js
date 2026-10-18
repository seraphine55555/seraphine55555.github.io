/*
 * 閱讀理解試用版題庫（2026-10-18）
 *
 * 3 篇樣本：故事（P3）／資訊說明（P4）／告示（P4）。
 * 每題 4 個選項，`why` 係**逐個選項**嘅解釋（正確同錯誤都要講點解），
 * 呢個就係同「補充練習 app」唔同嘅位：唔止話你錯，仲話你點解錯。
 *
 * 題型 tag 用嚟日後做「錯邊類題」統計：
 *   main / detail / inference / vocab / cause / scan / sequence
 */
window.READING_PASSAGES = [
  {
    id: 'p3-lunchbox',
    level: 'P3',
    kind: 'story',
    words: 118,
    title: 'The Lunch Box Mix-up',
    text:
      'On Monday morning, Ken put his lunch box in his school bag and ran to the bus stop. ' +
      'He was so excited about the school picnic that he did not check his bag. ' +
      'At noon, he opened his bag and froze. The box inside was blue, but his was red. ' +
      '"That\'s my box!" said a girl behind him. Her name was Amy. ' +
      'She had picked up the wrong box at the bus stop. Ken\'s red box was in her bag. ' +
      'Amy smiled and gave it back. "Lucky you sat next to me," she said. ' +
      'They shared their sandwiches and became friends.',
    questions: [
      {
        type: 'cause',
        q: 'Why did Ken not check his bag?',
        options: [
          'He was in a hurry to leave home.',
          'He was too excited about the picnic.',
          'He was talking to Amy.',
          'He had lost his bag on the bus.',
        ],
        answer: 1,
        why: [
          '文中只說他「跑去巴士站」，冇講趕時間係原因；真正原因係下一句「so excited ... that he did not check」。',
          '正確。文中寫 "He was so excited about the school picnic that he did not check his bag."',
          'Amy 係後尾才出現，唔係原因。',
          '佢冇失去個袋，只係拎錯咗顏色。',
        ],
      },
      {
        type: 'detail',
        q: 'What colour was Ken\'s lunch box?',
        options: ['Blue', 'Red', 'Green', 'Yellow'],
        answer: 1,
        why: [
          '藍色係袋入面嗰個（即 Amy 嘅）。',
          '正確。文中寫 "The box inside was blue, but his was red."',
          '文中冇提過綠色。',
          '文中冇提過黃色。',
        ],
      },
      {
        type: 'detail',
        q: 'What did Amy do at the bus stop?',
        options: [
          'She picked up the wrong lunch box.',
          'She lost her own lunch box.',
          'She bought a new lunch box for Ken.',
          'She forgot her school bag on the bus.',
        ],
        answer: 0,
        why: [
          '正確。文中寫 "She had picked up the wrong box at the bus stop."',
          '佢冇失去午餐，只係拎錯咗。',
          '佢只係還返個袋俾 Ken，冇買新嘅。',
          '文中講嘅係午餐盒，唔係書包。',
        ],
      },
      {
        type: 'inference',
        q: 'How did Ken feel when he opened his bag at noon?',
        options: ['Excited', 'Surprised', 'Angry', 'Bored'],
        answer: 1,
        why: [
          '興奮係佢早上去野餐前嘅心情，唔係打開袋嗰刻。',
          '正確。「froze」（呆咗）表示突然發現唔對路，最接近 surprised。',
          '文中冇話佢嬲；佢之後仲同 Amy 分享三文治。',
          '文中冇話悶。',
        ],
      },
      {
        type: 'main',
        q: 'What is the story mainly about?',
        options: [
          'A school picnic that went wrong.',
          'Two children who became friends after a mix-up.',
          'How to pack a school bag properly.',
          'A girl who lost her lunch box.',
        ],
        answer: 1,
        why: [
          '野餐只係背景，唔係故事重點。',
          '正確。全篇由「拎錯午餐盒」講到兩人相識、做朋友。',
          '文章冇教點執書包。',
          'Amy 冇失去午餐盒，佢只係拎錯。',
        ],
      },
    ],
  },

  {
    id: 'p4-beans',
    level: 'P4',
    kind: 'report',
    words: 116,
    title: 'Our Bean Plants',
    text:
      'Last month, Class 4B started a small garden outside the classroom. ' +
      'Each group planted five bean seeds in a box. At first, nothing happened for a week. ' +
      'Some students thought the seeds were dead. Miss Chan told them to be patient and to water ' +
      'the soil every morning, but not too much. On the eighth day, two tiny green shoots appeared. ' +
      'The students were very excited. They measured the plants every Friday and wrote the numbers ' +
      'in a chart. After four weeks, the tallest plant was 18 cm. The class learned that plants ' +
      'need water, sunlight and time to grow.',
    questions: [
      {
        type: 'detail',
        q: 'Where did Class 4B plant the seeds?',
        options: [
          'In the classroom.',
          'In a box outside the classroom.',
          'In the school hall.',
          'In Miss Chan\'s office.',
        ],
        answer: 1,
        why: [
          '個小花園喺課室外面，唔係課室入面。',
          '正確。文中寫 "started a small garden outside the classroom" 同 "planted five bean seeds in a box"。',
          '文中冇提過禮堂。',
          '文中冇提過 Miss Chan 嘅辦公室。',
        ],
      },
      {
        type: 'cause',
        q: 'Why did some students think the seeds were dead?',
        options: [
          'The seeds were too old.',
          'Nothing grew for a week.',
          'They forgot to water the plants.',
          'The boxes were too small.',
        ],
        answer: 1,
        why: [
          '文中冇講種子太舊。',
          '正確。文中寫 "nothing happened for a week"，所以學生以為種子死咗。',
          '文中冇話佢哋忘記淋水；Miss Chan 反而提醒要淋水。',
          '文中冇講個箱太細。',
        ],
      },
      {
        type: 'detail',
        q: 'What did Miss Chan tell the students to do?',
        options: [
          'Water the soil every morning.',
          'Move the plants indoors.',
          'Measure the plants every day.',
          'Plant more seeds.',
        ],
        answer: 0,
        why: [
          '正確。文中寫 "told them to be patient and to water the soil every morning"。',
          '佢冇叫學生搬入室內。',
          '學生自己每星期五量度，唔係 Miss Chan 叫佢哋每日量。',
          '佢冇叫學生再種多啲。',
        ],
      },
      {
        type: 'vocab',
        q: 'The word "patient" in the passage means ...',
        options: [
          'happy and excited',
          'calm and willing to wait',
          'tired and sleepy',
          'careful with money',
        ],
        answer: 1,
        why: [
          '開心興奮係學生後尾見到芽嘅心情，唔係 patient。',
          '正確。Miss Chan 叫學生耐心等，即係「冷靜、願意等」。',
          'tired 係疲倦，同上下文（等發芽）無關。',
          '呢個係「慳錢」嘅意思，同上下文無關。',
        ],
      },
      {
        type: 'detail',
        q: 'Which sentence is true?',
        options: [
          'The plants grew in three days.',
          'The tallest plant was 18 cm after four weeks.',
          'The students measured the plants every day.',
          'Miss Chan watered the plants every morning.',
        ],
        answer: 1,
        why: [
          '文中話第八日才見到芽，唔係三日。',
          '正確。文中寫 "After four weeks, the tallest plant was 18 cm."',
          '學生係每星期五量度，唔係每日。',
          '文中係叫學生淋水，冇講 Miss Chan 自己淋。',
        ],
      },
    ],
  },

  {
    id: 'p4-library',
    level: 'P4',
    kind: 'notice',
    words: 96,
    title: 'School Library Notice',
    text:
      'SUNSHINE PRIMARY SCHOOL LIBRARY\n\n' +
      'Opening hours:\n' +
      'Monday to Friday: 8:00 a.m. – 4:30 p.m. (closed 12:00 – 1:00 for lunch)\n' +
      'Saturday: 9:00 a.m. – 12:00 noon\n' +
      'Closed on Sundays and public holidays.\n\n' +
      'Rules:\n' +
      '• Show your student card at the door.\n' +
      '• You may borrow two books for two weeks.\n' +
      '• Return books to the red box near the door.\n' +
      '• No food or drinks in the library.\n' +
      '• Keep your voice low.\n\n' +
      'NEW: Story Time every Wednesday at 1:30 p.m. in the reading room. Parents are welcome.',
    questions: [
      {
        type: 'scan',
        q: 'When is the library closed on weekdays?',
        options: ['8:00 – 9:00 a.m.', '12:00 – 1:00 p.m.', '4:30 – 5:00 p.m.', 'It is open all day.'],
        answer: 1,
        why: [
          '8:00 係開門時間，唔係休息時間。',
          '正確。告示寫 "closed 12:00 – 1:00 for lunch"。',
          '4:30 係下午關門時間，唔係中途休息。',
          '平日有午休時間關門，所以唔係全日開放。',
        ],
      },
      {
        type: 'scan',
        q: 'How many books can a student borrow at one time?',
        options: ['One', 'Two', 'Three', 'Five'],
        answer: 1,
        why: [
          '告示寫 two books，唔係 one。',
          '正確。告示寫 "You may borrow two books for two weeks."',
          '告示冇講 three。',
          '告示冇講 five。',
        ],
      },
      {
        type: 'scan',
        q: 'Where should students return the books?',
        options: [
          'To the librarian at the desk.',
          'To the red box near the door.',
          'To the reading room.',
          'To their classroom teacher.',
        ],
        answer: 1,
        why: [
          '告示冇講要交俾圖書館員。',
          '正確。告示寫 "Return books to the red box near the door."',
          '閱讀室係 Story Time 嘅地點，唔係還書處。',
          '告示冇講要交俾班主任。',
        ],
      },
      {
        type: 'inference',
        q: 'Who can go to Story Time?',
        options: [
          'Only students.',
          'Only teachers.',
          'Students and their parents.',
          'Anyone from the public.',
        ],
        answer: 2,
        why: [
          '告示話家長都歡迎，所以唔止學生。',
          '告示冇話只限老師。',
          '正確。Story Time 喺校內圖書館舉行，告示寫 "Parents are welcome"，即學生同家長都可以。',
          '呢個係學校圖書館活動，告示冇話開放俾公眾。',
        ],
      },
      {
        type: 'scan',
        q: 'What time does the library open on Saturday?',
        options: ['8:00 a.m.', '9:00 a.m.', '12:00 noon.', '1:30 p.m.'],
        answer: 1,
        why: [
          '8:00 係平日開門時間。',
          '正確。告示寫 "Saturday: 9:00 a.m. – 12:00 noon"。',
          '12:00 係星期六關門時間。',
          '1:30 係星期三 Story Time 時間。',
        ],
      },
    ],
  },
];
