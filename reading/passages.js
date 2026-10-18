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
    words: 101,
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
    words: 100,
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
    words: 88,
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
  {
    id: 'p1-mycat',
    level: 'P1',
    kind: 'story',
    words: 39,
    title: 'My Cat Mimi',
    text:
      'This is my cat, Mimi. She is white and grey. ' +
      'She likes to sleep on my bed. Every morning, she waits for me at the door. ' +
      'I give her milk and she says, "Meow!" Mimi is my best friend.',
    questions: [
      {
        type: 'detail',
        q: 'What colour is Mimi?',
        options: ['White and grey.', 'Black and white.', 'Brown.', 'Yellow.'],
        answer: 0,
        why: [
          '正確。文中第一句話 "She is white and grey."',
          '文中冇講黑色。',
          '文中冇講棕色。',
          '文中冇講黃色。',
        ],
      },
      {
        type: 'detail',
        q: 'Where does Mimi like to sleep?',
        options: ['On the sofa.', 'On my bed.', 'In the garden.', 'At the door.'],
        answer: 1,
        why: [
          '文中冇講沙發。',
          '正確。文中話 "She likes to sleep on my bed."',
          '文中冇講花園。',
          '門口係佢等「我」嘅地方，唔係睡覺地方。',
        ],
      },
      {
        type: 'detail',
        q: 'When does Mimi wait for me?',
        options: ['Every morning.', 'Every night.', 'At noon.', 'On Sunday.'],
        answer: 0,
        why: [
          '正確。文中話 "Every morning, she waits for me at the door."',
          '文中冇講夜晚。',
          '文中冇講中午。',
          '文中冇講星期日。',
        ],
      },
      {
        type: 'detail',
        q: 'What do I give Mimi?',
        options: ['Bread.', 'Milk.', 'Fish.', 'Water.'],
        answer: 1,
        why: [
          '文中冇講麵包。',
          '正確。文中話 "I give her milk"。',
          '文中冇講魚。',
          '文中冇講水。',
        ],
      },
      {
        type: 'detail',
        q: 'What does Mimi say?',
        options: ['Woof!', 'Meow!', 'Tweet!', 'Moo!'],
        answer: 1,
        why: [
          'Woof 係狗叫。',
          '正確。文中話 she says, "Meow!"',
          'Tweet 係雀仔聲。',
          'Moo 係牛叫。',
        ],
      },
    ],
  },

  {
    id: 'p2-schoolbus',
    level: 'P2',
    kind: 'story',
    words: 51,
    title: 'The School Bus',
    text:
      'Tom takes the school bus every day. The bus comes at seven thirty. ' +
      'Tom sits with his friend Ben. They talk about football. ' +
      'One day, the bus was late. Tom waited for ten minutes. ' +
      'When the bus came, the driver said sorry. Tom and Ben still got to school on time.',
    questions: [
      {
        type: 'detail',
        q: 'How does Tom go to school?',
        options: ['By car.', 'By bus.', 'By train.', 'On foot.'],
        answer: 1,
        why: [
          '文中冇講私家車。',
          '正確。文中第一句話 "Tom takes the school bus every day."',
          '文中冇講火車。',
          '文中冇講行路。',
        ],
      },
      {
        type: 'scan',
        q: 'What time does the bus come?',
        options: ['Seven o\'clock.', 'Seven thirty.', 'Eight o\'clock.', 'Eight thirty.'],
        answer: 1,
        why: [
          '文中話 seven thirty，唔係七點正。',
          '正確。文中話 "The bus comes at seven thirty."',
          '文中冇講八點。',
          '文中冇講八點半。',
        ],
      },
      {
        type: 'detail',
        q: 'Who does Tom sit with?',
        options: ['His sister.', 'His friend Ben.', 'The driver.', 'His teacher.'],
        answer: 1,
        why: [
          '文中冇講妹妹。',
          '正確。文中話 "Tom sits with his friend Ben."',
          '司機揸車，唔係坐喺 Tom 隔籬。',
          '老師唔喺校車度。',
        ],
      },
      {
        type: 'cause',
        q: 'Why did Tom wait for ten minutes?',
        options: [
          'He was too early.',
          'The bus was late.',
          'He missed the bus.',
          'He forgot his school bag.',
        ],
        answer: 1,
        why: [
          '文中話佢等咗十分鐘係因為巴士遲，唔係佢早到。',
          '正確。文中話 "the bus was late. Tom waited for ten minutes."',
          '佢冇錯過巴士，最後仲上到車。',
          '文中冇講佢漏咗書包。',
        ],
      },
      {
        type: 'detail',
        q: 'What did the driver say?',
        options: ['Thank you.', 'Sorry.', 'Good morning.', 'Goodbye.'],
        answer: 1,
        why: [
          '司機冇講多謝。',
          '正確。文中話 "the driver said sorry"。',
          '文中冇講早晨。',
          '文中冇講再見。',
        ],
      },
    ],
  },

  {
    id: 'p5-oldbicycle',
    level: 'P5',
    kind: 'story',
    words: 99,
    title: 'The Old Bicycle',
    text:
      'When Mr Lee was a boy, he rode an old bicycle to school every day. ' +
      'It was heavy and rusty, and the chain often came off. ' +
      'His friends laughed at it, but Mr Lee did not mind. ' +
      'He repaired it himself and learned how machines work. ' +
      'Many years later, Mr Lee became an engineer. ' +
      'Last week, he found the same bicycle in his parents\' store room. ' +
      'He cleaned it, put on new tyres, and rode it to the park. ' +
      '"It is slow," he said, "but it still works." ' +
      'His grandchildren laughed, and this time Mr Lee laughed with them.',
    questions: [
      {
        type: 'detail',
        q: 'How did Mr Lee go to school when he was a boy?',
        options: ['By bus.', 'By bicycle.', 'On foot.', 'By car.'],
        answer: 1,
        why: [
          '文中冇講巴士。',
          '正確。文中話 "he rode an old bicycle to school every day"。',
          '文中冇講行路。',
          '文中冇講私家車。',
        ],
      },
      {
        type: 'cause',
        q: 'Why did his friends laugh at the bicycle?',
        options: [
          'It was too new.',
          'It was heavy and rusty.',
          'It was too small.',
          'It had no wheels.',
        ],
        answer: 1,
        why: [
          '架車係舊車，唔係新。',
          '正確。文中話 "It was heavy and rusty, and the chain often came off."',
          '文中冇講太細。',
          '架車有轆，只係鏈條成日甩。',
        ],
      },
      {
        type: 'vocab',
        q: 'The word "rusty" in the passage means ...',
        options: [
          'very new and shiny',
          'covered with rust and old',
          'very fast',
          'broken in half',
        ],
        answer: 1,
        why: [
          'rusty 係舊同生鏽，唔係新淨。',
          '正確。rusty 指「生鏽」，配合 "heavy and rusty" 同 "the chain often came off"，即係又舊又生鏽。',
          'rusty 同速度無關。',
          '文中冇講斷開兩截。',
        ],
      },
      {
        type: 'inference',
        q: 'Why did Mr Lee laugh with his grandchildren?',
        options: [
          'He was angry with them.',
          'He enjoyed riding the old bicycle again.',
          'They bought him a new bicycle.',
          'He fell off the bicycle.',
        ],
        answer: 1,
        why: [
          '文中冇話佢嬲。',
          '正確。佢特意翻新架舊車再踩去公園，仲話 "it still works"，笑係因為開心。',
          '文中冇講買新車。',
          '文中冇講佢跌低。',
        ],
      },
      {
        type: 'main',
        q: 'What is the story mainly about?',
        options: [
          'How to repair a bicycle.',
          'A boy who became an engineer and kept his old bicycle.',
          'Why bicycles are slow.',
          'A trip to the park.',
        ],
        answer: 1,
        why: [
          '修理只係中間嘅事，唔係全文主旨。',
          '正確。全篇由童年舊單車講到佢做工程師、再翻新同一架車。',
          '「慢」只係一句對白，唔係主旨。',
          '去公園只係結尾片段。',
        ],
      },
    ],
  },

  {
    id: 'p6-letter',
    level: 'P6',
    kind: 'letter',
    words: 106,
    title: 'A Letter to the Principal',
    text:
      'Dear Principal Chan,\n\n' +
      'I am writing on behalf of the Student Council. Every day, students wait a long time ' +
      'for the lift because only one lift works. Some students with heavy bags cannot use the stairs. ' +
      'We would like to ask the school to repair the second lift before the exams. ' +
      'We have collected 120 signatures from students in P5 and P6. ' +
      'We understand that repairs cost money. However, we think a working lift is important for ' +
      'everyone\'s safety. If the repair cannot start now, could the school at least open the staff ' +
      'lift during break time?\n\n' +
      'Thank you for your time.\n\n' +
      'Yours sincerely,\n' +
      'Amy Wong',
    questions: [
      {
        type: 'scan',
        q: 'Who is Amy writing to?',
        options: ['Her class teacher.', 'The principal.', 'Her parents.', 'The lift repair company.'],
        answer: 1,
        why: [
          '信中稱呼 "Principal Chan"，唔係班主任。',
          '正確。開頭寫 "Dear Principal Chan" 就係校長。',
          '唔係寫俾家長。',
          '信中係請求學校安排維修，唔係直接寫俾維修公司。',
        ],
      },
      {
        type: 'main',
        q: 'Why does the Student Council write the letter?',
        options: [
          'To ask for a new school bus.',
          'To ask the school to repair the second lift.',
          'To invite the principal to a party.',
          'To complain about homework.',
        ],
        answer: 1,
        why: [
          '信中冇提校車。',
          '正確。信中明確話 "ask the school to repair the second lift before the exams"。',
          '信中冇提派對。',
          '信中冇投訴功課。',
        ],
      },
      {
        type: 'vocab',
        q: 'What does "on behalf of" mean in the letter?',
        options: ['Instead of.', 'For or representing.', 'Against.', 'Without.'],
        answer: 1,
        why: [
          '"Instead of" 係「代替某人做佢嘅事」，但呢度係代表學生會發言。',
          '正確。on behalf of = 代表（for / representing）學生會寫信。',
          '"Against" 係反對，同意思相反。',
          '"Without" 係冇，唔係代表。',
        ],
      },
      {
        type: 'inference',
        q: 'What does the Student Council suggest if the repair cannot start now?',
        options: [
          'Students will buy a new lift.',
          'The school could open the staff lift during break time.',
          'Students will use the stairs every day.',
          'The school will close the lift area.',
        ],
        answer: 1,
        why: [
          '信中冇講學生夾錢買升降機。',
          '正確。信中問 "could the school at least open the staff lift during break time?"',
          '佢哋想要 lift，唔係叫所有人行樓梯。',
          '信中冇講封閉升降機。',
        ],
      },
      {
        type: 'inference',
        q: 'What is the tone of the letter?',
        options: ['Angry and rude.', 'Polite and reasonable.', 'Funny.', 'Sad.'],
        answer: 1,
        why: [
          '信中有 "Thank you for your time"、"Yours sincerely"，唔係粗魯。',
          '正確。既有請求亦有讓步（明白維修要錢），語氣有禮而且講道理。',
          '信中冇搞笑。',
          '雖然有困難，但語氣係理性爭取，唔係悲傷。',
        ],
      },
    ],
  },
  {
    id: 'p3-newgirl',
    level: 'P3',
    kind: 'story',
    difficulty: 1,
    words: 66,
    title: 'The New Girl',
    text:
      'Today is Mia\'s first day at her new school. She feels nervous. ' +
      'She stands alone in the playground. A girl named Sara comes over. ' +
      '"Do you want to play with us?" she asks. Mia smiles and joins the game. ' +
      'At lunch, Sara sits next to Mia. "Thank you," says Mia. ' +
      '"I was scared this morning." "That\'s okay," says Sara. ' +
      '"Everyone is scared on the first day."',
    questions: [
      {
        type: 'detail',
        q: 'How does Mia feel at the beginning of the story?',
        options: ['Excited.', 'Nervous.', 'Angry.', 'Sleepy.'],
        answer: 1,
        why: [
          '文中話佢 "feels nervous"，唔係 excited。',
          '正確。第二句寫 "She feels nervous."',
          '文中冇話佢嬲。',
          '文中冇話佢眼瞓。',
        ],
      },
      {
        type: 'detail',
        q: 'Who asks Mia to play?',
        options: ['Her teacher.', 'Sara.', 'Her mother.', 'The principal.'],
        answer: 1,
        why: [
          '老師冇出現喺操場呢幕。',
          '正確。文中話 "A girl named Sara comes over." 仲問佢想唔想一齊玩。',
          '媽媽冇出現喺故事入面。',
          '校長冇出現喺故事入面。',
        ],
      },
      {
        type: 'detail',
        q: 'What does Mia do after Sara asks her to play?',
        options: ['She runs away.', 'She smiles and joins the game.', 'She starts to cry.', 'She goes home.'],
        answer: 1,
        why: [
          '文中冇話佢走開。',
          '正確。文中話 "Mia smiles and joins the game."',
          '文中冇話佢喊。',
          '文中冇話佢返屋企。',
        ],
      },
      {
        type: 'inference',
        q: 'Why does Sara say "That\'s okay"?',
        options: [
          'She is angry with Mia.',
          'She understands that Mia was scared.',
          'She wants Mia\'s lunch.',
          'She is Mia\'s teacher.',
        ],
        answer: 1,
        why: [
          'Sara 語氣友善，冇嬲。',
          '正確。Mia 話自己驚，Sara 回應 "That\'s okay"，即係明白同安慰佢。',
          '文中冇講爭午餐。',
          'Sara 係同學，唔係老師。',
        ],
      },
      {
        type: 'main',
        q: 'What is the story mainly about?',
        options: [
          'A game in the playground.',
          'A girl who makes a friend on her first day.',
          'Mia\'s lunch.',
          'How to become a teacher.',
        ],
        answer: 1,
        why: [
          '遊戲只係其中一幕。',
          '正確。全篇講 Mia 第一日返新學校，由緊張到識到 Sara。',
          '午餐只係背景。',
          '文章冇講點做老師。',
        ],
      },
    ],
  },
  {
    id: 'p3-sciencefair',
    level: 'P3',
    kind: 'story',
    difficulty: 3,
    words: 106,
    title: 'The Science Fair',
    text:
      'Last Friday, Class 3A held a science fair. Each group had to show one experiment. ' +
      'Amy and Ken made a volcano with baking soda and vinegar. It was not easy. ' +
      'Their first try only made a few bubbles, so they added more vinegar. ' +
      'The second try was better, but the mixture went over the table. ' +
      'They cleaned it up and tried again. This time, the volcano bubbled up high, and the class clapped. ' +
      'Their teacher, Mr Wong, said, "The best part is not the volcano. It is that you tried three times." ' +
      'Amy and Ken smiled. They did not win first prize, but they felt proud.',
    questions: [
      {
        type: 'detail',
        q: 'What did Amy and Ken make?',
        options: ['A volcano.', 'A rocket.', 'A robot.', 'A kite.'],
        answer: 0,
        why: [
          '正確。文中話 "Amy and Ken made a volcano"。',
          '文中冇講火箭。',
          '文中冇講機械人。',
          '文中冇講風箏。',
        ],
      },
      {
        type: 'cause',
        q: 'Why did their first try not work well?',
        options: [
          'They forgot to bring vinegar.',
          'It only made a few bubbles.',
          'The teacher stopped them.',
          'They used too much water.',
        ],
        answer: 1,
        why: [
          '佢哋有 vinegar，只係份量唔夠。',
          '正確。文中話 "Their first try only made a few bubbles"。',
          '老師冇阻止佢哋。',
          '文中冇提水。',
        ],
      },
      {
        type: 'detail',
        q: 'What happened on the second try?',
        options: [
          'It worked perfectly.',
          'The mixture went over the table.',
          'Nothing happened at all.',
          'They gave up.',
        ],
        answer: 1,
        why: [
          '第二次未完美，仲有意外。',
          '正確。文中話 "the mixture went over the table"。',
          '第二次有反應，唔係乜都冇。',
          '佢哋冇放棄，仲試第三次。',
        ],
      },
      {
        type: 'inference',
        q: 'What did Mr Wong think was the best part?',
        options: [
          'The volcano itself.',
          'That they tried three times.',
          'Winning first prize.',
          'Cleaning the table.',
        ],
        answer: 1,
        why: [
          '老師話 "The best part is not the volcano"，即係唔係火山本身。',
          '正確。老師話最好嘅部分係 "you tried three times"。',
          '佢哋冇贏冠軍，老師亦冇提獎項。',
          '清潔只係過程，唔係老師口中嘅重點。',
        ],
      },
      {
        type: 'vocab',
        q: 'Which word best describes Amy and Ken?',
        options: ['Lazy.', 'Determined.', 'Sleepy.', 'Angry.'],
        answer: 1,
        why: [
          '佢哋試咗三次，唔係懶。',
          '正確。試完一次又一次，最貼切係 determined（有毅力）。',
          '文中冇話佢哋眼瞓。',
          '佢哋最後開心、自豪，唔係嬲。',
        ],
      },
    ],
  },
];
