/* =========================================================
   SEITENLINIE – Weltdaten
   6 Konföderationen, 211 FIFA-Mitgliedsverbände.
   Echte Ligen & Vereine (Stand ca. Saison 2025/26) für die wichtigsten Länder,
   sonst Vereine nach echten Städten des Landes. Spieler sind immer fiktiv.
   Format Verband: CODE|Name|Konföderation|Ligastärke(0-100)|Namenspool|Städte
   ========================================================= */
const CONFEDS=[
 {id:'UEFA',name:'UEFA',region:'Europa'},
 {id:'CONMEBOL',name:'CONMEBOL',region:'Südamerika'},
 {id:'CONCACAF',name:'CONCACAF',region:'Nord- & Mittelamerika, Karibik'},
 {id:'CAF',name:'CAF',region:'Afrika'},
 {id:'AFC',name:'AFC',region:'Asien & Australien'},
 {id:'OFC',name:'OFC',region:'Ozeanien'},
];

const NAME_POOLS={
 de:{f:'Lukas|Leon|Finn|Jonas|Elias|Paul|Felix|Maximilian|Niklas|Tim|Jan|Moritz|Julian|Tobias|Florian|David|Kevin|Marco|Lennart|Philipp|Sebastian|Dominik|Nico|Benedikt|Fabian|Luca|Noah|Jannik',l:'Müller|Schmidt|Schneider|Fischer|Weber|Meyer|Wagner|Becker|Schulz|Hoffmann|Koch|Richter|Klein|Wolf|Neumann|Schwarz|Zimmermann|Braun|Krüger|Hartmann|Lange|Werner|Krause|Brandt|Vogel|Kaiser|Lehmann|Seidel|Bauer|Frank|Huber|Gruber|Steiner|Moser|Meier|Keller'},
 en:{f:'Jack|Harry|Oliver|George|Charlie|James|Thomas|William|Jacob|Alfie|Callum|Ryan|Liam|Connor|Josh|Kyle|Lewis|Ben|Jordan|Tyler|Mason|Ethan|Aaron|Declan|Scott|Jamie',l:'Smith|Jones|Taylor|Brown|Williams|Wilson|Johnson|Davies|Robinson|Wright|Thompson|Evans|Walker|White|Roberts|Green|Hall|Wood|Clarke|Hughes|Kelly|Murphy|Campbell|Stewart|Byrne|McCarthy|Morgan|Fraser|Doyle|Wallace'},
 fr:{f:'Lucas|Hugo|Théo|Antoine|Mathis|Yanis|Rayan|Adrien|Jules|Moussa|Kylian|Nathan|Enzo|Maxime|Bastien|Florian|Romain|Clément|Ousmane|Aurélien|Jean|Loïc',l:'Martin|Bernard|Dubois|Moreau|Laurent|Girard|Mercier|Fontaine|Camara|Diallo|Traoré|Lefèvre|Roux|Fournier|Lambert|Bonnet|Rousseau|Blanc|Guerin|Chevalier|Perrin|Pierre|Joseph|Baptiste'},
 es:{f:'Pablo|Diego|Javier|Álvaro|Sergio|Marcos|Iker|Rodrigo|Hugo|Adrián|Raúl|Dani|Carlos|Alejandro|Unai|Mikel|Jon|Pau|Ander|Gonzalo|Fermín|Óscar',l:'García|Fernández|López|Martínez|Sánchez|Pérez|Gómez|Ruiz|Hernández|Jiménez|Díaz|Moreno|Muñoz|Álvarez|Romero|Navarro|Torres|Domínguez|Vázquez|Ramos|Gil|Serrano|Molina|Ortega'},
 latam:{f:'Santiago|Matías|Sebastián|Nicolás|Juan|Lautaro|Thiago|Facundo|Emiliano|Joaquín|Franco|Bruno|Cristian|Brian|Kevin|Luis|Jorge|Andrés|Felipe|Miguel|José|Jhon|Alexis|Ángel|Rodrigo|Darwin',l:'González|Rodríguez|Fernández|López|Martínez|Gómez|Díaz|Pérez|Romero|Sosa|Álvarez|Torres|Ruiz|Ramírez|Flores|Benítez|Acosta|Medina|Herrera|Suárez|Castro|Vargas|Rojas|Mendoza|Cabrera|Ríos|Ortiz|Morales|Aguilar|Cardona'},
 pt:{f:'João|Diogo|Rúben|Bernardo|Tiago|Gonçalo|Francisco|Rafael|Pedro|André|Nuno|Rui|Vitinha|Fábio|Hélder|Miguel|Ricardo|Bruno',l:'Silva|Santos|Ferreira|Pereira|Oliveira|Costa|Rodrigues|Martins|Sousa|Fernandes|Gonçalves|Gomes|Lopes|Marques|Carvalho|Almeida|Ribeiro|Pinto|Teixeira|Moreira|Neves|Mendes'},
 br:{f:'Gabriel|Lucas|Matheus|Pedro|Vinícius|Gustavo|Felipe|Bruno|Thiago|Léo|Caio|Raphael|Wesley|Igor|Rafael|Danilo|Éverton|Marcos|Arthur|Douglas|Willian|Murilo|Kaio|Luan',l:'Silva|Santos|Oliveira|Souza|Lima|Pereira|Costa|Ferreira|Rodrigues|Almeida|Nascimento|Carvalho|Araújo|Ribeiro|Barbosa|Rocha|Moura|Teixeira|Cardoso|Martins|Gomes|Andrade|Batista|Vieira'},
 it:{f:'Lorenzo|Matteo|Alessandro|Andrea|Francesco|Federico|Riccardo|Davide|Nicolò|Gianluca|Marco|Simone|Giacomo|Daniele|Pietro|Tommaso|Luca|Stefano|Gabriele|Mattia',l:'Rossi|Russo|Ferrari|Esposito|Bianchi|Romano|Colombo|Ricci|Marino|Greco|Bruno|Gallo|Conti|De Luca|Mancini|Costa|Giordano|Rizzo|Lombardi|Moretti|Barbieri|Fontana|Caruso|Mariani'},
 nl:{f:'Daan|Sem|Jesse|Bram|Stijn|Ruben|Lars|Thijs|Milan|Luuk|Joey|Noa|Jurriën|Sven|Tim|Kees|Mats|Wout|Arne|Thibaut|Lander',l:'de Jong|Jansen|de Vries|van den Berg|van Dijk|Bakker|Visser|Smit|Meijer|de Boer|Mulder|de Groot|Bos|Vos|Peters|Hendriks|Dekker|Brouwer|Janssens|Maes|Peeters|Claes|Wouters|Willems'},
 nord:{f:'Erik|Oskar|Mikkel|Emil|Rasmus|Anders|Magnus|Jonas|Viktor|Sander|Kristoffer|Axel|Elias|Isak|Mads|Aron|Gylfi|Jóhann|Teemu|Joel|Rógvi|Jesper',l:'Hansen|Johansson|Nielsen|Larsen|Andersson|Berg|Lindqvist|Jensen|Pedersen|Karlsson|Nilsson|Olsen|Eriksson|Halvorsen|Lund|Dahl|Sigurdsson|Gunnarsson|Virtanen|Korhonen|Mäkinen|Joensen|Poulsen|Holm'},
 slav:{f:'Jakub|Kacper|Mateusz|Filip|Antoni|Tomáš|Lukáš|Adam|Michał|Patrik|Ondřej|Piotr|Marek|Dominik|Kamil|Martin|Jan|Ľubomír|Wojciech|Bartosz',l:'Kowalski|Nowak|Wiśniewski|Zieliński|Lewandowski|Novák|Svoboda|Dvořák|Černý|Kováč|Wójcik|Kamiński|Procházka|Szymański|Krejčí|Hašek|Baran|Mazur|Duda|Hrubý|Sobota|Kubiak'},
 balk:{f:'Luka|Ivan|Marko|Nikola|Stefan|Josip|Mateo|Filip|Aleksandar|Dušan|Milan|Andrej|Edin|Amir|Armin|Ermal|Arbër|Ilir|Bojan|Žan|Darko',l:'Horvat|Kovačić|Babić|Jurić|Petrović|Jovanović|Nikolić|Marković|Đorđević|Ilić|Popović|Hodžić|Begić|Kovač|Perić|Vuković|Stanković|Pavlović|Radić|Krasniqi|Berisha|Hoxha|Gashi|Novak|Zupan'},
 ru:{f:'Aleksandr|Dmitri|Maksim|Artem|Ivan|Nikita|Sergei|Andriy|Oleksandr|Mykola|Daniil|Ilya|Vladislav|Yuri|Arman|Nurlan|Giorgi|Levan|Khvicha|Rustam|Elnur|Vahan',l:'Ivanov|Smirnov|Kuznetsov|Popov|Sokolov|Lebedev|Kovalenko|Shevchenko|Bondarenko|Tkachenko|Morozov|Volkov|Petrenko|Melnyk|Fedorov|Orlov|Abenov|Nurlanov|Beridze|Kvaratskhelia|Mamedov|Aliyev|Hovhannisyan|Petrosyan'},
 hu:{f:'Bence|Dominik|Levente|Máté|Ádám|Dániel|Balázs|Roland|Zsolt|Péter|Attila|Krisztián',l:'Nagy|Kovács|Tóth|Szabó|Horváth|Varga|Kiss|Molnár|Németh|Farkas|Balogh|Papp|Takács|Juhász|Lakatos|Mészáros'},
 ro:{f:'Andrei|Alexandru|Ionuț|Răzvan|Florin|Denis|Nicolae|Vlad|Darius|Mihai|Radu|Cristian|Ion|Vadim',l:'Popescu|Ionescu|Stan|Dumitru|Munteanu|Stoica|Rus|Matei|Constantin|Marin|Tănase|Moldovan|Rotaru|Ciobanu|Lungu|Toma'},
 gr:{f:'Giorgos|Dimitris|Kostas|Nikos|Christos|Giannis|Vasilis|Panagiotis|Thanasis|Andreas|Michalis|Stelios|Lefteris|Marios',l:'Papadopoulos|Georgiou|Nikolaidis|Pappas|Oikonomou|Karagiannis|Vlachos|Christodoulou|Makris|Ioannou|Konstantinou|Antoniou|Charalambous|Savva|Demetriou|Petrou'},
 tr:{f:'Emre|Burak|Mert|Arda|Kerem|Yusuf|Cengiz|Hakan|Ozan|Barış|Kaan|Oğuz|Ferdi|Semih|Orkun|Abdülkerim|Eren|Halil',l:'Yılmaz|Kaya|Demir|Şahin|Çelik|Yıldız|Aydın|Öztürk|Arslan|Doğan|Kılıç|Aslan|Çetin|Koç|Kurt|Özdemir|Akgün|Erdoğan|Güler|Kahveci'},
 ar:{f:'Mohamed|Ahmed|Youssef|Omar|Ali|Hamza|Karim|Mahmoud|Abdullah|Salem|Fahad|Ayoub|Achraf|Riyad|Khalid|Hassan|Ismail|Bilal|Nabil|Sami|Yazan|Firas|Mousa|Tarek',l:'Al-Saadi|Hassan|Ibrahim|Mansour|Haddad|Benali|El Amrani|Saleh|Al-Harbi|Al-Qahtani|Bouzid|Khalil|Nasser|Belkacem|Ziani|Al-Dosari|Farouk|Rahmani|Al-Shehri|Al-Mutairi|Haddadi|Ben Youssef|El Idrissi|Sayed|Abdelaziz|Al-Hammadi'},
 wafr:{f:'Moussa|Ibrahima|Mamadou|Cheikh|Kwame|Kofi|Yaw|Samuel|Emmanuel|Victor|Wilfried|Serge|Abdou|Lamine|Seydou|Oumar|Chukwuemeka|Ademola|Kelechi|Bertrand|Franck|Junior|Pape|Idrissa|Musa|Joel',l:'Diallo|Traoré|Koné|Camara|Ndiaye|Mensah|Boateng|Osei|Okafor|Adeyemi|Eze|Touré|Bamba|Sow|Cissé|Kouassi|Obi|Asante|Sarr|Fofana|Nwosu|Onyeka|Mbemba|Kalulu|Ekambi|Aboubakar|Dembélé|Coulibaly|Sangaré|Bangura'},
 eafr:{f:'Joseph|David|Brian|Michael|Patrick|Elvis|Moses|Tendai|Thabo|Sipho|Lungile|Bongani|Musa|Kelvin|Godfrey|Teboho|Percy|Ronwen|Fiston|Clatous|Abel|Getaneh|Yonas|Mbwana',l:'Otieno|Mwangi|Kamau|Banda|Phiri|Mbatha|Dlamini|Nkosi|Moyo|Ndlovu|Okello|Mutasa|Zulu|Mwale|Haile|Tesfaye|Abebe|Mokoena|Khumalo|Chama|Mwila|Rakotondrabe|Andriamahitsinoro|Kiprotich|Samatta|Mkude'},
 jp:{f:'Haruto|Ren|Takumi|Kaoru|Daichi|Ritsu|Yuto|Sota|Kaito|Hiroki|Ao|Kota|Shuto|Yuki|Daizen|Keito|Takehiro|Junya|Shogo|Riku',l:'Sato|Suzuki|Takahashi|Tanaka|Watanabe|Ito|Yamamoto|Nakamura|Kobayashi|Kato|Yoshida|Yamada|Sasaki|Matsumoto|Inoue|Kimura|Hayashi|Shimizu|Mori|Ikeda|Hashimoto|Ueda'},
 kr:{f:'Seung-ho|Jae-sung|Hyun-woo|Min-ho|Jun-young|Do-hyun|Sang-woo|Woo-jin|Tae-hwan|Ji-hoon|Young-gwon|Hee-chan|Gue-sung|In-beom|Kyung-won|Jin-su',l:'Kim|Lee|Park|Choi|Jung|Kang|Cho|Yoon|Jang|Lim|Han|Oh|Seo|Shin|Kwon|Hwang|Song|Jeon|Hong|Baek|Ri|Pak'},
 cn:{f:'Wei|Lei|Jun|Hao|Yang|Peng|Tao|Xin|Yu|Jie|Long|Ming|Bin|Zhen|Kai|Chun|Ka-ho|Wing|Chih-hao|Yu-chen',l:'Wang|Li|Zhang|Liu|Chen|Yang|Zhao|Huang|Zhou|Wu|Xu|Sun|Hu|Zhu|Gao|Lin|Guo|He|Ma|Luo|Wong|Chan|Leung'},
 sea:{f:'Arif|Rizky|Fajar|Hafiz|Faris|Thanawat|Supachai|Kittipong|Anh|Duc|Minh|Hung|Carlos|Mark|Ikhsan|Safawi|Nam|Vilayphone|Soe|Kaung',l:'Pratama|Saputra|Hidayat|Nugroho|Rahman|Ismail|Abdullah|Srisuk|Wongsa|Nguyen|Tran|Le|Pham|Hoang|Santos|Reyes|Cruz|Bautista|Sihaloho|Phommachan|Aung|Htet|Chea|Lim'},
 ir:{f:'Mehdi|Ali|Reza|Sardar|Alireza|Saeid|Milad|Mohammad|Hossein|Karim|Ehsan|Omid|Farshad|Rustam|Jamshid|Eldor|Odil|Nurlan|Ahmad|Rahmatullah',l:'Hosseini|Mohammadi|Rezaei|Karimi|Ahmadi|Jafari|Moradi|Ghasemi|Rahimi|Azizi|Nouri|Amiri|Sadeghi|Rostami|Shomurodov|Masharipov|Nazarov|Rakhimov|Ergashev|Popal|Sharifi|Atayev|Safarov|Davronov'},
 in:{f:'Sunil|Rahul|Anirudh|Sahal|Manvir|Ashique|Gurpreet|Sandesh|Akash|Vikram|Arjun|Rohit|Imran|Jamal|Anjan|Kasun|Dilshan|Tshering|Ahmed|Ibrahim',l:'Singh|Kumar|Sharma|Das|Thapa|Khan|Ahmed|Patel|Gupta|Reddy|Nair|Bose|Chowdhury|Perera|Fernando|Rai|Gurung|Hossain|Dorji|Naseem|Rasheed|Mohamed|Iqbal|Malik'},
 pac:{f:'Roy|Tevita|Sione|Alvin|Brian|Junior|Raphael|Teaonui|Kalani|Mika|Liam|Josh|Tuimasi|Bertrand|Michel|Jean-Philippe|Nathaniel|Iosefa',l:'Tuilagi|Fifita|Taufa|Kaltak|Lolohea|Vea|Ma\'afu|Ioane|Fonoti|Naqeletia|Waqa|Tamata|Kafoa|Ravai|Wajoka|Tehau|Kaitu|Tasi|Hnamano|Sansom|Lepa|Wadrobert'},
 car:{f:'Andre|Shamar|Kemar|Damion|Leon|Michail|Javain|Ricardo|Jevani|Akeem|Romario|Kevin|Nathaniel|Dexter|Juninho|Tyrese|Kaheem|Shandel',l:'Williams|Brown|Campbell|Johnson|Thompson|Reid|Gordon|Bailey|Clarke|Lewis|Henry|Francis|Joseph|Charles|Pierre|Baptiste|Martina|Anthony|Garcia|Hodge|Gumbs|Samuel|Richardson|Harvey'},
};

