/**
 * Hanuman Chalisa Lessons Data
 * 40 verses (chaupais) and 2 dohas (couplets) teaching the sacred Hanuman Chalisa
 */

export type LessonType = {
  id: string;
  number: number;
  title: string;
  type: 'doha' | 'chaupai';
  text: string;
  transliteration?: string;
  meaning?: string;
  image?: any;
};

export const CHALISA_LESSONS: LessonType[] = [
  // Introductory Dohas
  {
    id: 'lesson-1',
    number: 1,
    title: 'Doha 1',
    type: 'doha',
    text:
      'श्री गुरु चरन सरोज रज, निज मनु मुकुर सूधारि ।\n' +
      'बरनऊं रघुबर बिमल जसु, जो दायकु फल चारि ॥',
    transliteration:
      'Shri guru charan saroj raj, nij manu mukuru sudhari.\n' +
      'Baranau Raghubar bimal jasu, jo dayaku phal chari.',
    meaning:
      "Cleansing the mirror of my mind with the dust of the Guru’s lotus feet, I describe Lord Rama’s pure glory, which grants the four fruits of life (dharma, artha, kama, moksha).",
    image: require('../../assets/images/lessons/d1.jpg'),
  },
  {
    id: 'lesson-2',
    number: 2,
    title: 'Doha 2',
    type: 'doha',
    text:
      'बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार ।\n' +
      'बल बुद्धि बिद्या देहु मोहिं, हरहु कलेस विकार ॥',
    transliteration:
      'Buddhiheen tanu janike, sumirau Pavan-Kumar.\n' +
      'Bal buddhi vidya dehu mohi, harahu kales vikar.',
    meaning:
      'Knowing myself to be lacking in wisdom, I remember Hanuman, son of the Wind. Grant me strength, intellect, and knowledge, and remove my sorrows and impurities.',
    image: require('../../assets/images/lessons/d2.jpg'),
  },

  // 40 Chaupais
  {
    id: 'lesson-3',
    number: 3,
    title: 'Chaupai 1',
    type: 'chaupai',
    text: 'जय हनुमान ज्ञान गुन सागर ।\nजय कपीस तिहुँ लोक उजागर ॥',
    transliteration: 'Jai Hanuman gyan gun sagar.\nJai Kapis tihun lok ujagar.',
    meaning:
      'Victory to Hanuman, ocean of wisdom and virtues. Victory to the lord of the monkeys, famous in the three worlds.',
    image: require('../../assets/images/lessons/c1.jpg'),
  },
  {
    id: 'lesson-4',
    number: 4,
    title: 'Chaupai 2',
    type: 'chaupai',
    text: 'राम दूत अतुलित बल धामा ।\nअंजनि पुत्र पवनसुत नामा ॥',
    transliteration: 'Ram doot atulit bal dhama.\nAnjani putra Pavansut nama.',
    meaning:
      'You are Rama’s messenger and the abode of incomparable strength—known as Anjani’s son and the son of the Wind.',
    image: require('../../assets/images/lessons/c2.jpg'),
  },
  {
    id: 'lesson-5',
    number: 5,
    title: 'Chaupai 3',
    type: 'chaupai',
    text: 'महावीर विक्रम बजरंगी ।\nकुमति निवार सुमति के संगी ॥',
    transliteration: 'Mahavir vikram Bajrangi.\nKumati nivar sumati ke sangi.',
    meaning:
      'O mighty hero, powerful as thunder—destroyer of evil thoughts and companion of good sense.',
    image: require('../../assets/images/lessons/c2.jpg'),
  },
  {
    id: 'lesson-6',
    number: 6,
    title: 'Chaupai 4',
    type: 'chaupai',
    text: 'कंचन बरन बिराज सुबेसा ।\nकानन कुंडल कुंचित केसा ॥',
    transliteration: 'Kanchan baran biraj subesa.\nKanan kundal kunchit kesa.',
    meaning:
      'You shine with a golden complexion and a splendid form, with earrings and curly hair.',
    image: require('../../assets/images/lessons/c2.jpg'),
  },
  {
    id: 'lesson-7',
    number: 7,
    title: 'Chaupai 5',
    type: 'chaupai',
    text: 'हाथ बज्र औ ध्वजा बिराजै ।\nकाँधे मूँज जनेऊ साजै ॥',
    transliteration: 'Haath bajra au dhvaja birajai.\nKaandhe moonj janeu saajai.',
    meaning:
      'A thunderbolt and flag adorn your hands; a sacred thread of munja grass adorns your shoulder.',
      image: require('../../assets/images/lessons/c3.jpg'),
  },
  {
    id: 'lesson-8',
    number: 8,
    title: 'Chaupai 6',
    type: 'chaupai',
    text: 'शंकर सुवन केसरी नंदन ।\nतेज प्रताप महा जग बंदन ॥',
    transliteration: 'Shankar suvan Kesari nandan.\nTej pratap maha jag bandan.',
    meaning:
      'O son of Kesari, embodiment of Shiva’s power—your glory and radiance are revered by the whole world.',
    image: require('../../assets/images/lessons/c3.jpg'),
  },
  {
    id: 'lesson-9',
    number: 9,
    title: 'Chaupai 7',
    type: 'chaupai',
    text: 'विद्यावान गुनी अति चातुर ।\nराम काज करिबे को आतुर ॥',
    transliteration: 'Vidyavan guni ati chatur.\nRam kaaj karibe ko aatur.',
    meaning:
      'You are learned, virtuous, and exceedingly clever—ever eager to do Lord Rama’s work.',
    image: require('../../assets/images/lessons/c4.jpg'),
  },
  {
    id: 'lesson-10',
    number: 10,
    title: 'Chaupai 8',
    type: 'chaupai',
    text: 'प्रभु चरित्र सुनिबे को रसिया ।\nराम लखन सीता मन बसिया ॥',
    transliteration: 'Prabhu charitra sunibe ko rasiya.\nRam Lakhan Sita man basiya.',
    meaning:
      'You delight in hearing the Lord’s deeds; Rama, Lakshmana, and Sita dwell in your heart.',
      image: require('../../assets/images/lessons/c4.jpg'),
  },
  {
    id: 'lesson-11',
    number: 11,
    title: 'Chaupai 9',
    type: 'chaupai',
    text: 'सूक्ष्म रूप धरी सियहिं दिखावा ।\nबिकट रूप धरि लंक जरावा ॥',
    transliteration: 'Sookshma roop dhari siyahi dikhava.\nBikat roop dhari lank jarava.',
    meaning:
      'You appeared to Sita in a tiny form, and in a terrifying form you burned Lanka.',
    image: require('../../assets/images/lessons/c7.jpg'),
  },
  {
    id: 'lesson-12',
    number: 12,
    title: 'Chaupai 10',
    type: 'chaupai',
    text: 'भीम रूप धरि असुर सँहारे ।\nरामचन्द्र के काज सँवारे ॥',
    transliteration: 'Bheem roop dhari asur sanhare.\nRamchandra ke kaaj sanvare.',
    meaning:
      'Assuming a formidable form, you destroyed demons and accomplished Rama’s tasks.',
    image: require('../../assets/images/lessons/c7.jpg'),
  },
  {
    id: 'lesson-13',
    number: 13,
    title: 'Chaupai 11',
    type: 'chaupai',
    text: 'लाय सँजीवनि लखन जियाए ।\nश्रीरघुबीर हरषि उर लाए ॥',
    transliteration: 'Laay sanjeevani Lakhan jiyaye.\nShri Raghuveer harashi ur laaye.',
    meaning:
      'Bringing the Sanjeevani, you revived Lakshmana; Rama joyfully embraced you.',
    image: require('../../assets/images/lessons/c5.jpg'),
  },
  {
    id: 'lesson-14',
    number: 14,
    title: 'Chaupai 12',
    type: 'chaupai',
    text: 'रघुपति कीन्हीं बहुत बड़ाई ।\nतुम मम प्रिय भरतहि सम भाई ॥',
    transliteration: 'Raghupati keenhi bahut badaai.\nTum mam priya Bharatahi sam bhaai.',
    meaning:
      'Rama praised you greatly, saying: “You are as dear to me as my brother Bharata.”',
    image: require('../../assets/images/lessons/c5.jpg'),
  },
  {
    id: 'lesson-15',
    number: 15,
    title: 'Chaupai 13',
    type: 'chaupai',
    text: 'सहस बदन तुम्हरो जस गावैं ।\nअस कहि श्रीपति कंठ लगावैं ॥',
    transliteration: 'Sahas badan tumharo jas gaavain.\nAs kahi Shripati kanth lagaavain.',
    meaning:
      '“A thousand mouths sing your glory,” said the Lord, and embraced you again.',
      image: require('../../assets/images/lessons/c6.jpg'),
  },
  {
    id: 'lesson-16',
    number: 16,
    title: 'Chaupai 14',
    type: 'chaupai',
    text: 'सनकादिक ब्रह्मादि मुनीसा ।\nनारद सारद सहित अहीसा ॥',
    transliteration: 'Sanakadik Brahmadi muneesa.\nNarad Sarad sahit aheesa.',
    meaning:
      'Sages like Sanaka, Brahma and other seers—Narada, Saraswati, and the great Lord (Shiva) sing your praises.',
      image: require('../../assets/images/lessons/c6.jpg'),
  },
  {
    id: 'lesson-17',
    number: 17,
    title: 'Chaupai 15',
    type: 'chaupai',
    text: 'जम कुबेर दिक्पाल जहाँ ते ।\nकबी कोबिद कहि सकैं कहाँ ते ॥',
    transliteration: 'Jam Kuber dikpaal jahan te.\nKabi kobid kahi sakain kahan te.',
    meaning:
      'Yama, Kubera, and the guardians of directions—how can poets and scholars fully describe your glory?',
      image: require('../../assets/images/lessons/c8.jpg'),
  },
  {
    id: 'lesson-18',
    number: 18,
    title: 'Chaupai 16',
    type: 'chaupai',
    text: 'तुम उपकार सुग्रीवहिं कीन्हा ।\nराम मिलाय राजपद दीन्हा ॥',
    transliteration: 'Tum upkaar Sugreevahin keenha.\nRam milay rajpad deenha.',
    meaning:
      'You helped Sugriva meet Rama and enabled him to receive his rightful kingdom.',
      image: require('../../assets/images/lessons/c8.jpg'),
  },
  {
    id: 'lesson-19',
    number: 19,
    title: 'Chaupai 17',
    type: 'chaupai',
    text: 'तुम्हरो मन्त्र बिभीषन माना ।\nलंकेश्वर भए सब जग जाना ॥',
    transliteration: 'Tumharo mantra Bibheeshan maana.\nLankeshwar bhaye sab jag jaana.',
    meaning:
      'Vibhishana accepted your counsel and became king of Lanka—known to all the world.',
      image: require('../../assets/images/lessons/c9.jpg'),
  },
  {
    id: 'lesson-20',
    number: 20,
    title: 'Chaupai 18',
    type: 'chaupai',
    text: 'जुग सहस्र जोजन पर भानू ।\nलील्यो ताहि मधुर फल जानू ॥',
    transliteration: 'Jug sahasra jojan par bhaanu.\nLeelyo taahi madhur phal jaanu.',
    meaning:
      'You leapt to the distant sun, mistaking it for a sweet fruit.',
      image: require('../../assets/images/lessons/c9.jpg'),
  },
  {
    id: 'lesson-21',
    number: 21,
    title: 'Chaupai 19',
    type: 'chaupai',
    text: 'प्रभु मुद्रिका मेलि मुख माहीं ।\nजलधि लाँघि गये अचरज नाहीं ॥',
    transliteration: 'Prabhu mudrika meli mukh maahin.\nJaladhi laanghi gaye acharaj nahin.',
    meaning:
      'With Rama’s ring in your mouth, you crossed the ocean—no wonder for you.',
      image: require('../../assets/images/lessons/c10.jpg'),
  },
  {
    id: 'lesson-22',
    number: 22,
    title: 'Chaupai 20',
    type: 'chaupai',
    text: 'दुर्गम काज जगत के जेते ।\nसुगम अनुग्रह तुम्हरे तेते ॥',
    transliteration: 'Durgam kaaj jagat ke jete.\nSugam anugrah tumhare tete.',
    meaning:
      'All difficult tasks in the world become easy with your grace.',
      image: require('../../assets/images/lessons/c10.jpg'),
  },
  {
    id: 'lesson-23',
    number: 23,
    title: 'Chaupai 21',
    type: 'chaupai',
    text: 'राम दुआरे तुम रखवारे ।\nहोत न आज्ञा बिनु पैसारे ॥',
    transliteration: 'Ram duaare tum rakhvaare.\nHot na agya binu paisaare.',
    meaning:
      'You guard the door to Rama’s abode; none can enter without your permission.',
      image: require('../../assets/images/lessons/c11.jpg'),
  },
  {
    id: 'lesson-24',
    number: 24,
    title: 'Chaupai 22',
    type: 'chaupai',
    text: 'सब सुख लहै तुम्हारी शरना ।\nतुम रक्षक काहू को डरना ॥',
    transliteration: 'Sab sukh lahai tumhari sharana.\nTum rakshak kahu ko darna.',
    meaning:
      'In your refuge one finds all happiness; with you as protector, there is nothing to fear.',
      image: require('../../assets/images/lessons/c11.jpg'),
  },
  {
    id: 'lesson-25',
    number: 25,
    title: 'Chaupai 23',
    type: 'chaupai',
    text: 'आपन तेज सम्हारो आपै ।\nतीनौं लोक हाँक ते काँपे ॥',
    transliteration: 'Aapan tej samhaaro aapai.\nTeenon lok haank te kaanpe.',
    meaning:
      'When you display your power and roar, the three worlds tremble.',
      image: require('../../assets/images/lessons/c12.jpg'),
  },
  {
    id: 'lesson-26',
    number: 26,
    title: 'Chaupai 24',
    type: 'chaupai',
    text: 'भूत पिशाच निकट नहिं आवै ।\nमहाबीर जब नाम सुनावै ॥',
    transliteration: 'Bhoot pishaach nikat nahin aavai.\nMahabeer jab naam sunaavai.',
    meaning:
      'Ghosts and evil spirits do not come near those who chant your mighty name.',
      image: require('../../assets/images/lessons/c12.jpg'),
  },
  {
    id: 'lesson-27',
    number: 27,
    title: 'Chaupai 25',
    type: 'chaupai',
    text: 'नासै रोग हरै सब पीरा ।\nजपत निरंतर हनुमत बीरा ॥',
    transliteration: 'Naasai rog harai sab peera.\nJapat nirantar Hanumat beera.',
    meaning:
      'Constant remembrance of you destroys disease and removes all suffering.',
      image: require('../../assets/images/lessons/c13.jpg'),
  },
  {
    id: 'lesson-28',
    number: 28,
    title: 'Chaupai 26',
    type: 'chaupai',
    text: 'संकट तें हनुमान छुड़ावै ।\nमन क्रम बचन ध्यान जो लावै ॥',
    transliteration: 'Sankat te Hanuman chhudaavai.\nMan kram bachan dhyaan jo laavai.',
    meaning:
      'You free from troubles those who remember you in thought, deed, word, and meditation.',
      image: require('../../assets/images/lessons/c13.jpg'),
  },
  {
    id: 'lesson-29',
    number: 29,
    title: 'Chaupai 27',
    type: 'chaupai',
    text: 'सब पर राम तपस्वी राजा ।\nतिन के काज सकल तुम साजा ॥',
    transliteration: 'Sab par Ram tapasvi raaja.\nTin ke kaaj sakal tum saaja.',
    meaning:
      'Rama is supreme and the ascetic king—yet you carried out all his works.',
      image: require('../../assets/images/lessons/c14.jpg'),
  },
  {
    id: 'lesson-30',
    number: 30,
    title: 'Chaupai 28',
    type: 'chaupai',
    text: 'और मनोरथ जो कोई लावै ।\nसोहि अमित जीवन फल पावै ॥',
    transliteration: 'Aur manorath jo koi laavai.\nSohi amit jeevan phal paavai.',
    meaning:
      'Whoever brings any wish to you obtains its boundless fruits in this very life.',
      image: require('../../assets/images/lessons/c14.jpg'),
  },
  {
    id: 'lesson-31',
    number: 31,
    title: 'Chaupai 29',
    type: 'chaupai',
    text: 'चारों जुग परताप तुम्हारा ।\nहै परसिद्ध जगत उजियारा ॥',
    transliteration: 'Charon jug paratap tumhara.\nHai prasiddh jagat ujiyaara.',
    meaning:
      'Your glory is renowned through all four ages and illuminates the whole world.',
      image: require('../../assets/images/lessons/c15.jpg'),
  },
  {
    id: 'lesson-32',
    number: 32,
    title: 'Chaupai 30',
    type: 'chaupai',
    text: 'साधु संत के तुम रखवारे ।\nअसुर निकंदन राम दुलारे ॥',
    transliteration: 'Saadhu sant ke tum rakhvaare.\nAsur nikandan Ram dulaare.',
    meaning:
      'Protector of saints, destroyer of demons—you are dearly loved by Lord Rama.',
      image: require('../../assets/images/lessons/c15.jpg'),
  },
  {
    id: 'lesson-33',
    number: 33,
    title: 'Chaupai 31',
    type: 'chaupai',
    text: 'अष्ट सिद्धि नौ निधि के दाता ।\nअस बर दीन्ह जानकी माता ॥',
    transliteration: 'Asht siddhi nau nidhi ke daata.\nAs bar deenha Janaki mata.',
    meaning:
      'You grant the eight siddhis and nine treasures—such a boon was given to you by Mother Sita.',
      image: require('../../assets/images/lessons/c16.jpg'),
  },
  {
    id: 'lesson-34',
    number: 34,
    title: 'Chaupai 32',
    type: 'chaupai',
    text: 'राम रसायन तुम्हरे पासा ।\nसदा रहो रघुपति के दासा ॥',
    transliteration: 'Ram rasayan tumhare paasa.\nSada raho Raghupati ke daasa.',
    meaning:
      'You possess the elixir of devotion to Rama; remain forever the servant of Raghupati.',
      image: require('../../assets/images/lessons/c16.jpg'),
  },
  {
    id: 'lesson-35',
    number: 35,
    title: 'Chaupai 33',
    type: 'chaupai',
    text: 'तुम्हरे भजन राम को पावै ।\nजनम जनम के दुख बिसरावै ॥',
    transliteration: 'Tumhare bhajan Ram ko paavai.\nJanam janam ke dukh bisraavai.',
    meaning:
      'Through devotion to you one attains Rama and forgets sorrows of countless births.',
      image: require('../../assets/images/lessons/c17.jpg'),
  },
  {
    id: 'lesson-36',
    number: 36,
    title: 'Chaupai 34',
    type: 'chaupai',
    text: 'अंत काल रघुबर पुर जाई ।\nजहाँ जन्म हरिभक्त कहाई ॥',
    transliteration: 'Ant kaal Raghubar pur jaai.\nJahan janm Haribhakt kahaai.',
    meaning:
      'At life’s end, one goes to Rama’s abode; wherever reborn, one is known as a devotee of Hari.',
      image: require('../../assets/images/lessons/c17.jpg'),
  },
  {
    id: 'lesson-37',
    number: 37,
    title: 'Chaupai 35',
    type: 'chaupai',
    text: 'और देवता चित्त न धरई ।\nहनुमत सेइ सर्व सुख करई ॥',
    transliteration: 'Aur devata chitt na dharai.\nHanumat sei sarv sukh karai.',
    meaning:
      'One who serves Hanuman and thinks of no other deity gains all auspicious happiness.',
      image: require('../../assets/images/lessons/c18.jpg'),
  },
  {
    id: 'lesson-38',
    number: 38,
    title: 'Chaupai 36',
    type: 'chaupai',
    text: 'संकट कटै मिटै सब पीरा ।\nजो सुमिरै हनुमत बलबीरा ॥',
    transliteration: 'Sankat katai mitai sab peera.\nJo sumirai Hanumat balbeera.',
    meaning:
      'All troubles and pains vanish for those who remember the mighty Hanuman.',
      image: require('../../assets/images/lessons/c18.jpg'),
  },
  {
    id: 'lesson-39',
    number: 39,
    title: 'Chaupai 37',
    type: 'chaupai',
    text: 'जय जय जय हनुमान गोसाईं ।\nकृपा करहु गुरुदेव की नाईं ॥',
    transliteration: 'Jai jai jai Hanuman gosai.\nKripa karahu Gurudev ki naai.',
    meaning:
      'Victory, victory, victory to Hanuman, lord of devotees—show grace like a true Guru.',
      image: require('../../assets/images/lessons/c19.jpg'),
  },
  {
    id: 'lesson-40',
    number: 40,
    title: 'Chaupai 38',
    type: 'chaupai',
    text: 'जो शत बार पाठ कर कोई ।\nछूटहि बंदि महा सुख होई ॥',
    transliteration: 'Jo shat baar paath kar koi.\nChhootahi bandi maha sukh hoi.',
    meaning:
      'Whoever recites it a hundred times is freed from bondage and attains great joy.',
      image: require('../../assets/images/lessons/c19.jpg'),
  },
  {
    id: 'lesson-41',
    number: 41,
    title: 'Chaupai 39',
    type: 'chaupai',
    text: 'जो यह पढ़ै हनुमान चालीसा ।\nहोय सिद्धि साखी गौरीसा ॥',
    transliteration: 'Jo yah padhai Hanuman Chalisa.\nHoy siddhi sakhi Gaurisa.',
    meaning:
      'Whoever reads the Hanuman Chalisa attains success—Shiva himself bears witness.',
      image: require('../../assets/images/lessons/c20.jpg'),
  },
  {
    id: 'lesson-42',
    number: 42,
    title: 'Chaupai 40',
    type: 'chaupai',
    text: 'तुलसीदास सदा हरि चेरा ।\nकीजै नाथ हृदय महँ डेरा ॥',
    transliteration: 'Tulsidas sada Hari chera.\nKeejai naath hridaya mahan dera.',
    meaning:
      'Tulsidas is forever the servant of Hari—O Lord, please dwell in my heart.',
      image: require('../../assets/images/lessons/c20.jpg'),
  },

  // Concluding Doha
  {
    id: 'lesson-43',
    number: 43,
    title: 'Doha (Concluding)',
    type: 'doha',
    text:
      'पवनतनय संकट हरन मंगल मूरति रूप ।\n' +
      'राम लखन सीता सहित हृदय बसहु सुर भूप ॥',
    transliteration:
      'Pavanatanay sankat haran mangal murati roop.\n' +
      'Ram Lakhan Sita sahit hriday basahu sur bhoop.',
    meaning:
      'O son of the Wind, remover of obstacles and embodiment of auspiciousness—please reside in my heart along with Rama, Lakshmana, and Sita, O King of the Gods.',
     image: require('../../assets/images/lessons/c21.jpg'),
  },
];
