// Original, short questions for upper-elementary pupils. No remote API/assets.
// Each tuple: prompt, correct answer, three distractors, explanation.
const english=[
 ['September 다음 달은?','October','August','November','December','9월 September 다음은 10월 October예요.'],
 ['일주일은 며칠인가요? 영어로 골라보세요.','Seven days','Five days','Six days','Ten days','일주일은 7일, seven days예요.'],
 ['“나는 배가 고파요.”는?','I’m hungry.','I’m sleepy.','I’m cold.','I’m busy.','hungry는 배가 고프다는 뜻이에요.'],
 ['“도서관은 어디인가요?”는?','Where is the library?','What time is it?','How old are you?','What is your name?','Where는 장소를 물을 때 사용해요.'],
 ['“고마워요.”에 어울리는 대답은?','You’re welcome.','Good night.','I’m hungry.','It’s Monday.','You’re welcome.은 감사 인사에 대한 대답이에요.'],
 ['“나는 수영할 수 있어요.”는?','I can swim.','I can fly.','I can cook.','I can sing.','swim은 수영하다, can은 할 수 있다는 뜻이에요.'],
 ['“빨간색”을 영어로 쓰면?','red','blue','green','yellow','red는 빨간색이에요.'],
 ['“왼쪽으로 도세요.”는?','Turn left.','Turn right.','Go straight.','Sit down.','left는 왼쪽, right는 오른쪽이에요.'],
 ['“직진하세요.”는?','Go straight.','Turn left.','Stand up.','Open the door.','Go straight.은 똑바로 가라는 뜻이에요.'],
 ['“지금 몇 시인가요?”는?','What time is it?','Where are you?','Who is she?','How are you?','What time은 시간을 물을 때 써요.'],
 ['“문을 닫아 주세요.”는?','Close the door, please.','Open the book, please.','Sit down, please.','Look at the sky, please.','close는 닫다, door는 문이에요.'],
 ['“나는 열두 살이에요.”는?','I’m twelve years old.','I’m twenty years old.','I’m ten years old.','I’m two years old.','twelve는 12, twenty는 20이에요.'],
 ['“좋은 아침이에요.”는?','Good morning.','Good evening.','Good night.','Goodbye.','morning은 아침이에요.'],
 ['“그녀는 나의 선생님이에요.”는?','She is my teacher.','He is my brother.','It is my pencil.','They are my friends.','She는 그녀, teacher는 선생님이에요.'],
 ['“물을 좀 마시고 싶어요.”는?','I’d like some water.','I like winter.','I have a watch.','I can walk.','water는 물이에요.'],
 ['Monday 다음 요일은?','Tuesday','Sunday','Friday','Saturday','월요일 다음은 화요일 Tuesday예요.'],
 ['“겨울”은 영어로?','winter','spring','summer','autumn','winter는 겨울이에요.'],
 ['“책상 아래에”는?','under the desk','on the desk','next to the desk','behind the desk','under는 아래에, on은 위에라는 뜻이에요.'],
 ['“나는 어제 학교에 갔다.” I ___ to school yesterday.','went','go','goes','going','yesterday는 어제이고, go의 과거형은 went예요.'],
 ['빈칸에 알맞은 말은? She ___ two cats.','has','have','are','am','She와 함께 현재의 소유를 나타낼 때 has를 써요.'],
 ['“나는 축구하는 것을 좋아해요.”는?','I like playing soccer.','I like reading books.','I like drawing pictures.','I like listening to music.','playing soccer는 축구하는 것이에요.'],
 ['“생일 축하해!”는?','Happy birthday!','Happy New Year!','Good luck!','See you tomorrow!','Happy birthday!는 생일을 축하하는 말이에요.'],
 ['“내일 만나요.”는?','See you tomorrow.','See you yesterday.','Good morning.','Nice to meet you.','tomorrow는 내일이에요.'],
 ['“사과 세 개”는?','three apples','two apples','four apples','five apples','three는 3이고, 여러 개의 사과는 apples라고 해요.'],
 ['“오늘은 맑아요.”는?','It’s sunny today.','It’s rainy today.','It’s snowy today.','It’s cloudy today.','sunny는 날씨가 맑다는 뜻이에요.'],
 ['“의사”는 영어로?','doctor','driver','farmer','singer','doctor는 의사, driver는 운전사예요.'],
 ['“나는 한국에 살아요.”는?','I live in Korea.','I leave Korea.','I visit the moon.','I like cookies.','live in은 어느 곳에 산다는 뜻이에요.'],
 ['“함께 놀자!”는?','Let’s play together!','Please be quiet.','Don’t run.','Close your eyes.','Let’s는 함께 무엇을 하자고 제안하는 말이에요.'],
 ['“이 책은 얼마인가요?”는?','How much is this book?','How many books?','Where is my book?','Whose book is this?','How much는 가격을 물을 때 사용해요.'],
 ['“가장 큰”에 알맞은 말은?','biggest','smallest','shortest','youngest','big의 최상급 biggest는 가장 크다는 뜻이에요.']
];
const knowledge=[
 ['낮과 밤이 생기는 주된 이유는?','지구의 자전','달의 공전','구름의 이동','바다의 파도','지구가 스스로 돌면서 햇빛을 받는 쪽이 달라져요.'],
 ['태양계에서 가장 큰 행성은?','목성','지구','화성','금성','목성은 태양계의 행성 중 가장 커요.'],
 ['훈민정음을 창제한 왕은?','세종','정조','태조','영조','세종대왕이 훈민정음을 창제했어요.'],
 ['1km는 몇 m일까요?','1,000m','10m','100m','10,000m','킬로미터의 킬로는 1,000을 뜻해요.'],
 ['물이 얼어서 고체가 되면?','얼음','수증기','이슬','안개','얼음은 물의 고체 상태예요.'],
 ['지구가 태양 주위를 한 바퀴 도는 기간은 약?','1년','1일','1주일','1시간','지구의 공전 주기는 약 1년이에요.'],
 ['달은 주로 무엇 때문에 밝게 보일까요?','태양빛을 반사해서','스스로 불타서','전등이 있어서','지구의 소리 때문에','달은 태양빛을 반사해 밝게 보여요.'],
 ['곤충의 다리는 보통 몇 개일까요?','6개','4개','8개','10개','곤충은 다리가 6개예요. 거미는 곤충이 아니에요.'],
 ['고래는 어느 동물 무리에 속할까요?','포유류','어류','조류','곤충','고래는 새끼에게 젖을 먹이는 포유류예요.'],
 ['식물이 광합성에 이용하는 빛은 주로?','햇빛','달빛만','별빛만','번개만','식물은 주로 햇빛 에너지를 이용해 양분을 만들어요.'],
 ['태양은 어떤 천체일까요?','스스로 빛을 내는 별','행성','위성','혜성','태양은 스스로 빛과 열을 내는 별이에요.'],
 ['지구의 자연 위성은?','달','금성','태양','목성','달은 지구 주위를 도는 자연 위성이에요.'],
 ['태양에서 가장 가까운 행성은?','수성','지구','토성','해왕성','태양에서 가장 가까운 행성은 수성이에요.'],
 ['소리를 들을 때 주로 사용하는 기관은?','귀','눈','코','혀','귀는 소리의 진동을 받아들이는 기관이에요.'],
 ['자석이 잘 끌어당기는 물질은?','철','나무','유리','종이','철은 자석에 잘 붙는 물질이에요.'],
 ['온도를 나타내는 단위는?','섭씨도(℃)','미터(m)','킬로그램(kg)','리터(L)','℃는 섭씨온도를 나타내는 기호예요.'],
 ['일 년 중 31일이 아닌 달은?','4월','1월','7월','12월','4월은 30일까지 있어요.'],
 ['1시간은 몇 분일까요?','60분','30분','90분','100분','1시간은 60분이에요.'],
 ['정사각형의 네 각은 각각 몇 도일까요?','90도','45도','60도','120도','정사각형의 네 각은 모두 직각, 90도예요.'],
 ['삼각형의 세 내각을 더하면?','180도','90도','270도','360도','평면에서 삼각형의 내각의 합은 180도예요.'],
 ['지구 표면에서 더 넓은 부분은?','바다','사막','숲','도시','바다는 지구 표면의 약 70%를 차지해요.'],
 ['해가 뜨는 쪽을 나타내는 기본 방위는?','동쪽','서쪽','남쪽','북쪽','해는 대체로 동쪽에서 떠서 서쪽으로 져요.'],
 ['거미의 다리는 몇 개일까요?','8개','4개','6개','12개','거미는 다리가 8개예요.'],
 ['지구가 물체를 끌어당기는 힘은?','중력','마찰력','탄성력','자기력','중력 때문에 물체가 땅 쪽으로 떨어져요.'],
 ['씨앗에서 싹이 나는 것을 무엇이라 할까요?','발아','증발','응결','자전','씨앗에서 싹이 트는 것은 발아예요.'],
 ['흐르는 물의 힘을 이용한 발전은?','수력 발전','풍력 발전','태양광 발전','화력 발전','수력 발전은 물의 힘을 이용해요.'],
 ['바람의 힘을 이용한 발전은?','풍력 발전','수력 발전','화력 발전','원자력 발전','풍력 발전은 바람으로 발전기를 돌려요.'],
 ['대한민국의 수도는?','서울','부산','인천','대전','대한민국의 수도는 서울이에요.'],
 ['한글날은 몇 월 며칠일까요?','10월 9일','3월 1일','5월 5일','8월 15일','10월 9일은 훈민정음 반포를 기념하고 한글의 가치를 기리는 한글날이에요.'],
 ['우리나라 화폐의 기본 단위는?','원','달러','엔','유로','대한민국 화폐의 기본 단위는 원이에요.']
];
export const MISSION_QUESTIONS=Object.freeze([...english.map((q,i)=>({id:'en-'+i,category:'영어',level:i>=18?2:1,prompt:q[0],answers:q.slice(1,5),explanation:q[5]})),...knowledge.map((q,i)=>({id:'ko-'+i,category:'상식',level:i>=18?2:1,prompt:q[0],answers:q.slice(1,5),explanation:q[5]}))]);
export function shuffled(values,random=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function pickQuestion(category,used,stage,random=Math.random){
 const pool=MISSION_QUESTIONS.filter(q=>q.category===category&&!used.has(q.id)&&(stage>1||q.level===1));
 const q=shuffled(pool,random)[0];if(!q)throw Error('사용 가능한 문제가 없습니다.');used.add(q.id);
 const choices=shuffled(q.answers,random);return{...q,choices,correct:choices.indexOf(q.answers[0])};
}