const CLUB_PATTERNS={
 de:['FC {c}','SV {c}','VfB {c}','TSV {c}','{c} SC','SC {c}','FSV {c}'],
 en:['{c} FC','{c} United','{c} City','{c} Town','{c} Rovers','{c} Athletic','{c} Wanderers'],
 fr:['FC {c}','AS {c}','US {c}','Stade {c}','Olympique {c}','RC {c}','JS {c}'],
 es:['Club {c}','Deportivo {c}','Atlético {c}','CD {c}','Real {c}','{c} CF','UD {c}'],
 latam:['Club {c}','Deportivo {c}','Atlético {c}','CD {c}','Real {c}','{c} FC','Sporting {c}','Universidad {c}'],
 pt:['{c} FC','SC {c}','CD {c}','Atlético {c}','União {c}','GD {c}'],
 br:['{c} EC','SC {c}','Clube {c}','Atlético {c}','União {c}','{c} FC','América {c}'],
 it:['AC {c}','US {c}','{c} Calcio','SS {c}','FC {c}','AS {c}'],
 nl:['FC {c}','SC {c}','{c} Boys','VV {c}','KV {c}','Sporting {c}'],
 nord:['{c} IF','{c} FK','IK {c}','{c} BK','FC {c}','{c} SK'],
 slav:['KS {c}','Polonia {c}','Sparta {c}','Slavia {c}','FK {c}','MFK {c}','Górnik {c}'],
 balk:['FK {c}','NK {c}','{c} FK','Dinamo {c}','KF {c}','Sloga {c}','Radnički {c}'],
 ru:['FK {c}','Dinamo {c}','Torpedo {c}','Shakhtar {c}','Metalurh {c}','{c} FK','Lokomotiv {c}'],
 hu:['{c} FC','{c} SE','{c} TE','{c} VSC','{c} ETO'],
 ro:['FC {c}','CS {c}','Universitatea {c}','Petrolul {c}','{c} FC','Dacia {c}'],
 gr:['{c} FC','PAS {c}','AE {c}','APO {c}','Atromitos {c}'],
 tr:['{c}spor','{c} FK','{c} Belediyespor','{c} İdmanyurdu','{c} Gençlik'],
 ar:['Al-{c} SC','{c} SC','Al-Ittihad {c}','Al-Ahli {c}','Club {c}','Al-Nasr {c}'],
 magh:['CS {c}','JS {c}','MC {c}','ES {c}','CR {c}','USM {c}','Olympique {c}','Club Africain {c}'],
 wafr:['{c} FC','{c} United','AS {c}','Stade {c}','{c} Stars','Real {c}','Union {c}'],
 eafr:['{c} FC','{c} United','{c} City','{c} Stars','{c} Rangers','{c} Warriors'],
 jp:['{c} FC','{c} United','FC {c}','{c} SC'],
 kr:['{c} FC','{c} Citizen','{c} United','{c} Hyundai'],
 cn:['{c} FC','{c} City','{c} United','{c} Hailong'],
 sea:['{c} FC','{c} United','PS {c}','{c} City'],
 ir:['{c} FC','Sepahan {c}','Esteghlal {c}','Shahin {c}','Navbahor {c}'],
 in:['{c} FC','{c} City FC','{c} United','Sporting {c}'],
 pac:['{c} FC','{c} United','AS {c}','{c} City'],
 car:['{c} FC','{c} United','{c} Stars','{c} City','Real {c}'],
};

