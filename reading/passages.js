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
  {
    id: 'p4-wallet',
    level: 'P4',
    kind: 'story',
    words: 91,
    title: 'The Lost Wallet',
    text:
      'On Monday, Ben found a brown wallet on the floor of the school bus. ' +
      'He opened it and saw a bus card, a photo and twenty dollars. His first idea was to keep ' +
      "the money, but he remembered his teacher's words: 'Honest people return what is not theirs.' " +
      'He gave the wallet to the driver. The next morning, an old lady came to the school office. ' +
      'The wallet was hers. She thanked Ben and gave him a small box of cookies. Ben felt happier ' +
      'than he would have with the money.',
    questions: [
      {
        q: 'What is the story mainly about?',
        type: 'main',
        options: [
          'How Ben spends twenty dollars.',
          'Ben returns a wallet he found.',
          'A bus driver loses a wallet.',
          'How to make cookies.',
        ],
        answer: 1,
        why: [
          '二十元只係其中一個細節，唔係全篇主旨。',
          '正確。全篇由搵到錢包、想留錢、最後歸還，主旨係「誠實歸還」。',
          '司機冇唔見錢包；係老婆婆唔見。',
          '餅乾只係結尾禮物，唔係主旨。',
        ],
      },
      {
        q: 'Where did Ben find the wallet?',
        type: 'detail',
        options: [
          'In the classroom.',
          'On the playground.',
          'On the floor of the school bus.',
          'At the school office.',
        ],
        answer: 2,
        why: [
          '文中冇講課室。',
          '文中冇講操場。',
          '正確。第一句："Ben found a brown wallet on the floor of the school bus."',
          '學校辦公室係老婆婆後來去嘅地方。',
        ],
      },
      {
        q: 'Why did Ben decide to return the wallet?',
        type: 'inference',
        options: [
          'He was afraid of the driver.',
          'He remembered his teacher’s words about honesty.',
          'The wallet was empty.',
          'He wanted the cookies.',
        ],
        answer: 1,
        why: [
          '文中冇講佢怕司機。',
          '正確。文中佢想起老師嘅話：誠實嘅人會歸還唔屬於自己嘅東西。',
          '錢包裏面有二十元，唔係空。',
          '餅乾係後來老婆婆送，歸還之前佢冇諗餅乾。',
        ],
      },
      {
        q: 'In the sentence "Honest people return what is not theirs.", "theirs" means…',
        type: 'vocab',
        options: [
          'Ben’s money.',
          'other people’s things.',
          'the driver’s wallet.',
          'the teacher’s words.',
        ],
        answer: 1,
        why: [
          'theirs 係指「唔屬於自己、屬於別人嘅東西」，唔係 Ben 嘅錢。',
          '正確。theirs = 別人嘅東西；誠實嘅人會歸還唔屬於自己嘅東西。',
          'theirs 唔專指司機；錢包係老婆婆嘅。',
          'theirs 唔係指老師講嘅話。',
        ],
      },
      {
        q: 'Why did the old lady come to the school office?',
        type: 'cause',
        options: [
          'To give Ben some cookies.',
          'To look for her wallet.',
          'To thank the bus driver.',
          'To see the teacher.',
        ],
        answer: 1,
        why: [
          '送餅乾係搵返錢包之後嘅事，唔係嚟學校嘅原因。',
          '正確。佢嚟係因為錢包係佢嘅（"The wallet was hers."），即係嚟搵返錢包。',
          '文中冇講佢去多謝司機。',
          '文中冇講佢要見老師。',
        ],
      },
    ],
  },
  {
    "id": "p1-ball",
    "level": "P1",
    "kind": "story",
    "difficulty": 1,
    "words": 34,
    "title": "My Red Ball",
    "text": "I have a red ball. It is big and round. I play with it in the park. My dog Max runs after it. He cannot catch it. He is happy. I am happy too.",
    "questions": [
      {
        "q": "What is the story mainly about?",
        "type": "main",
        "options": [
          "A boy and his red ball.",
          "A cat and a fish.",
          "A trip to school.",
          "A blue kite."
        ],
        "answer": 0,
        "why": [
          "正確。全篇講紅波、同狗一齊玩。",
          "文中冇貓同魚。",
          "文中冇講返學。",
          "係紅波，唔係藍風箏。"
        ]
      },
      {
        "q": "Where does the writer play with the ball?",
        "type": "detail",
        "options": [
          "In the park.",
          "At school.",
          "In the house.",
          "At the beach."
        ],
        "answer": 0,
        "why": [
          "正確。文中：I play with it in the park.",
          "文中冇講學校。",
          "文中冇講屋企。",
          "文中冇講海灘。"
        ]
      },
      {
        "q": "Who runs after the ball?",
        "type": "detail",
        "options": [
          "Max the dog.",
          "Mum.",
          "A cat.",
          "A bird."
        ],
        "answer": 0,
        "why": [
          "正確。文中：My dog Max runs after it.",
          "文中冇講媽媽。",
          "文中冇貓。",
          "文中冇雀。"
        ]
      },
      {
        "q": "How does Max feel when he cannot catch the ball?",
        "type": "inference",
        "options": [
          "Angry.",
          "Happy.",
          "Sleepy.",
          "Sad."
        ],
        "answer": 1,
        "why": [
          "文中冇講佢嬲。",
          "正確。文中：He is happy.",
          "文中冇講眼瞓。",
          "文中冇講傷心。"
        ]
      },
      {
        "q": "The word 'round' tells us the ball is…",
        "type": "vocab",
        "options": [
          "shaped like a circle.",
          "very small.",
          "made of wood.",
          "cold."
        ],
        "answer": 0,
        "why": [
          "正確。round = 圓的，形狀似圓圈。",
          "round 唔係講大小。",
          "round 唔係講材料。",
          "round 唔係講溫度。"
        ]
      }
    ]
  },
  {
    "id": "p1-ants",
    "level": "P1",
    "kind": "story",
    "difficulty": 2,
    "words": 50,
    "title": "The Ant and the Bread",
    "text": "One day, a little ant found a piece of bread. It was too big to carry. The ant called its friends. Ten ants came. They pushed and pulled together. Slowly, the bread moved. At last, it was in their home. The ants shared the bread. Working together made them strong.",
    "questions": [
      {
        "q": "What is the story mainly about?",
        "type": "main",
        "options": [
          "Ants working together.",
          "A hungry bird.",
          "A big garden.",
          "How to make bread."
        ],
        "answer": 0,
        "why": [
          "正確。全篇講螞蟻合力搬麵包。",
          "文中冇雀。",
          "文中冇花園。",
          "文中冇講整麵包。"
        ]
      },
      {
        "q": "What did the ant find?",
        "type": "detail",
        "options": [
          "A piece of bread.",
          "A leaf.",
          "A stone.",
          "A cup."
        ],
        "answer": 0,
        "why": [
          "正確。文中：a little ant found a piece of bread.",
          "文中冇樹葉。",
          "文中冇石頭。",
          "文中冇杯。"
        ]
      },
      {
        "q": "Why did the ant call its friends?",
        "type": "inference",
        "options": [
          "The bread was too big to carry alone.",
          "It wanted to play.",
          "It was hungry.",
          "It was lost."
        ],
        "answer": 0,
        "why": [
          "正確。文中：too big to carry，所以叫朋友幫手。",
          "佢叫朋友係為搬麵包，唔係玩。",
          "肚餓係原因之一，但叫朋友係因為搬唔動。",
          "文中冇講佢迷路。"
        ]
      },
      {
        "q": "In the story, 'At last' means…",
        "type": "vocab",
        "options": [
          "in the end.",
          "at once.",
          "every day.",
          "at night."
        ],
        "answer": 0,
        "why": [
          "正確。At last = 最後、終於。",
          "at once = 立刻，唔係 At last。",
          "every day = 每日。",
          "at night = 夜晚。"
        ]
      },
      {
        "q": "Why did the bread move?",
        "type": "cause",
        "options": [
          "The ants pushed and pulled together.",
          "The wind blew it.",
          "A boy carried it.",
          "It was small."
        ],
        "answer": 0,
        "why": [
          "正確。文中：They pushed and pulled together.",
          "文中冇講風。",
          "文中冇男孩。",
          "麵包唔細，係太大搬唔動。"
        ]
      }
    ]
  },
  {
    "id": "p2-rainy",
    "level": "P2",
    "kind": "story",
    "difficulty": 1,
    "words": 64,
    "title": "A Rainy Day Plan",
    "text": "On Saturday, Lily wanted to go to the beach. But it rained all morning. She looked out of the window and felt sad. Her brother said, 'Let's make a tent in the living room.' They used two chairs and a big blanket. They read books and ate sandwiches inside. In the afternoon, the sun came out. Lily said, 'This was better than the beach!'",
    "questions": [
      {
        "q": "What is the story mainly about?",
        "type": "main",
        "options": [
          "How Lily had fun on a rainy day.",
          "How to swim at the beach.",
          "Lily's new school.",
          "A lost dog."
        ],
        "answer": 0,
        "why": [
          "正確。全篇講落雨天喺屋企搭帳篷玩。",
          "文中冇游水。",
          "文中冇講新學校。",
          "文中冇狗。"
        ]
      },
      {
        "q": "What did Lily and her brother use to make the tent?",
        "type": "detail",
        "options": [
          "Two chairs and a blanket.",
          "A table and a box.",
          "Two beds and a sheet.",
          "A door and a bag."
        ],
        "answer": 0,
        "why": [
          "正確。文中：They used two chairs and a big blanket.",
          "文中冇桌同箱。",
          "文中冇床同床單。",
          "文中冇門同袋。"
        ]
      },
      {
        "q": "Why did Lily feel sad at first?",
        "type": "inference",
        "options": [
          "She wanted to go to the beach but it rained.",
          "She lost her ball.",
          "Her brother was angry.",
          "She was hungry."
        ],
        "answer": 0,
        "why": [
          "正確。想去海灘但落雨，所以唔開心。",
          "文中冇波。",
          "哥哥冇嬲。",
          "文中冇講肚餓。"
        ]
      },
      {
        "q": "A blanket is…",
        "type": "vocab",
        "options": [
          "something we use to keep warm.",
          "a kind of food.",
          "a small chair.",
          "a game."
        ],
        "answer": 0,
        "why": [
          "正確。blanket = 毛毯，用嚟保暖。",
          "blanket 唔係食物。",
          "blanket 唔係椅。",
          "blanket 唔係遊戲。"
        ]
      },
      {
        "q": "At the end, Lily thought the tent was…",
        "type": "inference",
        "options": [
          "better than the beach.",
          "boring.",
          "too small.",
          "wet."
        ],
        "answer": 0,
        "why": [
          "正確。文中：This was better than the beach!",
          "佢覺得好玩，唔係悶。",
          "文中冇講太細。",
          "文中冇講濕。"
        ]
      }
    ]
  },
  {
    "id": "p2-newstudent",
    "level": "P2",
    "kind": "story",
    "difficulty": 2,
    "words": 57,
    "title": "The New Student",
    "text": "On Monday, a new boy came to Class 2B. His name was Adam. He was from Canada. At first, he sat alone at lunch. Two girls, Kate and Amy, asked him to play football. Adam smiled and said yes. After the game, they showed him the school garden. Adam said, 'Thank you. I feel at home now.'",
    "questions": [
      {
        "q": "What is the story mainly about?",
        "type": "main",
        "options": [
          "A new boy makes friends at school.",
          "A football match on TV.",
          "A trip to Canada.",
          "A school garden."
        ],
        "answer": 0,
        "why": [
          "正確。全篇講新同學 Adam 點樣識到朋友。",
          "文中講踢足球，唔係電視比賽。",
          "Adam 來自加拿大，但唔係講去旅行。",
          "花園只係其中一幕。"
        ]
      },
      {
        "q": "Where was Adam from?",
        "type": "detail",
        "options": [
          "Canada.",
          "China.",
          "England.",
          "Japan."
        ],
        "answer": 0,
        "why": [
          "正確。文中：He was from Canada.",
          "文中冇中國。",
          "文中冇英國。",
          "文中冇日本。"
        ]
      },
      {
        "q": "How did Adam feel at first?",
        "type": "inference",
        "options": [
          "Lonely.",
          "Excited.",
          "Angry.",
          "Proud."
        ],
        "answer": 0,
        "why": [
          "正確。文中：he sat alone at lunch，即係起初好孤單。",
          "文中冇講佢興奮。",
          "文中冇講佢嬲。",
          "文中冇講佢自豪。"
        ]
      },
      {
        "q": "In the story, 'I feel at home' means…",
        "type": "vocab",
        "options": [
          "I feel comfortable here.",
          "I want to go home.",
          "I am at my house.",
          "I am lost."
        ],
        "answer": 0,
        "why": [
          "正確。feel at home = 覺得自在、好似喺屋企咁。",
          "唔係想返屋企。",
          "唔係字面「我喺屋企」。",
          "唔係迷路。"
        ]
      },
      {
        "q": "Why did Kate and Amy ask Adam to play?",
        "type": "cause",
        "options": [
          "They wanted to welcome him.",
          "They needed a ball.",
          "The teacher told them to.",
          "Adam asked them first."
        ],
        "answer": 0,
        "why": [
          "正確。佢哋見 Adam 自己坐，想歡迎佢、同佢做朋友。",
          "文中冇講佢哋欠一個波。",
          "文中冇講老師叫。",
          "係 Kate 同 Amy 先邀請 Adam。"
        ]
      }
    ]
  },
  {
    "id": "p5-lighthouse",
    "level": "P5",
    "kind": "story",
    "difficulty": 2,
    "words": 95,
    "title": "The Lighthouse Keeper",
    "text": "Every evening, old Mr Chan climbed the hill to the lighthouse. He cleaned the glass and lit the lamp. Ships far out at sea followed the light home. One stormy night, the lamp went out. Mr Chan hurried up the hill in the rain. He fixed the lamp with shaking hands. When the light returned, a small boat turned towards the harbour. Its captain later said, 'We would have been lost without you.' Mr Chan only smiled. To him, it was just his job.",
    "questions": [
      {
        "q": "What is the story mainly about?",
        "type": "main",
        "options": [
          "A lighthouse keeper does his duty.",
          "A ship races home.",
          "How to build a lighthouse.",
          "A boy learns to swim."
        ],
        "answer": 0,
        "why": [
          "正確。全篇講 Mr Chan 每夜點燈、風雨中都去修理，盡自己嘅責任。",
          "船返港只係其中一個情節。",
          "文中冇講點建燈塔。",
          "文中冇男孩學游水。"
        ]
      },
      {
        "q": "What did Mr Chan do every evening?",
        "type": "detail",
        "options": [
          "Climbed the hill and lit the lamp.",
          "Cooked dinner.",
          "Cleaned the harbour.",
          "Read the newspaper."
        ],
        "answer": 0,
        "why": [
          "正確。文中：climbed the hill… cleaned the glass and lit the lamp.",
          "文中冇煮飯。",
          "文中冇清潔海港。",
          "文中冇睇報紙。"
        ]
      },
      {
        "q": "Why did the captain thank Mr Chan?",
        "type": "inference",
        "options": [
          "His light guided the boat to safety.",
          "He gave them food.",
          "He repaired their boat.",
          "He called the harbour."
        ],
        "answer": 0,
        "why": [
          "正確。無燈塔嘅光，船會迷失；所以船長多謝佢。",
          "文中冇送食物。",
          "Mr Chan 修燈，唔係修船。",
          "文中冇講打電話。"
        ]
      },
      {
        "q": "A harbour is…",
        "type": "vocab",
        "options": [
          "a safe place for boats.",
          "a kind of lamp.",
          "a hill.",
          "a storm."
        ],
        "answer": 0,
        "why": [
          "正確。harbour = 海港，船停泊嘅安全地方。",
          "lamp 係燈，唔係 harbour。",
          "hill 係山。",
          "storm 係暴風雨。"
        ]
      },
      {
        "q": "Why did Mr Chan hurry up the hill in the rain?",
        "type": "cause",
        "options": [
          "The lamp had gone out.",
          "He was late for dinner.",
          "He wanted to see the storm.",
          "Someone called him."
        ],
        "answer": 0,
        "why": [
          "正確。文中：the lamp went out，所以佢冒雨去修理。",
          "文中冇講晚餐。",
          "佢係去修燈，唔係睇風暴。",
          "文中冇人叫佢。"
        ]
      }
    ]
  },
  {
    "id": "p5-schoolplay",
    "level": "P5",
    "kind": "story",
    "difficulty": 3,
    "words": 100,
    "title": "The Smallest Part",
    "text": "For the school play, Sara was given the smallest part: a tree. At first, she was disappointed. Her friends had long speeches, while she had only one line. But Sara decided to make her tree the best tree on stage. She practised standing still and moving her branches at the right moment. On the night, the audience laughed and clapped every time the tree moved. After the show, the teacher said, 'There are no small parts, only small actors.' Sara never forgot that.",
    "questions": [
      {
        "q": "What is the story mainly about?",
        "type": "main",
        "options": [
          "Even a small part can be important.",
          "How to build a stage.",
          "Sara's long speech.",
          "A singing competition."
        ],
        "answer": 0,
        "why": [
          "正確。Sara 由失望到明白：小角色都可以做得好好。",
          "文中冇講搭舞台。",
          "Sara 只有一句台詞，冇長演講。",
          "文中冇唱歌比賽。"
        ]
      },
      {
        "q": "What part did Sara play?",
        "type": "detail",
        "options": [
          "A tree.",
          "A princess.",
          "A teacher.",
          "A bird."
        ],
        "answer": 0,
        "why": [
          "正確。文中：a tree。",
          "文中冇公主。",
          "文中冇老師角色。",
          "文中冇雀。"
        ]
      },
      {
        "q": "Why was Sara disappointed at first?",
        "type": "inference",
        "options": [
          "Her part was small and had only one line.",
          "She forgot her words.",
          "She was ill.",
          "She did not like the teacher."
        ],
        "answer": 0,
        "why": [
          "正確。文中：the smallest part… only one line，所以失望。",
          "文中冇講忘記台詞。",
          "文中冇講病。",
          "文中冇講唔鍾意老師。"
        ]
      },
      {
        "q": "The audience is…",
        "type": "vocab",
        "options": [
          "the people watching the play.",
          "the actors.",
          "the stage.",
          "the script."
        ],
        "answer": 0,
        "why": [
          "正確。audience = 觀眾。",
          "actors 係演員。",
          "stage 係舞台。",
          "script 係劇本。"
        ]
      },
      {
        "q": "Why did the audience laugh and clap?",
        "type": "cause",
        "options": [
          "The tree moved at funny moments.",
          "Sara spoke loudly.",
          "The play was over.",
          "The teacher asked them."
        ],
        "answer": 0,
        "why": [
          "正確。文中：every time the tree moved，觀眾就笑同拍手。",
          "Sara 只有一句台詞，唔係因為大聲。",
          "劇未做完。",
          "文中冇講老師叫。"
        ]
      }
    ]
  },
  {
    "id": "p6-recycling",
    "level": "P6",
    "kind": "letter",
    "difficulty": 2,
    "words": 105,
    "title": "A Letter About Recycling",
    "text": "Dear Editor, I am writing to ask our school to start a recycling programme. Every day, our classrooms throw away hundreds of paper sheets. Most of them are only used on one side. If we placed a recycling box in each classroom, we could save both paper and money. Some students worry that the boxes will look untidy. However, we can design colourful boxes and empty them every Friday. The Earth Club has prepared a short talk for assembly. We hope the school will consider our idea. Yours faithfully, Chris Lee",
    "questions": [
      {
        "q": "What is the letter mainly about?",
        "type": "main",
        "options": [
          "A student suggests a recycling programme.",
          "A trip to a recycling centre.",
          "How paper is made.",
          "A letter about a football match."
        ],
        "answer": 0,
        "why": [
          "正確。全篇係學生寫信建議學校推行回收。",
          "文中冇參觀回收中心。",
          "文中冇講造紙過程。",
          "文中冇足球比賽。"
        ]
      },
      {
        "q": "What do the classrooms throw away every day?",
        "type": "detail",
        "options": [
          "Hundreds of paper sheets.",
          "Plastic bottles.",
          "Old chairs.",
          "Food."
        ],
        "answer": 0,
        "why": [
          "正確。文中：throw away hundreds of paper sheets。",
          "文中冇講膠樽。",
          "文中冇舊椅。",
          "文中冇食物。"
        ]
      },
      {
        "q": "Why does Chris say most of the paper is wasted?",
        "type": "inference",
        "options": [
          "It is only used on one side.",
          "It is too small.",
          "It is dirty.",
          "It is old."
        ],
        "answer": 0,
        "why": [
          "正確。文中：Most of them are only used on one side，另一面未用就丟。",
          "文中冇講太細。",
          "文中冇講污糟。",
          "文中冇講舊。"
        ]
      },
      {
        "q": "'Consider' means…",
        "type": "vocab",
        "options": [
          "think about.",
          "throw away.",
          "design.",
          "empty."
        ],
        "answer": 0,
        "why": [
          "正確。consider = 考慮、想一想。",
          "throw away = 丟棄。",
          "design = 設計。",
          "empty = 清空。"
        ]
      },
      {
        "q": "Why does Chris suggest colourful boxes?",
        "type": "cause",
        "options": [
          "To make them look tidy.",
          "To sell them.",
          "To make them heavy.",
          "To hide them."
        ],
        "answer": 0,
        "why": [
          "正確。因為有人擔心回收箱唔整齊，彩色箱可以令佢好睇啲。",
          "文中冇講賣。",
          "文中冇講重量。",
          "文中冇講收埋。"
        ]
      }
    ]
  },
  {
    "id": "p6-river",
    "level": "P6",
    "kind": "report",
    "difficulty": 3,
    "words": 110,
    "title": "The River Report",
    "text": "Last term, the Science Club studied the river near our school. We tested the water every week for three months. At the beginning, the water was grey and smelt bad. We found rubbish, including plastic bags and old bottles, along the banks. After we reported the problem to the district office, workers came to clean the river. They also put up signs asking people not to litter. By the end of the term, the water was clearer and we saw fish again. Our teacher said that small actions can make a big difference.",
    "questions": [
      {
        "q": "What is the report mainly about?",
        "type": "main",
        "options": [
          "Students helped clean a river.",
          "A fishing trip.",
          "How to test water.",
          "A new school building."
        ],
        "answer": 0,
        "why": [
          "正確。全篇講科學會調查河流、報告問題、最後河水變清。",
          "文中冇釣魚旅行。",
          "驗水只係方法，唔係主旨。",
          "文中冇新建築。"
        ]
      },
      {
        "q": "How often did the club test the water?",
        "type": "detail",
        "options": [
          "Every week.",
          "Every day.",
          "Every month.",
          "Once a year."
        ],
        "answer": 0,
        "why": [
          "正確。文中：tested the water every week。",
          "文中冇每日。",
          "文中冇每月。",
          "文中冇每年一次。"
        ]
      },
      {
        "q": "Why did the workers put up signs?",
        "type": "inference",
        "options": [
          "To ask people not to litter.",
          "To sell the river.",
          "To warn about fish.",
          "To close the river."
        ],
        "answer": 0,
        "why": [
          "正確。文中：signs asking people not to litter。",
          "文中冇賣。",
          "文中冇警告魚。",
          "文中冇封河。"
        ]
      },
      {
        "q": "'Litter' means…",
        "type": "vocab",
        "options": [
          "rubbish left in the wrong place.",
          "clean water.",
          "a kind of fish.",
          "a boat."
        ],
        "answer": 0,
        "why": [
          "正確。litter = 亂丟嘅垃圾。",
          "litter 唔係清水。",
          "litter 唔係魚。",
          "litter 唔係船。"
        ]
      },
      {
        "q": "Why did fish return?",
        "type": "cause",
        "options": [
          "The water became clearer.",
          "The club fed them.",
          "The river got warmer.",
          "Workers put fish there."
        ],
        "answer": 0,
        "why": [
          "正確。文中：the water was clearer and we saw fish again。",
          "文中冇餵魚。",
          "文中冇講變暖。",
          "文中冇放魚。"
        ]
      }
    ]
  },
];