const ASSOC_DATA=`
ALB|Albanien|UEFA|42|balk|Tirana,Durrës,Shkodër,Vlorë,Elbasan,Korçë,Fier,Berat,Lushnjë,Kukës
AND|Andorra|UEFA|24|es|Andorra la Vella,Escaldes,Encamp,Sant Julià,La Massana,Ordino,Canillo,Pas de la Casa
ARM|Armenien|UEFA|42|ru|Jerewan,Gjumri,Wanadsor,Abowjan,Etschmiadsin,Hrasdan,Kapan,Gawar
AUT|Österreich|UEFA|69|de|Wien,Graz,Linz,Salzburg,Innsbruck,Klagenfurt,Villach,Wels,St. Pölten,Dornbirn,Steyr,Leoben,Wolfsberg,Kapfenberg,Amstetten,Horn
AZE|Aserbaidschan|UEFA|50|ru|Baku,Gandscha,Sumqayıt,Qəbələ,Lənkəran,Şəki,Mingəçevir,Şamaxı,Zirə,Ağdam
BLR|Belarus|UEFA|46|ru|Minsk,Brest,Hrodna,Homel,Mahiljou,Wizebsk,Baryssau,Salihorsk,Sluzk,Schodsina,Isloch,Smaljawitschy
BEL|Belgien|UEFA|75|nl|Brüssel,Antwerpen,Gent,Lüttich,Brügge,Charleroi,Namur,Löwen,Mechelen,Hasselt,Kortrijk,Ostende,Lommel,Beveren,Seraing,Deinze
BIH|Bosnien-Herzegowina|UEFA|46|balk|Sarajevo,Banja Luka,Tuzla,Zenica,Mostar,Široki Brijeg,Bijeljina,Posušje,Doboj,Goražde
BUL|Bulgarien|UEFA|55|balk|Sofia,Plowdiw,Warna,Burgas,Russe,Stara Sagora,Plewen,Wraza,Montana,Rasgrad
CRO|Kroatien|UEFA|66|balk|Zagreb,Split,Rijeka,Osijek,Zadar,Varaždin,Pula,Šibenik,Velika Gorica,Koprivnica
CYP|Zypern|UEFA|58|gr|Nikosia,Limassol,Larnaka,Paphos,Famagusta,Paralimni,Achna,Aradippou
CZE|Tschechien|UEFA|67|slav|Prag,Brünn,Ostrau,Pilsen,Olmütz,Reichenberg,Budweis,Königgrätz,Pardubice,Zlín,Jablonec,Teplice,Karviná,Most,Opava,Příbram
DEN|Dänemark|UEFA|67|nord|Kopenhagen,Aarhus,Odense,Aalborg,Esbjerg,Randers,Horsens,Vejle,Silkeborg,Viborg,Herning,Lyngby,Hvidovre,Kolding,Næstved,Hillerød
ENG|England|UEFA|95|en|London,Manchester,Liverpool,Birmingham,Leeds,Sheffield,Bristol,Newcastle,Nottingham,Leicester
EST|Estland|UEFA|34|nord|Tallinn,Tartu,Narva,Pärnu,Viljandi,Paide,Kuressaare,Rakvere,Nõmme,Kohtla-Järve
FRO|Färöer|UEFA|30|nord|Tórshavn,Klaksvík,Runavík,Tvøroyri,Vágur,Fuglafjørður,Sørvágur,Toftir,Gøta,Hoyvík
FIN|Finnland|UEFA|46|nord|Helsinki,Turku,Tampere,Kuopio,Vaasa,Seinäjoki,Lahti,Oulu,Mariehamn,Jyväskylä,Espoo,Rovaniemi
FRA|Frankreich|UEFA|87|fr|Paris,Lyon,Bordeaux,Caen,Dijon,Valenciennes,Sochaux,Orléans,Tours,Niort,Châteauroux,Rouen,Versailles,Beauvais,Quevilly,Bourg-en-Bresse,Concarneau,Aubagne
GEO|Georgien|UEFA|45|ru|Tiflis,Batumi,Kutaissi,Rustawi,Sugdidi,Gori,Poti,Telawi,Samtredia,Sestaponi
GER|Deutschland|UEFA|90|de|Berlin,Hamburg,München,Köln,Frankfurt,Stuttgart,Düsseldorf,Leipzig,Dortmund,Essen
GIB|Gibraltar|UEFA|20|en|Gibraltar
GRE|Griechenland|UEFA|67|gr|Athen,Thessaloniki,Patras,Heraklion,Larisa,Volos,Ioannina,Chania,Kavala,Serres,Xanthi,Tripoli
HUN|Ungarn|UEFA|56|hu|Budapest,Debrecen,Szeged,Miskolc,Pécs,Győr,Nyíregyháza,Kecskemét,Székesfehérvár,Zalaegerszeg
ISL|Island|UEFA|38|nord|Reykjavík,Kópavogur,Hafnarfjörður,Akureyri,Garðabær,Keflavík,Akranes,Vestmannaeyjar,Selfoss,Mosfellsbær
ISR|Israel|UEFA|58|ar|Tel Aviv,Haifa,Jerusalem,Be'er Scheva,Netanja,Aschdod,Petach Tikwa,Tiberias
ITA|Italien|UEFA|90|it|Rom,Mailand,Neapel,Turin,Palermo,Bari,Catania,Ancona,Perugia,Ternana,Triestina,Vicenza,Arezzo,Foggia,Benevento,Salernitana,Pescara,Lucchese,Novara,Alessandria
KAZ|Kasachstan|UEFA|50|ru|Astana,Almaty,Schymkent,Qaraghandy,Aqtöbe,Pawlodar,Qostanai,Taras,Atyrau,Öskemen,Qysylorda,Schetissu
KVX|Kosovo|UEFA|38|balk|Pristina,Prizren,Peja,Gjilan,Mitrovica,Ferizaj,Gjakova,Drenica,Podujeva,Malisheva
LVA|Lettland|UEFA|38|nord|Riga,Liepāja,Daugavpils,Jelgava,Ventspils,Valmiera,Jūrmala,Tukums,Ogre,Jēkabpils
LIE|Liechtenstein|UEFA|30|de|Vaduz,Balzers,Eschen,Schaan,Triesen,Ruggell
LTU|Litauen|UEFA|38|nord|Vilnius,Kaunas,Klaipėda,Šiauliai,Panevėžys,Marijampolė,Alytus,Utena,Telšiai,Jonava
LUX|Luxemburg|UEFA|36|fr|Luxemburg,Esch,Differdingen,Düdelingen,Petingen,Niederkorn,Mondorf,Strassen,Hesperingen,Wiltz
MLT|Malta|UEFA|34|it|Valletta,Birkirkara,Sliema,Ħamrun,Marsaxlokk,Floriana,Paola,Gżira,Mosta,Żabbar,Balzan,Naxxar
MDA|Moldau|UEFA|38|ro|Chișinău,Tiraspol,Bălți,Orhei,Ungheni,Cahul,Soroca,Comrat,Hîncești,Strășeni
MNE|Montenegro|UEFA|40|balk|Podgorica,Nikšić,Bar,Budva,Herceg Novi,Pljevlja,Bijelo Polje,Cetinje,Berane,Tivat
NED|Niederlande|UEFA|79|nl|Amsterdam,Rotterdam,Den Haag,Utrecht,Eindhoven,Groningen,Tilburg,Breda,Nijmegen,Arnhem
MKD|Nordmazedonien|UEFA|40|balk|Skopje,Bitola,Kumanovo,Tetovo,Štip,Struga,Prilep,Ohrid,Strumica,Gostivar
NIR|Nordirland|UEFA|40|en|Belfast,Derry,Lisburn,Newry,Ballymena,Coleraine,Larne,Portadown
NOR|Norwegen|UEFA|65|nord|Oslo,Bergen,Trondheim,Stavanger,Drammen,Fredrikstad,Kristiansand,Tromsø,Sandnes,Sogndal,Lillestrøm,Aalesund,Start,Odd,Moss,Ranheim
POL|Polen|UEFA|65|slav|Warschau,Krakau,Łódź,Breslau,Posen,Danzig,Stettin,Bydgoszcz,Lublin,Kattowitz,Białystok,Gdynia,Kielce,Rzeszów,Tychy,Opole,Chorzów,Sosnowiec
POR|Portugal|UEFA|80|pt|Lissabon,Porto,Braga,Coimbra,Faro,Funchal,Setúbal,Aveiro,Viseu,Leiria
IRL|Irland|UEFA|42|en|Dublin,Cork,Limerick,Galway,Waterford,Drogheda,Sligo,Dundalk,Bray,Athlone
ROU|Rumänien|UEFA|58|ro|Bukarest,Cluj-Napoca,Timișoara,Iași,Constanța,Craiova,Brașov,Galați,Ploiești,Oradea,Arad,Pitești,Sibiu,Bacău,Târgu Mureș,Suceava
RUS|Russland|UEFA|66|ru|Moskau,Sankt Petersburg,Nowosibirsk,Jekaterinburg,Kasan,Nischni Nowgorod,Samara,Krasnodar,Rostow,Woronesch,Ufa,Tula,Perm,Wolgograd,Saransk,Jaroslawl
SMR|San Marino|UEFA|20|it|Serravalle,Domagnano,Borgo Maggiore,Faetano,Fiorentino,Murata,Acquaviva,Chiesanuova,Montegiardino,Dogana
SCO|Schottland|UEFA|66|en|Glasgow,Edinburgh,Aberdeen,Dundee,Inverness,Perth,Stirling,Kilmarnock
SRB|Serbien|UEFA|62|balk|Belgrad,Novi Sad,Niš,Kragujevac,Subotica,Čačak,Novi Pazar,Kraljevo,Smederevo,Pančevo,Leskovac,Zrenjanin,Šabac,Valjevo,Loznica,Sombor
SVK|Slowakei|UEFA|56|slav|Bratislava,Košice,Prešov,Žilina,Nitra,Banská Bystrica,Trnava,Trenčín,Martin,Poprad
SVN|Slowenien|UEFA|52|balk|Ljubljana,Maribor,Celje,Koper,Kranj,Velenje,Nova Gorica,Murska Sobota,Domžale,Ptuj
ESP|Spanien|UEFA|92|es|Madrid,Barcelona,Murcia,Alicante,Salamanca,Badajoz,Jaén,Lugo,Ourense,Ponferrada,Logroño,Algeciras,Cartagena,Gimnàstic,Sabadell,Mérida,Tenerife,Alcorcón,Fuenlabrada,Linares
SWE|Schweden|UEFA|63|nord|Stockholm,Göteborg,Malmö,Uppsala,Västerås,Örebro,Linköping,Helsingborg,Jönköping,Norrköping,Umeå,Gävle,Sundsvall,Trelleborg,Landskrona,Varberg
SUI|Schweiz|UEFA|68|de|Zürich,Genf,Basel,Bern,Lausanne,Luzern,St. Gallen,Lugano,Biel,Thun
TUR|Türkei|UEFA|74|tr|Istanbul,Ankara,Izmir,Bursa,Adana,Antalya,Konya,Gaziantep,Kayseri,Mersin,Eskişehir,Diyarbakır,Samsun,Denizli,Sakarya,Manisa,Erzurum,Bodrum,Sivas,Amed
UKR|Ukraine|UEFA|64|ru|Kiew,Charkiw,Odessa,Dnipro,Lwiw,Saporischschja,Winnyzja,Poltawa,Tschernihiw,Mykolajiw,Cherson,Sumy,Ternopil,Iwano-Frankiwsk,Uschhorod,Tscherkassy
WAL|Wales|UEFA|38|en|Cardiff,Swansea,Newport,Wrexham,Bangor,Aberystwyth,Llanelli,Bala,Barry,Rhyl
ALG|Algerien|CAF|56|magh|Algier,Oran,Constantine,Annaba,Blida,Sétif,Batna,Tlemcen,Béjaïa,Tizi Ouzou,Chlef,Biskra,Médéa,Mostaganem,El Bayadh,Khenchela
ANG|Angola|CAF|44|pt|Luanda,Huambo,Lobito,Benguela,Lubango,Malanje,Cabinda,Uíge,Namibe,Soyo,Saurimo,Kuito
BEN|Benin|CAF|36|wafr|Cotonou,Porto-Novo,Parakou,Abomey,Djougou,Bohicon,Natitingou,Lokossa,Ouidah,Kandi
BOT|Botsuana|CAF|36|eafr|Gaborone,Francistown,Molepolole,Maun,Serowe,Selebi-Phikwe,Lobatse,Mahalapye,Kanye,Jwaneng
BFA|Burkina Faso|CAF|38|wafr|Ouagadougou,Bobo-Dioulasso,Koudougou,Banfora,Ouahigouya,Kaya,Tenkodogo,Fada Ngourma,Dédougou,Dori
BDI|Burundi|CAF|28|eafr|Bujumbura,Gitega,Ngozi,Rumonge,Muyinga,Kayanza,Ruyigi,Makamba
CMR|Kamerun|CAF|46|wafr|Yaoundé,Douala,Garoua,Bamenda,Maroua,Bafoussam,Ngaoundéré,Bertoua,Limbe,Kribi,Buea,Dschang,Ebolowa,Kumba
CPV|Kap Verde|CAF|34|pt|Praia,Mindelo,Santa Maria,Assomada,Porto Novo,São Filipe,Tarrafal,Pedra Badejo
CTA|Zentralafrikanische Rep.|CAF|24|wafr|Bangui,Bimbo,Berbérati,Carnot,Bambari,Bouar,Bossangoa,Bria
CHA|Tschad|CAF|24|wafr|N'Djamena,Moundou,Sarh,Abéché,Kélo,Koumra,Pala,Am Timan
COM|Komoren|CAF|24|wafr|Moroni,Mutsamudu,Fomboni,Domoni,Mitsamiouli,Ouani,Mbéni,Sima
CGO|Kongo|CAF|34|wafr|Brazzaville,Pointe-Noire,Dolisie,Nkayi,Owando,Ouesso,Impfondo,Madingou
COD|DR Kongo|CAF|46|wafr|Kinshasa,Lubumbashi,Mbuji-Mayi,Kisangani,Kananga,Bukavu,Goma,Likasi,Kolwezi,Matadi,Mbandaka,Kikwit,Tshikapa,Uvira
DJI|Dschibuti|CAF|20|ar|Dschibuti,Ali Sabieh,Tadjoura,Obock,Dikhil,Arta
EGY|Ägypten|CAF|60|ar|Kairo,Alexandria,Gizeh,Port Said,Suez,Ismailia,Mansura,Tanta,Assiut,Luxor
EQG|Äquatorialguinea|CAF|28|es|Malabo,Bata,Ebebiyín,Mongomo,Evinayong,Luba,Aconibe,Riaba
ERI|Eritrea|CAF|20|eafr|Asmara,Keren,Massawa,Assab,Mendefera,Barentu,Adi Keyh,Dekemhare
SWZ|Eswatini|CAF|28|eafr|Mbabane,Manzini,Big Bend,Malkerns,Nhlangano,Siteki,Piggs Peak,Matsapha
ETH|Äthiopien|CAF|34|eafr|Addis Abeba,Dire Dawa,Mekele,Gonder,Hawassa,Bahir Dar,Adama,Jimma,Dessie,Jijiga,Sidama,Hadiya
GAB|Gabun|CAF|32|wafr|Libreville,Port-Gentil,Franceville,Oyem,Moanda,Mouila,Lambaréné,Tchibanga
GAM|Gambia|CAF|30|wafr|Banjul,Serekunda,Brikama,Bakau,Farafenni,Lamin,Sukuta,Basse
GHA|Ghana|CAF|48|wafr|Accra,Kumasi,Tamale,Takoradi,Cape Coast,Obuasi,Tema,Sunyani,Koforidua,Ho,Techiman,Bechem,Dormaa,Nsoatre
GUI|Guinea|CAF|38|wafr|Conakry,Nzérékoré,Kankan,Kindia,Labé,Boké,Mamou,Siguiri,Kamsar,Faranah
GNB|Guinea-Bissau|CAF|26|pt|Bissau,Bafatá,Gabú,Bissorã,Bolama,Cacheu,Catió,Farim
CIV|Elfenbeinküste|CAF|50|wafr|Abidjan,Bouaké,Daloa,Yamoussoukro,San-Pédro,Korhogo,Man,Gagnoa,Divo,Soubré,Abengourou,Séwé
KEN|Kenia|CAF|36|eafr|Nairobi,Mombasa,Kisumu,Nakuru,Eldoret,Thika,Kakamega,Machakos,Nyeri,Murang'a,Bungoma,Kericho
LES|Lesotho|CAF|24|eafr|Maseru,Teyateyaneng,Mafeteng,Hlotse,Mohale's Hoek,Maputsoe,Qacha's Nek,Butha-Buthe
LBR|Liberia|CAF|28|wafr|Monrovia,Gbarnga,Buchanan,Kakata,Harper,Voinjama,Zwedru,Ganta
LBY|Libyen|CAF|42|ar|Tripolis,Bengasi,Misrata,Zawiya,Bayda,Sabha,Tobruk,Zliten,Derna,Sirte,Ajdabiya,Gharyan
MAD|Madagaskar|CAF|32|eafr|Antananarivo,Toamasina,Antsirabe,Mahajanga,Fianarantsoa,Toliara,Antsiranana,Ambovombe,Morondava,Moramanga
MWI|Malawi|CAF|30|eafr|Lilongwe,Blantyre,Mzuzu,Zomba,Kasungu,Mangochi,Karonga,Salima,Dedza,Nkhotakota
MLI|Mali|CAF|42|wafr|Bamako,Sikasso,Mopti,Koutiala,Kayes,Ségou,Gao,Kati,Timbuktu,San,Bougouni,Nioro
MTN|Mauretanien|CAF|32|ar|Nouakchott,Nouadhibou,Kiffa,Rosso,Kaédi,Zouérat,Atar,Sélibaby,Néma,Aleg
MRI|Mauritius|CAF|26|fr|Port Louis,Curepipe,Vacoas,Quatre Bornes,Rose-Hill,Mahébourg,Triolet,Goodlands
MAR|Marokko|CAF|62|magh|Casablanca,Rabat,Marrakesch,Fès,Tanger,Agadir,Meknès,Oujda,Kénitra,Tétouan,Safi,El Jadida,Berkane,Nador,Khouribga,Settat
MOZ|Mosambik|CAF|32|pt|Maputo,Matola,Beira,Nampula,Chimoio,Quelimane,Tete,Lichinga,Pemba,Xai-Xai
NAM|Namibia|CAF|30|eafr|Windhoek,Rundu,Walvis Bay,Swakopmund,Oshakati,Katima Mulilo,Otjiwarongo,Keetmanshoop,Rehoboth,Gobabis
NIG|Niger|CAF|28|wafr|Niamey,Zinder,Maradi,Agadez,Tahoua,Dosso,Arlit,Diffa,Tillabéri,Birni-N'Konni
NGA|Nigeria|CAF|48|wafr|Lagos,Kano,Ibadan,Abuja,Port Harcourt,Benin City,Kaduna,Enugu,Aba,Jos,Ilorin,Owerri,Uyo,Makurdi,Katsina,Lafia,Ikorodu,Akure,Abeokuta,Bauchi
RWA|Ruanda|CAF|32|eafr|Kigali,Butare,Gitarama,Ruhengeri,Gisenyi,Byumba,Cyangugu,Kibuye,Rwamagana,Nyagatare
STP|São Tomé und Príncipe|CAF|18|pt|São Tomé,Santo António,Neves,Santana,Trindade,Guadalupe
SEN|Senegal|CAF|46|wafr|Dakar,Thiès,Touba,Saint-Louis,Kaolack,Ziguinchor,Rufisque,Mbour,Diourbel,Louga,Tambacounda,Kolda,Guédiawaye,Pikine
SEY|Seychellen|CAF|20|car|Victoria,Anse Boileau,Beau Vallon,Takamaka,Baie Lazare,Cascade,Anse Royale,La Digue
SLE|Sierra Leone|CAF|28|wafr|Freetown,Bo,Kenema,Makeni,Koidu,Lunsar,Port Loko,Waterloo
SOM|Somalia|CAF|20|ar|Mogadischu,Hargeysa,Berbera,Kismayo,Baidoa,Bosaso,Garoowe,Beledweyne
RSA|Südafrika|CAF|58|eafr|Johannesburg,Kapstadt,Durban,Pretoria,Port Elizabeth,Bloemfontein,Polokwane,Rustenburg,Nelspruit,East London,Kimberley,Pietermaritzburg,Richards Bay,Stellenbosch,Soweto,Tembisa
SSD|Südsudan|CAF|20|eafr|Juba,Wau,Malakal,Yei,Aweil,Rumbek,Torit,Bor
SDN|Sudan|CAF|36|ar|Khartum,Omdurman,Port Sudan,Kassala,Wad Madani,El Obeid,Nyala,Gedaref,Atbara,Kosti
TAN|Tansania|CAF|40|eafr|Daressalam,Mwanza,Arusha,Dodoma,Mbeya,Morogoro,Tanga,Sansibar,Kigoma,Moshi,Tabora,Singida,Shinyanga,Songea
TOG|Togo|CAF|30|wafr|Lomé,Sokodé,Kara,Kpalimé,Atakpamé,Dapaong,Tsévié,Aného,Bassar,Mango
TUN|Tunesien|CAF|56|magh|Tunis,Sfax,Sousse,Bizerte,Monastir,Gabès,Kairouan,Ben Arous,Métlaoui,Gafsa,Zarzis,Béja,Médenine,Jendouba
UGA|Uganda|CAF|34|eafr|Kampala,Gulu,Lira,Mbarara,Jinja,Mbale,Masaka,Entebbe,Arua,Hoima,Kasese,Soroti
ZAM|Sambia|CAF|38|eafr|Lusaka,Kitwe,Ndola,Kabwe,Chingola,Mufulira,Livingstone,Luanshya,Kasama,Chipata,Solwezi,Mansa
ZIM|Simbabwe|CAF|34|eafr|Harare,Bulawayo,Chitungwiza,Mutare,Gweru,Kwekwe,Kadoma,Masvingo,Chinhoyi,Bindura
AFG|Afghanistan|AFC|22|ir|Kabul,Herat,Kandahar,Mazar-e Sharif,Dschalalabad,Kundus,Ghazni,Bamiyan
AUS|Australien|AFC|62|en|Sydney,Melbourne,Brisbane,Perth,Adelaide
BHR|Bahrain|AFC|36|ar|Manama,Muharraq,Riffa,Hamad Town,Isa Town,Sitra,Budaiya,Hidd,Busaiteen,Malkiya
BAN|Bangladesch|AFC|24|in|Dhaka,Chittagong,Khulna,Rajshahi,Sylhet,Barisal,Rangpur,Comilla,Mymensingh,Narayanganj
BHU|Bhutan|AFC|16|in|Thimphu,Phuntsholing,Paro,Gelephu,Samdrup Jongkhar,Wangdue,Punakha,Trongsa
BRU|Brunei|AFC|18|sea|Bandar Seri Begawan,Kuala Belait,Seria,Tutong,Bangar,Muara,Jerudong,Lumut
CAM|Kambodscha|AFC|24|sea|Phnom Penh,Siem Reap,Battambang,Sihanoukville,Kampong Cham,Kampot,Takeo,Svay Rieng,Pursat,Kep
CHN|China|AFC|58|cn|Peking,Shanghai,Guangzhou,Shenzhen,Chengdu,Wuhan,Chongqing,Nanjing,Xi'an,Hangzhou,Dalian,Qingdao,Changsha,Suzhou,Kunming,Harbin
TPE|Chinesisch Taipeh|AFC|22|cn|Taipeh,Kaohsiung,Taichung,Tainan,Hsinchu,Taoyuan,Keelung,Chiayi
GUM|Guam|AFC|14|pac|Hagåtña,Dededo,Tamuning,Yigo,Barrigada,Mangilao,Agana Heights,Santa Rita
HKG|Hongkong|AFC|30|cn|Hongkong,Kowloon,Sha Tin,Tai Po,Tuen Mun,Yuen Long,Sham Shui Po,Eastern,Southern,Kitchee
IND|Indien|AFC|38|in|Mumbai,Kolkata,Bengaluru,Chennai,Goa,Hyderabad,Kerala,Odisha,Jamshedpur,Shillong,Punjab,Delhi,Guwahati,Imphal
IDN|Indonesien|AFC|40|sea|Jakarta,Surabaya,Bandung,Medan,Semarang,Makassar,Palembang,Malang,Bali,Yogyakarta,Solo,Madura,Bekasi,Tangerang,Pontianak,Samarinda,Padang,Manado
IRN|Iran|AFC|54|ir|Teheran,Maschhad,Isfahan,Täbris,Schiras,Ahvaz,Karadsch,Kerman,Rascht,Kermanschah,Arak,Abadan,Bandar Abbas,Ghom,Sari,Yazd
IRQ|Irak|AFC|46|ar|Bagdad,Basra,Erbil,Mossul,Kerbela,Nadschaf,Sulaimaniyya,Kirkuk,Dohuk,Amara,Diwaniyya,Nasiriyya,Hilla,Samarra
JPN|Japan|AFC|70|jp|Tokio,Osaka,Yokohama,Nagoya,Sapporo,Kobe,Kyoto,Fukuoka,Kawasaki,Sendai,Hiroshima,Chiba,Niigata,Kumamoto,Oita,Nagasaki,Kagoshima,Kofu,Tochigi,Mito
JOR|Jordanien|AFC|42|ar|Amman,Zarqa,Irbid,Russeifa,Aqaba,Salt,Madaba,Mafraq,Jerash,Ramtha
PRK|Nordkorea|AFC|34|kr|Pjöngjang,Hamhŭng,Chŏngjin,Sinŭiju,Wŏnsan,Kaesŏng,Nampho,Sariwŏn,Kimchaek,Hyesan
KOR|Südkorea|AFC|66|kr|Seoul,Busan,Incheon,Daegu,Daejeon,Gwangju,Ulsan,Suwon,Seongnam,Bucheon,Ansan,Cheongju,Gimpo,Cheonan,Hwaseong,Paju
KUW|Kuwait|AFC|36|ar|Kuwait-Stadt,Salmiya,Hawalli,Jahra,Fahaheel,Qadsiya,Kazma,Arabi,Tadamon,Sahel
KGZ|Kirgisistan|AFC|28|ru|Bischkek,Osch,Dschalalabad,Karakol,Tokmok,Uzgen,Naryn,Talas
LAO|Laos|AFC|18|sea|Vientiane,Luang Prabang,Savannakhet,Pakse,Thakhek,Xam Neua,Phonsavan,Luang Namtha
LBN|Libanon|AFC|34|ar|Beirut,Tripoli,Sidon,Tyros,Zahlé,Jounieh,Baalbek,Nabatieh,Byblos,Aley
MAC|Macau|AFC|14|cn|Macau,Taipa,Coloane,Cotai,Nossa Senhora,São Lourenço
MAS|Malaysia|AFC|40|sea|Johor,Kuala Lumpur,Selangor,Penang,Perak,Sabah,Kedah,Terengganu,Kelantan,Negeri Sembilan,Pahang,Melaka,Sarawak,Kuching
MDV|Malediven|AFC|20|in|Malé,Addu,Fuvahmulah,Kulhudhuffushi,Thinadhoo,Naifaru,Hithadhoo,Eydhafushi
MNG|Mongolei|AFC|18|cn|Ulaanbaatar,Erdenet,Darkhan,Choibalsan,Mörön,Khovd,Ölgii,Bayankhongor
MYA|Myanmar|AFC|26|sea|Yangon,Mandalay,Naypyidaw,Mawlamyine,Bago,Pathein,Monywa,Sittwe,Taunggyi,Myitkyina
NEP|Nepal|AFC|20|in|Kathmandu,Pokhara,Lalitpur,Biratnagar,Bharatpur,Birgunj,Dharan,Butwal,Hetauda,Janakpur
OMA|Oman|AFC|38|ar|Maskat,Salala,Sohar,Nizwa,Sur,Ibri,Rustaq,Buraimi,Seeb,Bahla
PAK|Pakistan|AFC|20|in|Karatschi,Lahore,Faisalabad,Rawalpindi,Islamabad,Multan,Peschawar,Quetta,Sialkot,Hyderabad
PLE|Palästina|AFC|30|ar|Gaza,Hebron,Nablus,Ramallah,Dschenin,Bethlehem,Tulkarem,Qalqilya,Al-Bireh,Jericho
PHI|Philippinen|AFC|26|sea|Manila,Cebu,Davao,Quezon City,Iloilo,Bacolod,Cagayan de Oro,Zamboanga,Baguio,Makati
QAT|Katar|AFC|58|ar|Doha,Al-Rayyan,Al-Wakrah,Al-Khor,Umm Salal,Al-Shamal,Lusail,Al-Daayen
KSA|Saudi-Arabien|AFC|72|ar|Riad,Dschidda,Mekka,Medina,Dammam,Taif,Tabuk,Buraida,Abha,Hail,Khamis Muschait,Dschāzān,Nadschran,Al-Chubar,Unaizah,Al-Ula
SGP|Singapur|AFC|28|sea|Singapur,Tampines,Bedok,Geylang,Hougang,Balestier,Tanjong Pagar,Jurong
SRI|Sri Lanka|AFC|18|in|Colombo,Kandy,Galle,Jaffna,Negombo,Batticaloa,Kurunegala,Matara,Trincomalee,Anuradhapura
SYR|Syrien|AFC|38|ar|Damaskus,Aleppo,Homs,Latakia,Hama,Tartus,Deir ez-Zor,Raqqa,Idlib,Daraa
TJK|Tadschikistan|AFC|30|ir|Duschanbe,Chudschand,Kulob,Bochtar,Istarawschan,Hissor,Panjakent,Isfara
THA|Thailand|AFC|44|sea|Bangkok,Buriram,Chiang Mai,Chonburi,Pathum Thani,Nakhon Ratchasima,Khon Kaen,Udon Thani,Songkhla,Ratchaburi,Muangthong,Nong Bua,Lamphun,Sukhothai,Uthai Thani,Rayong
TLS|Timor-Leste|AFC|16|sea|Dili,Baucau,Maliana,Suai,Lospalos,Ermera,Liquiçá,Same
TKM|Turkmenistan|AFC|30|ir|Aşgabat,Türkmenabat,Daşoguz,Mary,Balkanabat,Bayramaly,Tejen,Abadan
UAE|VAE|AFC|58|ar|Abu Dhabi,Dubai,Schardscha,Al-Ain,Adschman,Ras al-Chaima,Fudschaira,Umm al-Qaiwain,Chor Fakkan,Kalba,Dibba,Hatta
UZB|Usbekistan|AFC|50|ir|Taschkent,Samarkand,Namangan,Andijon,Buxoro,Qarshi,Fargʻona,Nukus,Termiz,Navoiy,Olmaliq,Qoʻqon,Guliston,Jizzax
VIE|Vietnam|AFC|40|sea|Hanoi,Ho-Chi-Minh-Stadt,Hải Phòng,Đà Nẵng,Nam Định,Thanh Hóa,Bình Dương,Hải Dương,Quảng Ninh,Huế,Nghệ An,Bình Định,Hà Tĩnh,Khánh Hòa
YEM|Jemen|AFC|24|ar|Sanaa,Aden,Taiz,Al-Hudaida,Ibb,Al-Mukalla,Dhamar,Sayun
AIA|Anguilla|CONCACAF|10|car|The Valley,Sandy Ground,Blowing Point,West End,Island Harbour,Stoney Ground
ATG|Antigua und Barbuda|CONCACAF|20|car|St. John's,All Saints,Liberta,Potters,Bolans,Codrington,Parham,Swetes
ARU|Aruba|CONCACAF|18|car|Oranjestad,San Nicolas,Noord,Santa Cruz,Savaneta,Paradera,Dakota,Brazil
BAH|Bahamas|CONCACAF|14|car|Nassau,Freeport,West End,Coopers Town,Marsh Harbour,Andros,Exuma,Eleuthera
BRB|Barbados|CONCACAF|18|car|Bridgetown,Speightstown,Oistins,Holetown,Bathsheba,Saint Philip,Christ Church,Saint Michael
BLZ|Belize|CONCACAF|20|car|Belize City,San Ignacio,Belmopan,Orange Walk,Dangriga,Corozal,Punta Gorda,Benque Viejo
BER|Bermuda|CONCACAF|18|car|Hamilton,St. George's,Somerset,Devonshire,Pembroke,Warwick,Paget,Southampton
VGB|Britische Jungferninseln|CONCACAF|10|car|Road Town,Spanish Town,East End,Cane Garden Bay,The Settlement,Great Harbour
CAN|Kanada|CONCACAF|52|en|Toronto,Vancouver,Montréal,Calgary,Edmonton,Ottawa,Winnipeg,Halifax
CAY|Kaimaninseln|CONCACAF|12|car|George Town,West Bay,Bodden Town,East End,North Side,Cayman Brac
CRC|Costa Rica|CONCACAF|50|latam|San José,Alajuela,Heredia,Cartago,Puntarenas,Limón,Liberia,San Carlos,Pérez Zeledón,Guanacaste,Santa Ana,Sporting
CUB|Kuba|CONCACAF|28|latam|Havanna,Santiago de Cuba,Camagüey,Holguín,Santa Clara,Guantánamo,Pinar del Río,Cienfuegos,Matanzas,Las Tunas
CUW|Curaçao|CONCACAF|26|car|Willemstad,Sint Michiel,Barber,Soto,Westpunt,Tera Kora,Santa Rosa,Brievengat
DMA|Dominica|CONCACAF|14|car|Roseau,Portsmouth,Marigot,Berekua,Mahaut,Saint Joseph,Wesley,Castle Bruce
DOM|Dominikanische Republik|CONCACAF|26|latam|Santo Domingo,Santiago,La Romana,San Pedro de Macorís,Puerto Plata,La Vega,San Cristóbal,Moca,Bonao,Higüey
SLV|El Salvador|CONCACAF|36|latam|San Salvador,Santa Ana,San Miguel,Soyapango,Santa Tecla,Apopa,Zacatecoluca,Usulután,Chalatenango,Sonsonate,La Unión,Ahuachapán
GRN|Grenada|CONCACAF|14|car|St. George's,Gouyave,Grenville,Victoria,Sauteurs,Hillsborough,Concord,Grand Anse
GUA|Guatemala|CONCACAF|40|latam|Guatemala-Stadt,Mixco,Villa Nueva,Quetzaltenango,Escuintla,Cobán,Mazatenango,Chiquimula,Zacapa,Malacatán,Antigua,Xelajú
GUY|Guyana|CONCACAF|20|car|Georgetown,Linden,New Amsterdam,Anna Regina,Bartica,Rose Hall,Corriverton,Lethem
HAI|Haiti|CONCACAF|30|fr|Port-au-Prince,Cap-Haïtien,Gonaïves,Les Cayes,Saint-Marc,Jacmel,Jérémie,Hinche,Pétion-Ville,Léogâne
HON|Honduras|CONCACAF|44|latam|Tegucigalpa,San Pedro Sula,La Ceiba,Choloma,El Progreso,Comayagua,Choluteca,Puerto Cortés,Danlí,Juticalpa
JAM|Jamaika|CONCACAF|40|car|Kingston,Spanish Town,Montego Bay,Portmore,Mandeville,May Pen,Ocho Rios,Clarendon,Harbour View,Mount Pleasant,Waterhouse,Arnett Gardens
MEX|Mexiko|CONCACAF|72|latam|Mexiko-Stadt,Guadalajara,Monterrey,Puebla,Tijuana,León,Cancún,Morelia,Oaxaca,Celaya,Tepatitlán,Irapuato,Durango,Sinaloa,Tlaxcala,Zacatecas,Veracruz,Mérida
MSR|Montserrat|CONCACAF|8|car|Brades,Plymouth,Salem,St. John's,Cudjoe Head,Look Out
NCA|Nicaragua|CONCACAF|30|latam|Managua,León,Masaya,Matagalpa,Chinandega,Granada,Estelí,Jinotega,Juigalpa,Bluefields
PAN|Panama|CONCACAF|42|latam|Panama-Stadt,San Miguelito,Colón,David,La Chorrera,Santiago,Chitré,Penonomé,Arraiján,Bocas del Toro
PUR|Puerto Rico|CONCACAF|24|latam|San Juan,Bayamón,Carolina,Ponce,Caguas,Guaynabo,Mayagüez,Arecibo,Fajardo,Humacao
SKN|St. Kitts und Nevis|CONCACAF|16|car|Basseterre,Charlestown,Sandy Point,Cayon,Dieppe Bay,Newcastle,Old Road,Gingerland
LCA|St. Lucia|CONCACAF|16|car|Castries,Vieux Fort,Gros Islet,Soufrière,Micoud,Dennery,Laborie,Anse La Raye
VIN|St. Vincent und die Grenadinen|CONCACAF|14|car|Kingstown,Georgetown,Barrouallie,Layou,Chateaubelair,Calliaqua,Bequia,Mesopotamia
SUR|Suriname|CONCACAF|26|nl|Paramaribo,Lelydorp,Nieuw Nickerie,Moengo,Meerzorg,Wanica,Albina,Brokopondo
TRI|Trinidad und Tobago|CONCACAF|34|car|Port of Spain,San Fernando,Chaguanas,Arima,Point Fortin,Couva,Scarborough,Tunapuna,Sangre Grande,Siparia
TCA|Turks- und Caicosinseln|CONCACAF|8|car|Cockburn Town,Providenciales,Grace Bay,Kew,Bottle Creek,Five Cays
USA|USA|CONCACAF|70|en|New York,Los Angeles,Chicago,Houston,Phoenix,Philadelphia,San Antonio,San Diego
VIR|Amerikanische Jungferninseln|CONCACAF|10|car|Charlotte Amalie,Christiansted,Frederiksted,Cruz Bay,Coral Bay,Red Hook
ARG|Argentinien|CONMEBOL|76|latam|Buenos Aires,Córdoba,Rosario,Mendoza,La Plata,Tucumán,Mar del Plata,Salta,Santa Fe,San Juan,Jujuy,Corrientes,Bahía Blanca,Paraná,Posadas,Neuquén,Quilmes,Chacarita,Atlanta,Morón
BOL|Bolivien|CONMEBOL|50|latam|La Paz,Santa Cruz,Cochabamba,Sucre,Oruro,Potosí,Tarija,El Alto,Trinidad,Cobija,Montero,Warnes,Yacuiba,Villa Montes,Riberalta,Quillacollo
BRA|Brasilien|CONMEBOL|82|br|São Paulo,Rio de Janeiro,Belo Horizonte,Porto Alegre,Salvador,Recife,Fortaleza,Curitiba
CHI|Chile|CONMEBOL|60|latam|Santiago,Valparaíso,Concepción,Antofagasta,Temuco,Rancagua,Talca,Arica,Iquique,Puerto Montt,La Serena,Chillán,Osorno,Calama,Copiapó,Curicó
COL|Kolumbien|CONMEBOL|66|latam|Bogotá,Medellín,Cali,Barranquilla,Cartagena,Bucaramanga,Pereira,Manizales,Ibagué,Pasto,Santa Marta,Cúcuta,Villavicencio,Neiva,Montería,Tunja
ECU|Ecuador|CONMEBOL|62|latam|Quito,Guayaquil,Cuenca,Manta,Ambato,Portoviejo,Machala,Loja,Riobamba,Esmeraldas,Ibarra,Latacunga,Santo Domingo,Babahoyo,Quevedo,Milagro
PAR|Paraguay|CONMEBOL|58|latam|Asunción,Ciudad del Este,Encarnación,Luque,San Lorenzo,Lambaré,Capiatá,Villarrica,Pedro Juan Caballero,Concepción,Itauguá,Coronel Oviedo
PER|Peru|CONMEBOL|56|latam|Lima,Arequipa,Trujillo,Chiclayo,Cusco,Piura,Huancayo,Iquitos,Tacna,Ayacucho,Cajamarca,Puno,Juliaca,Chimbote,Pucallpa,Huánuco,Sullana,Callao
URU|Uruguay|CONMEBOL|62|latam|Montevideo,Salto,Paysandú,Las Piedras,Rivera,Maldonado,Tacuarembó,Melo,Mercedes,Artigas,Minas,Colonia,Durazno,Florida,Rocha,Treinta y Tres
VEN|Venezuela|CONMEBOL|50|latam|Caracas,Maracaibo,Valencia,Barquisimeto,Maracay,Ciudad Guayana,Barcelona,Maturín,Mérida,San Cristóbal,Barinas,Cumaná,Puerto La Cruz,Acarigua,Guanare,Los Teques
ASA|Amerikanisch-Samoa|OFC|6|pac|Pago Pago,Tafuna,Leone,Faleniu,Aua,Nu'uuli
COK|Cookinseln|OFC|10|pac|Avarua,Arorangi,Titikaveka,Ngatangiia,Matavera,Nikao,Takuvaine,Tupapa
FIJ|Fidschi|OFC|30|pac|Suva,Lautoka,Nadi,Labasa,Ba,Rewa,Navua,Nadroga,Tailevu,Savusavu
NCL|Neukaledonien|OFC|26|fr|Nouméa,Mont-Dore,Dumbéa,Païta,Koné,Bourail,Lifou,Maré,Ouvéa,Poindimié
NZL|Neuseeland|OFC|40|en|Auckland,Wellington,Christchurch,Hamilton,Dunedin,Tauranga,Napier,Nelson,Palmerston North,Whangarei
PNG|Papua-Neuguinea|OFC|22|pac|Port Moresby,Lae,Mount Hagen,Madang,Goroka,Wewak,Kokopo,Kimbe,Popondetta,Alotau
SAM|Samoa|OFC|12|pac|Apia,Vaitele,Faleula,Siusega,Salelologa,Leulumoega,Lufilufi,Vailima
SOL|Salomonen|OFC|26|pac|Honiara,Auki,Gizo,Buala,Tulagi,Kirakira,Lata,Noro,Malaita,Henderson
TAH|Tahiti|OFC|24|pac|Papeete,Faaa,Punaauia,Pirae,Mahina,Paea,Papara,Arue,Taravao,Moorea
TGA|Tonga|OFC|10|pac|Nukuʻalofa,Neiafu,Haveluloto,Vaini,Pangai,Ohonua,Kolonga,Lapaha
VAN|Vanuatu|OFC|24|pac|Port Vila,Luganville,Norsup,Isangel,Lakatoro,Sola,Lenakel,Erromango,Tafea,Shefa
`;

/* Echte Ligen & Vereine (Reihenfolge ≈ Stärke). closed = kein Auf-/Abstieg. noLeague = keine eigene Liga */
const LEAGUE_DATA={
 GER:{names:['Bundesliga','2. Bundesliga','3. Liga'],clubs:[
  'Bayern München|Borussia Dortmund|Bayer 04 Leverkusen|RB Leipzig|Eintracht Frankfurt|VfB Stuttgart|SC Freiburg|VfL Wolfsburg|Borussia Mönchengladbach|1. FSV Mainz 05|TSG Hoffenheim|Werder Bremen|1. FC Union Berlin|FC Augsburg|Hamburger SV|1. FC Köln|FC St. Pauli|1. FC Heidenheim',
  'FC Schalke 04|Hertha BSC|Hannover 96|1. FC Kaiserslautern|Fortuna Düsseldorf|VfL Bochum|Holstein Kiel|SV Darmstadt 98|1. FC Nürnberg|Karlsruher SC|SC Paderborn 07|SV Elversberg|1. FC Magdeburg|SpVgg Greuther Fürth|Arminia Bielefeld|Eintracht Braunschweig|Dynamo Dresden|Preußen Münster',
  'TSV 1860 München|MSV Duisburg|Energie Cottbus|Hansa Rostock|Alemannia Aachen|Rot-Weiss Essen|VfL Osnabrück|SV Waldhof Mannheim|FC Ingolstadt 04|SSV Jahn Regensburg|SSV Ulm 1846|1. FC Saarbrücken|SV Wehen Wiesbaden|Erzgebirge Aue|SC Verl|Viktoria Köln|VfB Stuttgart II|TSG Hoffenheim II|1. FC Schweinfurt 05|TSV Havelse']},
 ENG:{names:['Premier League','Championship','League One'],clubs:[
  'Liverpool|Arsenal|Manchester City|Chelsea|Newcastle United|Aston Villa|Tottenham Hotspur|Manchester United|Nottingham Forest|Brighton & Hove Albion|Crystal Palace|Bournemouth|Brentford|Fulham|West Ham United|Everton|Wolverhampton Wanderers|Leeds United|Burnley|Sunderland',
  'Leicester City|Southampton|Ipswich Town|Sheffield United|Middlesbrough|Coventry City|West Bromwich Albion|Norwich City|Watford|Bristol City|Hull City|Stoke City|Millwall|Swansea City|Preston North End|Queens Park Rangers|Derby County|Blackburn Rovers|Wrexham|Birmingham City|Sheffield Wednesday|Portsmouth|Charlton Athletic|Oxford United',
  'Luton Town|Cardiff City|Plymouth Argyle|Huddersfield Town|Bolton Wanderers|Wigan Athletic|Reading|Barnsley|Blackpool|Stockport County|Wycombe Wanderers|Peterborough United|Lincoln City|Leyton Orient|Bradford City|Doncaster Rovers|Mansfield Town|Rotherham United|Exeter City|Northampton Town|Port Vale|Stevenage|Burton Albion|AFC Wimbledon']},
 ESP:{names:['LaLiga','LaLiga 2','Primera Federación'],clubs:[
  'Real Madrid|FC Barcelona|Atlético Madrid|Athletic Club|Villarreal|Real Betis|Real Sociedad|Sevilla|Girona|Valencia|Celta Vigo|Osasuna|Rayo Vallecano|Mallorca|Getafe|Espanyol|Alavés|Levante|Elche|Real Oviedo',
  'Real Valladolid|Las Palmas|Leganés|Almería|Granada|Cádiz|Málaga|Deportivo La Coruña|Sporting Gijón|Racing Santander|Real Zaragoza|Eibar|Huesca|Albacete|Burgos|Mirandés|Castellón|Córdoba|FC Andorra|Real Sociedad B|Cultural Leonesa|AD Ceuta']},
 ITA:{names:['Serie A','Serie B','Serie C'],clubs:[
  'Inter|Napoli|Juventus|AC Milan|Atalanta|AS Roma|Lazio|Fiorentina|Bologna|Como|Torino|Udinese|Genoa|Sassuolo|Cagliari|Parma|Hellas Verona|Lecce|Pisa|Cremonese',
  'Monza|Empoli|Venezia|Palermo|Sampdoria|Bari|Spezia|Modena|Cesena|Catanzaro|Frosinone|Südtirol|Reggiana|Carrarese|Juve Stabia|Mantova|Padova|Avellino|Virtus Entella|Pescara']},
 FRA:{names:['Ligue 1','Ligue 2','National'],clubs:[
  'Paris Saint-Germain|Olympique Marseille|AS Monaco|OSC Lille|Olympique Lyon|OGC Nizza|RC Lens|RC Straßburg|Stade Rennes|Stade Brest|Toulouse FC|FC Nantes|AJ Auxerre|SCO Angers|Le Havre AC|FC Lorient|Paris FC|FC Metz',
  'Stade Reims|AS Saint-Étienne|Montpellier HSC|EA Guingamp|Amiens SC|FC Annecy|Clermont Foot|SC Bastia|Grenoble Foot|Stade Laval|Pau FC|Red Star|USL Dunkerque|Rodez AF|ESTAC Troyes|Le Mans FC|AS Nancy|US Boulogne']},
 NED:{names:['Eredivisie','Eerste Divisie'],clubs:[
  'PSV Eindhoven|Ajax|Feyenoord|AZ Alkmaar|FC Twente|FC Utrecht|Go Ahead Eagles|NEC Nijmegen|SC Heerenveen|Sparta Rotterdam|FC Groningen|Fortuna Sittard|PEC Zwolle|Heracles Almelo|NAC Breda|Excelsior|FC Volendam|Telstar',
  'Willem II|RKC Waalwijk|Almere City|Vitesse|ADO Den Haag|SC Cambuur|De Graafschap|Roda JC|FC Den Bosch|VVV-Venlo|FC Emmen|FC Dordrecht|Helmond Sport|MVV Maastricht|TOP Oss|FC Eindhoven|Jong Ajax|Jong PSV|Jong AZ|Jong FC Utrecht']},
 POR:{names:['Primeira Liga','Liga Portugal 2'],clubs:[
  'Sporting CP|Benfica|FC Porto|SC Braga|Vitória Guimarães|Santa Clara|Famalicão|Estoril|Casa Pia|Gil Vicente|Moreirense|Rio Ave|Arouca|Estrela Amadora|AVS|Nacional|Tondela|Alverca',
  'Boavista|Farense|Marítimo|Vizela|Chaves|Paços de Ferreira|Portimonense|Académico Viseu|Feirense|Penafiel|Torreense|União de Leiria|Leixões|Oliveirense|Felgueiras|Lusitânia Lourosa|Benfica B|FC Porto B']},
 BEL:{names:['Pro League','Challenger Pro League'],clubs:['Club Brügge|Royale Union Saint-Gilloise|RSC Anderlecht|KRC Genk|KAA Gent|Royal Antwerp|Standard Lüttich|KVC Westerlo|Sporting Charleroi|KV Mechelen|OH Löwen|Cercle Brügge|Sint-Truidense VV|FCV Dender|SV Zulte Waregem|RAAL La Louvière']},
 TUR:{names:['Süper Lig','1. Lig'],clubs:['Galatasaray|Fenerbahçe|Beşiktaş|Trabzonspor|İstanbul Başakşehir|Samsunspor|Göztepe|Eyüpspor|Kasımpaşa|Antalyaspor|Konyaspor|Alanyaspor|Gaziantep FK|Kayserispor|Çaykur Rizespor|Kocaelispor|Gençlerbirliği|Fatih Karagümrük']},
 SCO:{names:['Premiership','Championship'],clubs:[
  'Celtic|Rangers|Heart of Midlothian|Hibernian|Aberdeen|Motherwell|Dundee United|St Mirren|Kilmarnock|Dundee FC|Falkirk|Livingston',
  'St Johnstone|Ross County|Partick Thistle|Ayr United|Raith Rovers|Dunfermline Athletic|Queen\'s Park|Greenock Morton|Airdrieonians|Arbroath']},
 AUT:{names:['Bundesliga','2. Liga'],clubs:['Red Bull Salzburg|Sturm Graz|Rapid Wien|Austria Wien|LASK|Wolfsberger AC|TSV Hartberg|WSG Tirol|SCR Altach|FC Blau-Weiß Linz|Grazer AK|SV Ried']},
 SUI:{names:['Super League','Challenge League'],clubs:[
  'FC Basel|BSC Young Boys|Servette FC|FC Lugano|FC Luzern|FC St. Gallen|FC Zürich|FC Sion|Lausanne-Sport|Grasshopper Club Zürich|FC Winterthur|FC Thun',
  'FC Aarau|FC Vaduz|Yverdon-Sport|FC Wil|Neuchâtel Xamax|AC Bellinzona|Stade Lausanne-Ouchy|Étoile Carouge|Stade Nyonnais|FC Rapperswil-Jona']},
 DEN:{names:['Superliga','1. Division'],clubs:['FC København|FC Midtjylland|Brøndby IF|AGF Aarhus|FC Nordsjælland|Randers FC|Silkeborg IF|Viborg FF|Odense BK|Vejle BK|Sønderjyske|FC Fredericia']},
 SWE:{names:['Allsvenskan','Superettan'],clubs:['Malmö FF|Hammarby IF|AIK|Djurgårdens IF|IFK Göteborg|BK Häcken|IF Elfsborg|Mjällby AIF|GAIS|IK Sirius|IFK Norrköping|Halmstads BK|IF Brommapojkarna|Degerfors IF|Östers IF|IFK Värnamo']},
 NOR:{names:['Eliteserien','1. divisjon'],clubs:['Bodø/Glimt|Brann|Molde FK|Viking FK|Rosenborg BK|Vålerenga|Fredrikstad FK|Sarpsborg 08|Tromsø IL|Sandefjord|KFUM Oslo|HamKam|Kristiansund BK|Strømsgodset|Bryne FK|FK Haugesund']},
 POL:{names:['Ekstraklasa','I liga'],clubs:['Lech Poznań|Legia Warschau|Raków Częstochowa|Jagiellonia Białystok|Pogoń Stettin|Górnik Zabrze|Cracovia|Widzew Łódź|GKS Katowice|Zagłębie Lubin|Motor Lublin|Piast Gliwice|Korona Kielce|Radomiak Radom|Lechia Danzig|Bruk-Bet Termalica|Wisła Płock|Arka Gdynia']},
 CZE:{names:['1. Liga','2. Liga'],clubs:['Slavia Prag|Sparta Prag|Viktoria Pilsen|Baník Ostrava|Mladá Boleslav|Sigma Olmütz|Slovan Liberec|Hradec Králové|FK Jablonec|Bohemians 1905|MFK Karviná|FK Teplice|1. FC Slovácko|FK Pardubice|Dukla Prag|FC Zlín']},
 GRE:{names:['Super League','Super League 2'],clubs:['Olympiakos Piräus|PAOK Thessaloniki|AEK Athen|Panathinaikos|Aris Thessaloniki|Asteras Tripolis|OFI Kreta|Atromitos|Panetolikos|Volos NFC|Levadiakos|APO Kifisia|AEL Larisa|Panserraikos']},
 CRO:{names:['HNL'],clubs:['Dinamo Zagreb|Hajduk Split|HNK Rijeka|NK Osijek|NK Varaždin|Slaven Belupo|Lokomotiva Zagreb|Istra 1961|HNK Gorica|HNK Vukovar 1991']},
 SRB:{names:['Superliga','Prva liga'],clubs:['Roter Stern Belgrad|Partizan Belgrad|TSC Bačka Topola|FK Čukarički|FK Vojvodina|FK Novi Pazar|Radnički Niš|Spartak Subotica|OFK Beograd|Železničar Pančevo|IMT Novi Beograd|Radnik Surdulica|Napredak Kruševac|Mladost Lučani|Javor Ivanjica|Radnički 1923']},
 UKR:{names:['Premjer-Liha','Perscha Liha'],clubs:['Schachtar Donezk|Dynamo Kiew|Polissja Schytomyr|FK Oleksandrija|Krywbas Krywyj Rih|Karpaty Lwiw|Sorja Luhansk|Kolos Kowaliwka|LNZ Tscherkassy|Weres Riwne|Ruch Lwiw|Obolon Kiew|Metalist 1925|Epizentr Kamjanez|Kudriwka|SK Poltawa']},
 RUS:{names:['Premjer-Liga','1. Liga'],clubs:['Zenit St. Petersburg|FK Krasnodar|Spartak Moskau|ZSKA Moskau|Dynamo Moskau|Lokomotive Moskau|Rubin Kasan|FK Rostow|Krylja Sowetow|Achmat Grosny|FK Orenburg|Pari Nischni Nowgorod|Dynamo Machatschkala|FK Sotschi|Baltika Kaliningrad|Akron Togliatti']},
 ROU:{names:['Liga I','Liga II'],clubs:['FCSB|CFR Cluj|Universitatea Craiova|Rapid Bukarest|Dinamo Bukarest|Universitatea Cluj|Farul Constanța|Petrolul Ploiești|Oțelul Galați|UTA Arad|FC Hermannstadt|FK Csíkszereda|FC Botoșani|Unirea Slobozia|FC Argeș|Metaloglobus Bukarest']},
 BUL:{names:['Parwa Liga'],clubs:['Ludogorez Rasgrad|Lewski Sofia|ZSKA Sofia|ZSKA 1948|Tscherno More Warna|Lokomotiv Plowdiw|Botew Plowdiw|Arda Kardschali|Slawia Sofia|Beroe Stara Sagora|Lokomotiv Sofia|Spartak Warna|Septemwri Sofia|Dobrudscha Dobritsch|Botew Wraza|FK Montana']},
 HUN:{names:['NB I'],clubs:['Ferencváros|Puskás Akadémia|Paksi FC|Debreceni VSC|Győri ETO|MTK Budapest|Újpest FC|Zalaegerszegi TE|Diósgyőri VTK|Nyíregyháza Spartacus|Kisvárda FC|Kazincbarcika']},
 CYP:{names:['Protathlima Cyta'],clubs:['APOEL Nikosia|Omonia Nikosia|Pafos FC|AEK Larnaka|Aris Limassol|Apollon Limassol|Anorthosis Famagusta|AEL Limassol|Ethnikos Achnas|Omonia Aradippou|Akritas Chlorakas|Krasava|Enosis Paralimni|Olympiakos Nikosia']},
 SVK:{names:['Niké liga'],clubs:['Slovan Bratislava|Spartak Trnava|DAC Dunajská Streda|MŠK Žilina|Železiarne Podbrezová|MFK Ružomberok|AS Trenčín|MFK Zemplín Michalovce|KFC Komárno|MFK Skalica|FC Košice|Tatran Prešov']},
 SVN:{names:['PrvaLiga'],clubs:['Olimpija Ljubljana|NK Maribor|NK Celje|FC Koper|NK Bravo|NŠ Mura|NK Radomlje|NK Domžale|NK Primorje|NK Aluminij']},
 ISR:{names:['Ligat ha’Al'],clubs:['Maccabi Tel Aviv|Maccabi Haifa|Hapoel Be\'er Sheva|Beitar Jerusalem|Hapoel Tel Aviv|Hapoel Haifa|Maccabi Netanya|Bnei Sachnin|Hapoel Jerusalem|Ironi Kirjat Schmona|Maccabi Bnei Reineh|Ironi Tiberias|Hapoel Petach Tikwa|MS Aschdod']},
 WAL:{names:['Cymru Premier'],clubs:['The New Saints|Connah\'s Quay Nomads|Penybont|Bala Town|Caernarfon Town|Cardiff Metropolitan|Haverfordwest County|Barry Town United|Colwyn Bay|Briton Ferry Llansawel|Flint Town United|Llanelli Town']},
 NIR:{names:['NIFL Premiership'],clubs:['Linfield|Larne|Glentoran|Crusaders|Cliftonville|Coleraine|Dungannon Swifts|Portadown|Carrick Rangers|Glenavon|Ballymena United|Bangor']},
 IRL:{names:['Premier Division'],clubs:['Shamrock Rovers|Shelbourne|Derry City|Bohemians|St Patrick\'s Athletic|Drogheda United|Sligo Rovers|Galway United|Waterford|Cork City']},
 GIB:{names:['Gibraltar Football League'],clubs:['Lincoln Red Imps|St Joseph\'s|Europa FC|Lions Gibraltar|Manchester 62|Bruno\'s Magpies|Glacis United|College 1975|Mons Calpe|Hound Dogs']},
 SMR:{names:['Campionato Sammarinese'],clubs:['Tre Penne|La Fiorita|Virtus|Tre Fiori|Folgore|Cosmos|Murata|Libertas|Domagnano|Faetano|Juvenes/Dogana|Pennarossa|Cailungo|Fiorentino|San Giovanni|Victor San Marino']},
 LIE:{noLeague:true,info:'Liechtensteins Vereine spielen im Schweizer Ligasystem – z. B. der FC Vaduz in der Challenge League.'},
 BRA:{names:['Série A','Série B'],clubs:[
  'Flamengo|Palmeiras|Botafogo|Atlético Mineiro|Fluminense|São Paulo|Cruzeiro|Internacional|Corinthians|Grêmio|Bahia|Red Bull Bragantino|Fortaleza|Vasco da Gama|Santos|Mirassol|Vitória|Ceará|Juventude|Sport Recife',
  'Athletico Paranaense|Coritiba|Cuiabá|Goiás|Atlético Goianiense|América Mineiro|Chapecoense|Criciúma|Avaí|Novorizontino|CRB|Remo|Operário Ferroviário|Vila Nova|Paysandu|Botafogo-SP|Ferroviária|Amazonas FC|Athletic Club|Volta Redonda']},
 ARG:{names:['Primera División','Primera Nacional'],clubs:['River Plate|Boca Juniors|Racing Club|Vélez Sarsfield|Estudiantes de La Plata|Independiente|Talleres Córdoba|Rosario Central|San Lorenzo|Argentinos Juniors|Huracán|Lanús|Defensa y Justicia|Newell\'s Old Boys|Belgrano|Godoy Cruz|Unión de Santa Fe|Platense|Tigre|Banfield|Gimnasia La Plata|Instituto Córdoba|Independiente Rivadavia|Barracas Central|Atlético Tucumán|Central Córdoba|Sarmiento|Aldosivi|San Martín de San Juan|Deportivo Riestra']},
 COL:{names:['Primera A'],clubs:['Atlético Nacional|Millonarios|América de Cali|Junior Barranquilla|Independiente Santa Fe|Independiente Medellín|Deportes Tolima|Deportivo Cali|Once Caldas|Atlético Bucaramanga|Deportivo Pereira|Alianza FC|Águilas Doradas|Envigado|Internacional de Bogotá|Fortaleza CEIF|Boyacá Chicó|Llaneros|Unión Magdalena|Deportivo Pasto']},
 CHI:{names:['Primera División'],clubs:['Colo-Colo|Universidad de Chile|Universidad Católica|Cobresal|Palestino|Huachipato|Ñublense|Audax Italiano|Everton de Viña del Mar|O\'Higgins|Coquimbo Unido|Unión La Calera|Deportes Iquique|Deportes La Serena|Deportes Limache|Unión Española']},
 URU:{names:['Primera División'],clubs:['Peñarol|Nacional|Defensor Sporting|Liverpool Montevideo|Danubio|Racing Montevideo|Boston River|Cerro Largo|Montevideo Wanderers|Plaza Colonia|Progreso|River Plate Montevideo|Juventud de Las Piedras|CA Cerro|Miramar Misiones|Deportivo Maldonado']},
 ECU:{names:['LigaPro'],clubs:['LDU Quito|Independiente del Valle|Barcelona SC|Emelec|Aucas|Universidad Católica (ECU)|Deportivo Cuenca|Delfín|Orense|Mushuc Runa|El Nacional|Técnico Universitario|Macará|Libertad FC|Vinotinto|Manta FC']},
 PAR:{names:['División de Honor'],clubs:['Olimpia|Cerro Porteño|Libertad|Guaraní|Nacional Asunción|Sportivo Luqueño|Sportivo Trinidense|2 de Mayo|Tacuary|General Caballero JLM|Sportivo Ameliano|Recoleta FC']},
 PER:{names:['Liga 1'],clubs:['Universitario|Alianza Lima|Sporting Cristal|FBC Melgar|Cienciano|Cusco FC|ADT Tarma|Sport Huancayo|Alianza Atlético|Atlético Grau|Comerciantes Unidos|Juan Pablo II|Los Chankas|Deportivo Garcilaso|Sport Boys|UTC Cajamarca|Ayacucho FC|Alianza Universidad']},
 MEX:{names:['Liga MX','Liga de Expansión'],clubs:['Club América|Cruz Azul|Tigres UANL|CF Monterrey|Toluca|Guadalajara|Pumas UNAM|Pachuca|Club León|Santos Laguna|Atlas|Club Tijuana|Necaxa|Puebla|Querétaro|Mazatlán FC|FC Juárez|Atlético San Luis']},
 USA:{closed:true,names:['Major League Soccer'],clubs:['Inter Miami|LAFC|LA Galaxy|Columbus Crew|FC Cincinnati|Philadelphia Union|Seattle Sounders|New York City FC|New York Red Bulls|Atlanta United|Orlando City|Nashville SC|Charlotte FC|Real Salt Lake|Minnesota United|Austin FC|Portland Timbers|Vancouver Whitecaps|FC Dallas|Houston Dynamo|Sporting Kansas City|Colorado Rapids|San Diego FC|St. Louis City|Chicago Fire|Toronto FC|CF Montréal|D.C. United|New England Revolution|San Jose Earthquakes']},
 CAN:{closed:true,names:['Canadian Premier League'],clubs:['Forge FC|Cavalry FC|Atlético Ottawa|Pacific FC|York United|HFX Wanderers|Valour FC|Vancouver FC']},
 JPN:{names:['J1 League','J2 League'],clubs:['Vissel Kobe|Sanfrecce Hiroshima|Kashima Antlers|Kashiwa Reysol|Machida Zelvia|Urawa Red Diamonds|Kawasaki Frontale|Gamba Osaka|Kyoto Sanga|Yokohama F. Marinos|FC Tokyo|Cerezo Osaka|Nagoya Grampus|Avispa Fukuoka|Tokyo Verdy|Shimizu S-Pulse|Fagiano Okayama|Shonan Bellmare|Yokohama FC|Albirex Niigata']},
 KOR:{names:['K League 1','K League 2'],clubs:['Ulsan HD|Jeonbuk Hyundai Motors|Pohang Steelers|FC Seoul|Gimcheon Sangmu|Daejeon Hana Citizen|Gangwon FC|Gwangju FC|Suwon FC|FC Anyang|Jeju SK|Daegu FC']},
 KSA:{names:['Saudi Pro League','First Division League'],clubs:['Al-Hilal|Al-Nassr|Al-Ittihad|Al-Ahli|Al-Qadsiah|Al-Shabab|Al-Ettifaq|Al-Taawoun|Al-Fateh|Al-Khaleej|Al-Fayha|Al-Riyadh|Al-Kholood|Damac|Al-Okhdood|Al-Hazem|Al-Najma|NEOM SC']},
 QAT:{names:['Qatar Stars League'],clubs:['Al-Sadd|Al-Duhail|Al-Gharafa|Al-Rayyan|Al-Wakrah|Al-Arabi|Qatar SC|Umm Salal|Al-Shamal|Al-Ahli Doha|Al-Shahania|Al-Sailiya']},
 UAE:{names:['UAE Pro League'],clubs:['Al-Ain|Shabab Al-Ahli|Al-Wahda|Al-Jazira|Sharjah FC|Al-Wasl|Al-Nasr Dubai|Baniyas|Ajman Club|Khor Fakkan|Kalba FC|Al-Bataeh|Dibba Al-Fujairah|Al-Dhafra']},
 IRN:{names:['Persian Gulf Pro League'],clubs:['Persepolis|Esteghlal|Sepahan|Tractor|Foolad|Gol Gohar|Zob Ahan|Malavan|Chadormalou|Esteghlal Khuzestan|Aluminium Arak|Kheybar Khorramabad|Mes Rafsanjan|Shams Azar|Havadar|Paykan']},
 CHN:{names:['Chinese Super League','China League One'],clubs:['Shanghai Port|Shanghai Shenhua|Chengdu Rongcheng|Beijing Guoan|Shandong Taishan|Tianjin Jinmen Tiger|Zhejiang FC|Henan FC|Yunnan Yukun|Qingdao West Coast|Wuhan Three Towns|Dalian Yingbo|Shenzhen Peng City|Qingdao Hainiu|Meizhou Hakka|Changchun Yatai']},
 AUS:{closed:true,names:['A-League Men'],clubs:['Melbourne City|Auckland FC|Western Sydney Wanderers|Melbourne Victory|Sydney FC|Adelaide United|Macarthur FC|Central Coast Mariners|Wellington Phoenix|Brisbane Roar|Newcastle Jets|Perth Glory']},
 EGY:{names:['Egyptian Premier League'],clubs:['Al Ahly|Zamalek|Pyramids FC|Al Masry|Ceramica Cleopatra|ZED FC|Modern Sport|Smouha|ENPPI|Ismaily|Al Ittihad Alexandria|Petrojet|El Gouna|Talaea El Gaish|National Bank of Egypt|Ghazl El Mahalla|Haras El Hodoud|Pharco']},
 MAR:{names:['Botola Pro'],clubs:['Wydad Casablanca|Raja Casablanca|RS Berkane|AS FAR Rabat|FUS Rabat|Maghreb Fès|Hassania Agadir|Olympic Safi|Difaâ El Jadidi|Ittihad Tanger|Union Touarga|Renaissance Zemamra|KAC Kénitra|CODM Meknès|Olympique Dcheira|Moghreb Tétouan']},
 RSA:{names:['Premiership'],clubs:['Mamelodi Sundowns|Orlando Pirates|Kaizer Chiefs|Stellenbosch FC|Sekhukhune United|AmaZulu|TS Galaxy|Polokwane City|Golden Arrows|Chippa United|Richards Bay|Siwelele FC|Magesi FC|Marumo Gallants|Durban City|Orbit College']},
 TUN:{names:['Ligue Professionnelle 1'],clubs:['Espérance Tunis|Étoile du Sahel|Club Africain|CS Sfaxien|US Monastir|Stade Tunisien|CA Bizertin|US Ben Guerdane|AS Marsa|JS Kairouan|ES Métlaoui|Olympique Béja|AS Soliman|ES Zarzis|JS Omrane|AS Gabès']},
 ALG:{names:['Ligue Professionnelle 1'],clubs:['MC Alger|CR Belouizdad|USM Alger|JS Kabylie|CS Constantine|ES Sétif|MC Oran|USM Khenchela|Paradou AC|ASO Chlef|Olympique Akbou|MC El Bayadh|JS Saoura|ES Mostaganem|NC Magra|MB Rouissat']},
 NGA:{names:['NPFL'],clubs:['Enyimba|Rangers International|Remo Stars|Rivers United|Shooting Stars|Kano Pillars|Plateau United|Lobi Stars|Kwara United|Bendel Insurance|Nasarawa United|Niger Tornadoes|Abia Warriors|Katsina United|Ikorodu City|Akwa United|Heartland|El-Kanemi Warriors|Sunshine Stars|Bayelsa United']},
 GHA:{names:['Premier League'],clubs:['Asante Kotoko|Hearts of Oak|Medeama SC|Bechem United|Dreams FC|Aduana FC|Nations FC|Bibiani Gold Stars|Berekum Chelsea|Heart of Lions|Samartex|Karela United|Vision FC|Young Apostles|Basake Holy Stars|Swedru All Blacks|Eleven Wonders|Hohoe United']},
};
NAME_POOLS.magh=NAME_POOLS.ar;

/* Orte für Amateurvereine in den Pokalen (große Länder) */
const AMATEUR_TOWNS={
 GER:'Gütersloh,Lübeck,Oldenburg,Meppen,Jena,Halle,Chemnitz,Zwickau,Offenbach,Kassel,Koblenz,Trier,Homburg,Pirmasens,Worms,Freiburg-St. Georgen,Villingen,Pforzheim,Reutlingen,Aalen,Stuttgarter Kickers,Ulm-Söflingen,Unterhaching,Augsburg-Göggingen,Bayreuth,Schweinfurt-Oberndorf,Fürth-Ronhof,Würzburg,Aschaffenburg,Gießen,Wetzlar,Siegen,Wuppertal,Uerdingen,Velbert,Lippstadt,Rödinghausen,Wiedenbrück,Paderborn-Neuhaus,Emden,Norderstedt,Flensburg,Weiche,Neustrelitz,Greifswald,Babelsberg,Luckenwalde,Lok Leipzig,Chemie Leipzig,Plauen',
 ENG:'Barrow,Bromley,Accrington,Morecambe,Crewe,Gillingham,Colchester,Grimsby,Harrogate,Cheltenham,Salford,Swindon,Walsall,Tranmere,Notts County,Fleetwood,Newport County,Carlisle,Chesterfield,Bristol Rovers,Milton Keynes,Crawley,Shrewsbury,York,Oldham,Southend,Hartlepool,Gateshead,Halifax,Solihull,Woking,Aldershot,Eastleigh,Sutton,Dagenham,Boreham Wood,Barnet,Wealdstone,Maidstone,Dorking,Ebbsfleet,Yeovil,Torquay,Weymouth,Kidderminster,Chester,Altrincham,Southport,Scunthorpe,Boston,Stockport Town,Macclesfield,Tamworth,Hereford,Worthing,Hemel Hempstead,Braintree,Chelmsford,Dartford,Welling,Bath,Truro,Gloucester',
 ESP:'Ponferrada,Lorca,Talavera,Toledo,Getafe Sur,Alcoyano,Ontinyent,Gandía,Xerez,Écija,Marbella,Estepona,Melilla,Guadalajara,Cacereño,Mérida AD,Zamora,Ávila,Segovia,Palencia,Burgos Promesas,Arenas Getxo,Barakaldo,Sestao,Amorebieta,Tudelano,Calahorra,Ejea,Teruel,Lleida,Terrassa,Badalona,Hospitalet,Sant Andreu,Olot,Figueres,Ibiza,Formentera,Poblense,Atlético Baleares,Unionistas Salamanca,Guijuelo,Langreo,Avilés,Covadonga,Compostela,Arosa,Pontevedra,Coruxo,Racing Ferrol,Getafe Norte,Alcalá,Leganés Sur,Móstoles,Torrejón,Rayo Majadahonda,San Sebastián de los Reyes,Fuenlabrada Sur,Villarrobledo,Yeclano,Águilas,Mar Menor',
 ITA:'Lecco,Novara,Pro Vercelli,Alessandria,Piacenza,Mantova,Trento,Arzignano,Vicenza,Padova Sud,Triestina,Pordenone,Rimini,Ancona,Perugia,Gubbio,Arezzo,Siena,Lucchese,Pontedera,Sestri Levante,Torres,Olbia,Latina,Cavese,Turris,Potenza,Monopoli,Foggia,Taranto,Crotone,Catania,Messina,Trapani',
 FRA:'Rouen,Le Puy,Villefranche,Bourg-Péronnas,Sochaux-Montbéliard,Orléans,Nîmes,Avranches,Concarneau,Quevilly,Versailles,Fleury,Créteil,Sedan,Épinal,Thionville,Mulhouse,Haguenau,Colmar,Chambly,Beauvais,Calais,Dunkerque Sud,Valenciennes,Boulogne-Billancourt,Saint-Malo,Vannes,Lorient Sud,Granville,Cholet,Les Herbiers,Poitiers,Niort,Angoulême,Bergerac,Bordeaux,Pau Sud,Tarbes,Toulouse Rodéo,Marignane,Martigues,Fréjus,Cannes,Grasse,Hyères,Toulon,Ajaccio,Furiani',
 NED:'Katwijk,Quick Boys,Spakenburg,IJsselmeervogels,Rijnsburgse Boys,Koninklijke HFC,AFC Amsterdam,Excelsior Maassluis,Barendrecht,GVVV,Kozakken Boys,Hoek,ACV Assen,Harkemase Boys,Staphorst,Hercules,Scheveningen,De Treffers,Lisse,Noordwijk,Sparta Nijkerk,Ajax Amateurs,DVS 33,Hollandia,HHC Hardenberg,Rohda Raalte,Urk,Genemuiden,Volendam Amateurs,Purmersteijn',
 POR:'Varzim,Trofense,Amarante,Fafe,Sanjoanense,Espinho,Anadia,Caldas,Fátima,Benfica Castelo Branco,Belenenses,Sintrense,Mafra,Pêro Pinheiro,Oriental,Atlético CP,Real SC,Olhanense,Lusitano Évora,Moncarapachense,Louletano,Esperança Lagos,Portosantense,Câmara de Lobos,Praiense,Santa Clara Açores,Lusitânia Açores,Montalegre,Vianense,Limianos,Mirandela,Bragança,Vila Real,Lamego,Tirsense,Felgueiras Sul,Gondomar,Leça,Salgueiros,Pedras Rubras,Canelas,Arcos,Machico,Juventude Évora,Beira-Mar,Alba,Marinhense,Torres Novas',
 SCO:'Stenhousemuir,East Fife,Montrose,Peterhead,Alloa,Stirling Albion,Clyde,Annan,Dumbarton,Forfar,Elgin,Edinburgh City,Stranraer,Bonnyrigg,Spartans,The Spartans,Kelty Hearts,Brechin,Buckie Thistle,Brora Rangers,Fraserburgh,Formartine,Banks o’ Dee,Linlithgow Rose,Auchinleck Talbot,Pollok,Darvel,Tranent,Gala Fairydean,Civil Service Strollers',
 BRA:'Ituano,Guarani,Ponte Preta,Santo André,São Bernardo,Portuguesa,XV de Piracicaba,Inter de Limeira,Velo Clube,Água Santa,Sampaio Corrêa,Moto Club,ABC,América-RN,Treze,Campinense,Botafogo-PB,Náutico,Santa Cruz,Retrô,CSA,ASA,Sergipe,Confiança,Juazeirense,Jacuipense,Altos,River-PI,Ferroviário,Floresta,Tuna Luso,Águia de Marabá,Manaus,Nacional-AM,Brasiliense,Gama,Anápolis,Aparecidense,Luverdense,União Rondonópolis,Operário-MS,Joinville,Brusque,Marcílio Dias,Hercílio Luz,Caxias,Ypiranga,São José-RS,Brasil de Pelotas,Londrina,Maringá,Cianorte,Tombense,Athletic MG,Uberlândia,Democrata,Volta Redonda Amador,Madureira,Boavista RJ,Portuguesa-RJ'
};
