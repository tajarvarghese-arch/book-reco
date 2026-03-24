'use client';

import { useState } from 'react';

type Recommendation = {
  title: string;
  author: string;
  pages: number;
  year: number;
  reason: string;
  synopsis: string;
  coverUrl: string;
};

type Genre = {
  name: string;
  icon: string;
  color: string;
  analysis: string;
  books: Recommendation[];
};

const genreColors = ['bg-[#d97757]', 'bg-[#6a9bcc]', 'bg-[#788c5d]', 'bg-[#d97757]', 'bg-[#6a9bcc]', 'bg-[#788c5d]', 'bg-[#d97757]'];

const genres: Genre[] = [
  {
    name: "Hard Sci-Fi & Speculative Fiction",
    icon: "rocket",
    color: genreColors[0],
    analysis: "Your strongest signal. You gave 5 stars to Foundation, Dune, The Three-Body Problem trilogy, Ender\u2019s Game, The Forever War, Seveneves, and Hyperion. You love rigorous world-building, civilizational-scale stakes, and scientifically grounded speculation. You also gravitate toward series (Three-Body, Commonwealth Saga). You\u2019ve rated soft sci-fi lower (Snow Crash: 3, Red Rising: 3).",
    books: [
      {
        title: "Blindsight",
        author: "Peter Watts",
        pages: 384,
        year: 2006,
        coverUrl: "https://covers.openlibrary.org/b/id/524560-M.jpg",
        reason: "You loved the hard-science rigor of Three-Body Problem and the existential dread of The Forever War. Blindsight fuses both: first contact told through neuroscience, vampire biology, and a narrator who literally cannot feel empathy. It asks what consciousness actually is.",
        synopsis: "In 2082, sixty-five thousand alien objects ignite in Earth\u2019s atmosphere and burn out. A crew of radically posthuman specialists is sent to investigate the source: a massive object at the edge of the solar system. What they find challenges every assumption about intelligence, communication, and what it means to be aware."
      },
      {
        title: "A Fire Upon the Deep",
        author: "Vernor Vinge",
        pages: 613,
        year: 1992,
        coverUrl: "https://covers.openlibrary.org/b/id/9261466-M.jpg",
        reason: "You devoured Seveneves (872 pages) and the Commonwealth Saga. This matches your appetite for galaxy-spanning hard sci-fi with genuinely alien civilizations and a \u2018Zones of Thought\u2019 concept that redefines the rules of physics by region of the galaxy.",
        synopsis: "A human expedition accidentally unleashes an ancient, malevolent superintelligence from a galactic archive. The only hope lies with two children stranded on a medieval world inhabited by pack-minded dog-like aliens. A desperate rescue mission races across zones of the galaxy where the laws of physics--and thought itself--change."
      },
      {
        title: "Children of Time",
        author: "Adrian Tchaikovsky",
        pages: 600,
        year: 2015,
        coverUrl: "https://covers.openlibrary.org/b/id/8264706-M.jpg",
        reason: "You rated Liu Cixin 5 stars for making alien thinking truly alien. Tchaikovsky does the same with spiders--an entire civilization of evolved arachnids whose culture, science, and warfare are utterly non-human but scientifically rigorous. Combines your love of sweeping timelines with hard biology.",
        synopsis: "Earth\u2019s last survivors flee a dying planet and find a terraformed world seeded with a nanovirus meant to accelerate monkey evolution. But the monkeys died. The spiders didn\u2019t. Over thousands of years, a spider civilization rises--developing language, religion, technology--while the desperate human ark approaches on a collision course."
      },
      {
        title: "The Book of the New Sun",
        author: "Gene Wolfe",
        pages: 950,
        year: 1980,
        coverUrl: "https://covers.openlibrary.org/b/id/11305529-M.jpg",
        reason: "You finished Infinite Jest and Blood Meridian--you don\u2019t shy from dense, literary prose. This is sci-fi written at the level of Borges and Proust, set a million years in Earth\u2019s future. An unreliable narrator, layered symbolism, and prose that rewards rereading.",
        synopsis: "Severian, a torturer\u2019s apprentice in a crumbling far-future Earth where the sun is dying, is exiled for showing mercy. His journey across a world of decayed technology and forgotten wonders is an unreliable memoir--every detail hides another meaning, and the narrator may be lying about everything."
      },
      {
        title: "Permutation City",
        author: "Greg Egan",
        pages: 310,
        year: 1994,
        coverUrl: "https://covers.openlibrary.org/b/id/1000639-M.jpg",
        reason: "Your 5-star rating of Foundation and fascination with Labatut\u2019s explorations of mathematical genius suggest you\u2019d love Egan\u2019s exploration of consciousness, simulation theory, and cellular automata taken to their logical extreme.",
        synopsis: "In 2050, the wealthy can upload copies of themselves into virtual reality--but the copies know they\u2019re copies. Paul Durham discovers that a simulation doesn\u2019t need a computer to run. He creates an entire universe from scratch using cellular automata, populating it with digital beings who evolve their own civilization--and then things get strange."
      }
    ]
  },
  {
    name: "Narrative Non-Fiction & History",
    icon: "scroll",
    color: genreColors[1],
    analysis: "Your most consistent genre. You\u2019ve given 5 stars to Devil in the White City, In the Heart of the Sea, Boys in the Boat, Unbroken, Legacy of Ashes, The Coldest Winter, and Undaunted Courage. Your pattern: true stories of extreme human endurance, institutional intrigue, and characters operating under impossible pressure. You love Erik Larson\u2019s dual-narrative technique and David Halberstam\u2019s deep reporting.",
    books: [
      {
        title: "Endurance: Shackleton\u2019s Incredible Voyage",
        author: "Alfred Lansing",
        pages: 357,
        year: 1959,
        coverUrl: "https://covers.openlibrary.org/b/id/542833-M.jpg",
        reason: "Already on your to-read list, and for good reason. You gave 5 stars to In the Heart of the Sea, Unbroken, and Boys in the Boat. This is the ur-text of survival narrative non-fiction--many consider it the greatest adventure story ever told.",
        synopsis: "In 1914, Ernest Shackleton\u2019s ship Endurance becomes trapped and crushed by Antarctic ice, stranding 27 men on frozen floes with no communication and no hope of rescue. What follows is a 22-month odyssey across the most hostile environment on Earth--drifting on ice, sailing an open boat 800 miles through the worst seas on the planet, and crossing unmapped mountains--without losing a single man."
      },
      {
        title: "The Splendid and the Vile",
        author: "Erik Larson",
        pages: 608,
        year: 2020,
        coverUrl: "https://covers.openlibrary.org/b/id/9293917-M.jpg",
        reason: "You rated Devil in the White City 5 stars--this is Larson\u2019s best since. He applies his signature dual-narrative technique to Churchill\u2019s first year as PM during the Blitz. Matches your love of WWII history (Longest Day, Coldest Winter, Unbroken).",
        synopsis: "Erik Larson brings intimate, day-by-day detail to Winston Churchill\u2019s first year as prime minister as German bombs rain on London. Drawing from diaries, archival records, and intelligence reports, Larson reveals how Churchill rallied a nation through charm, rhetoric, and sheer obstinacy--while his family navigated romance, rivalry, and near-constant danger overhead."
      },
      {
        title: "Killers of the Flower Moon",
        author: "David Grann",
        pages: 338,
        year: 2017,
        coverUrl: "https://covers.openlibrary.org/b/id/8055064-M.jpg",
        reason: "You gave The Wager (also Grann) 4 stars and Devil in the Grove 5 stars. Grann\u2019s masterpiece layers a true-crime mystery about murdered Osage people over the birth of the FBI, revealing systemic corruption--the same institutional rot you found compelling in Legacy of Ashes.",
        synopsis: "In the 1920s, members of the Osage Nation in Oklahoma begin dying under mysterious circumstances after oil is discovered on their land, making them the wealthiest people per capita in the world. As the death toll rises, a newly created FBI under J. Edgar Hoover sends a former Texas Ranger to investigate. What he uncovers is one of the most chilling conspiracies in American history."
      },
      {
        title: "The Warmth of Other Suns",
        author: "Isabel Wilkerson",
        pages: 622,
        year: 2010,
        coverUrl: "https://covers.openlibrary.org/b/id/10129368-M.jpg",
        reason: "You 5-starred Devil in the Grove and Hillbilly Elegy--both about the American experience told through individual lives. Wilkerson tracks three Black Americans fleeing the Jim Crow South across six decades. The same structural ambition as your favorite histories, but with the novelistic intimacy of your favorite literary fiction.",
        synopsis: "Between 1915 and 1970, six million Black Americans fled the South in search of something better. Isabel Wilkerson follows three of them--a sharecropper\u2019s wife, a surgeon, and a field worker--from Mississippi, Florida, and Louisiana to Chicago, New York, and Los Angeles, weaving their stories into a sweeping portrait of the Great Migration that reshaped America."
      },
      {
        title: "Empire of the Sun",
        author: "J.G. Ballard",
        pages: 288,
        year: 1984,
        coverUrl: "https://covers.openlibrary.org/b/id/6547-M.jpg",
        reason: "You loved Unbroken\u2019s survival under Japanese captivity and East of Eden\u2019s coming-of-age sweep. Ballard\u2019s autobiographical novel covers his childhood in a Japanese internment camp in Shanghai--WWII survival through the eyes of a boy. Literary fiction that reads like your favorite narrative non-fiction.",
        synopsis: "Eleven-year-old Jim Graham is separated from his parents when the Japanese invade Shanghai in 1941. He survives alone through the city\u2019s occupied streets before ending up in an internment camp, where he transforms from a privileged British boy into a resourceful survivor, navigating starvation, B-29 bombing raids, and the atomic flash that ends the war."
      }
    ]
  },
  {
    name: "Literary Fiction & Classics",
    icon: "book",
    color: genreColors[2],
    analysis: "You engage deeply with demanding prose. Five stars to Blood Meridian, Moby-Dick, Infinite Jest (finished it), A Little Life, Middlesex, The Count of Monte Cristo, East of Eden, The Remains of the Day, and Crossroads. You tend toward maximalist, ambitious novels with moral complexity. You also love international literary fiction (Pachinko, Siddhartha, Shadow of the Wind). Your 2-star rating of 1Q84 suggests you need narrative momentum even in literary works.",
    books: [
      {
        title: "The Brothers Karamazov",
        author: "Fyodor Dostoevsky",
        pages: 796,
        year: 1880,
        coverUrl: "https://covers.openlibrary.org/b/id/11263774-M.jpg",
        reason: "You gave 5 stars to Moby-Dick, The Count of Monte Cristo, and Anna Karenina (4 stars). You clearly love 19th-century masterworks. Dostoevsky\u2019s final novel is the supreme exploration of faith, doubt, and human nature--themes you engage with across Siddhartha, Man\u2019s Search for Meaning, and Blood Meridian.",
        synopsis: "The three Karamazov brothers--intellectual atheist Ivan, passionate sensualist Dmitri, and saintly novice Alyosha--are drawn into a crisis when their despicable father is murdered. Each brother represents a different response to the question of God, morality, and freedom. The novel contains \u2018The Grand Inquisitor,\u2019 widely considered the greatest philosophical passage in all of fiction."
      },
      {
        title: "2666",
        author: "Roberto Bolano",
        pages: 912,
        year: 2004,
        coverUrl: "https://covers.openlibrary.org/b/id/1047310-M.jpg",
        reason: "You loved Blood Meridian\u2019s apocalyptic violence and Labatut\u2019s blend of fact and fiction. Bolano\u2019s magnum opus sprawls across five interconnected novellas converging on femicides in a Mexican border city. Same literary ambition as Infinite Jest, same unflinching darkness as McCarthy.",
        synopsis: "Five seemingly unrelated stories converge on Santa Teresa, a fictional Mexican border city where hundreds of women are being murdered. An academic search for a reclusive German novelist, an African-American journalist covering a boxing match, a philosophy professor\u2019s doomed love affair, and a police detective\u2019s investigation all spiral toward the same abyss--a portrait of evil that refuses easy explanation."
      },
      {
        title: "The Master and Margarita",
        author: "Mikhail Bulgakov",
        pages: 372,
        year: 1967,
        coverUrl: "https://covers.openlibrary.org/b/id/15013644-M.jpg",
        reason: "You rated American Gods 5 stars and loved Shadow of the Wind. Bulgakov\u2019s masterpiece is the original \u2018Devil visits a modern city\u2019 novel--wildly funny, deeply political, structurally daring. It nests a retelling of Pontius Pilate\u2019s encounter with Jesus inside a satire of Stalinist Moscow.",
        synopsis: "The Devil arrives in 1930s Moscow with a retinue that includes a giant talking cat, a fanged assassin, and a naked witch. As Satan exposes the greed and cowardice of Soviet literary society, the narrative interweaves with chapters from a suppressed novel about Pontius Pilate\u2019s fateful encounter with a wandering philosopher. Meanwhile, Margarita makes a deal with the Devil to save the imprisoned writer she loves."
      },
      {
        title: "The Savage Detectives",
        author: "Roberto Bolano",
        pages: 577,
        year: 1998,
        coverUrl: "https://covers.openlibrary.org/b/id/3706128-M.jpg",
        reason: "Before 2666, try this--Bolano\u2019s love letter to literature and youth. You loved A Brief History of Seven Killings (5 stars), which uses the same polyphonic structure: dozens of voices building a mosaic. If you loved the ambition of Infinite Jest, this delivers similar structural inventiveness with more heart.",
        synopsis: "Two young poets in 1970s Mexico City found a radical literary movement and then vanish into the Sonora Desert searching for a legendary lost poet. Twenty years of interviews across three continents piece together what happened--a sprawling oral history of bohemian idealism colliding with violence, exile, and the passage of time."
      },
      {
        title: "Stoner",
        author: "John Williams",
        pages: 278,
        year: 1965,
        coverUrl: "https://covers.openlibrary.org/b/id/8310729-M.jpg",
        reason: "You gave Remains of the Day 5 stars--a quiet masterpiece about an ordinary life examined with devastating precision. Stoner is its American counterpart: a Midwestern farm boy becomes a literature professor, and the novel chronicles his unremarkable life with such beauty it becomes transcendent.",
        synopsis: "William Stoner grows up on a dirt-poor Missouri farm, goes to university to study agriculture, and accidentally falls in love with literature. He becomes a professor, endures a loveless marriage, faces academic politics, and finds brief happiness in a forbidden affair. Nothing much happens. It is devastating."
      }
    ]
  },
  {
    name: "Espionage & Crime Thrillers",
    icon: "detective",
    color: genreColors[3],
    analysis: "A deep and recurring love. You 5-starred The Spy Who Came In from the Cold and Smiley\u2019s People, you\u2019re currently reading more le Carre, and you rated the Cormoran Strike series highly. You also loved The Alienist and Murder of Roger Ackroyd. Your taste runs literary rather than pulpy--morally gray protagonists and institutional betrayal over action sequences.",
    books: [
      {
        title: "Tinker, Tailor, Soldier, Spy",
        author: "John le Carre",
        pages: 384,
        year: 1974,
        coverUrl: "https://covers.openlibrary.org/b/id/7021556-M.jpg",
        reason: "You gave 5 stars to two le Carre novels and are currently reading more. If you haven\u2019t read this yet, it\u2019s the crown jewel--the hunt for a Soviet mole inside British intelligence. The intellectual puzzle and moral weight you love in le Carre, perfected.",
        synopsis: "George Smiley, forced into retirement from the Circus (MI6), is secretly brought back to investigate a devastating possibility: one of the four most senior intelligence officers is a Soviet double agent. With meticulous patience, Smiley reconstructs years of operations, betrayals, and personal entanglements to identify the mole--knowing that the truth will destroy the institution he\u2019s served his entire life."
      },
      {
        title: "Gorky Park",
        author: "Martin Cruz Smith",
        pages: 365,
        year: 1981,
        coverUrl: "https://covers.openlibrary.org/b/id/606548-M.jpg",
        reason: "You love le Carre\u2019s bleak institutional settings and The Alienist\u2019s historical detective work. Gorky Park drops a brilliant Moscow detective into a triple homicide where the victims\u2019 faces have been removed. The real mystery is surviving the investigation in a system designed to suppress truth.",
        synopsis: "Three mutilated bodies are found frozen in Moscow\u2019s Gorky Park, their faces and fingertips removed to prevent identification. Chief investigator Arkady Renko refuses orders to close the case quickly and pursues the truth through layers of KGB interference, American fur traders, and Siberian sable farms--knowing that solving the crime might be more dangerous than the murder itself."
      },
      {
        title: "The Secret History",
        author: "Donna Tartt",
        pages: 559,
        year: 1992,
        coverUrl: "https://covers.openlibrary.org/b/id/744854-M.jpg",
        reason: "You loved A Little Life\u2019s intense character study and The Alienist\u2019s literary crime. Tartt\u2019s debut is a reverse murder mystery--you know whodunit from page one--set among Greek scholars at a Vermont college. Dark academia before it was a genre.",
        synopsis: "A group of elite classics students at a small Vermont college become so intoxicated by ancient Greek ideals of beauty and Dionysian ecstasy that they conduct a secret ritual that goes terribly wrong, leading to the death of a local farmer. To protect themselves, they commit a second, deliberate murder--of one of their own. The narrator recounts how brilliance, privilege, and moral blindness led to catastrophe."
      },
      {
        title: "City of Thieves",
        author: "David Benioff",
        pages: 258,
        year: 2008,
        coverUrl: "https://covers.openlibrary.org/b/id/10132618-M.jpg",
        reason: "You gave The Wager 4 stars and love adventure-survival narratives. Benioff (Game of Thrones showrunner) wrote this tight, darkly funny WWII novel about two men given an impossible task during the Siege of Leningrad: find a dozen eggs or die. The same gallows humor and propulsive stakes as your favorite narrative non-fiction.",
        synopsis: "During the Siege of Leningrad, a seventeen-year-old looter and a charismatic deserter are arrested and given an impossible mission by a Soviet colonel: find a dozen eggs for his daughter\u2019s wedding cake within a week, or be executed. Their quest takes them through the frozen, starving city and behind enemy lines--a picaresque adventure through the darkest chapter of WWII."
      },
      {
        title: "The Day of the Jackal",
        author: "Frederick Forsyth",
        pages: 380,
        year: 1971,
        coverUrl: "https://covers.openlibrary.org/b/id/77394-M.jpg",
        reason: "You appreciate meticulous procedural detail (le Carre, Cormoran Strike). Forsyth\u2019s classic is the ultimate cat-and-mouse thriller: an assassin hired to kill de Gaulle vs. the detective trying to stop him. Zero fat, relentless tension, and the procedural detail of both hunter and hunted is unmatched.",
        synopsis: "A professional assassin known only as the Jackal is hired by a French paramilitary group to kill President Charles de Gaulle. The novel meticulously follows both the Jackal\u2019s preparations--forging identities, acquiring weapons, planning his shot--and the French detective racing to identify and stop him. Neither knows the other\u2019s name, and the clock is ticking toward a public ceremony."
      }
    ]
  },
  {
    name: "Biography & Ideas",
    icon: "brain",
    color: genreColors[4],
    analysis: "You\u2019re drawn to genius and obsession. Five stars to both Feynman books, Elon Musk, Skunk Works, The Emperor of All Maladies, Better Angels of Our Nature, and Fortune\u2019s Formula. You love people who see the world differently and the systems they build or break. Your Labatut ratings (both 5 stars) confirm this--fictionalized accounts of real scientific minds pushed to madness.",
    books: [
      {
        title: "The Making of the Atomic Bomb",
        author: "Richard Rhodes",
        pages: 886,
        year: 1986,
        coverUrl: "https://covers.openlibrary.org/b/id/6919988-M.jpg",
        reason: "You 5-starred both Feynman books, Labatut\u2019s MANIAC, and Skunk Works. This is the definitive account of the Manhattan Project--the physics, the politics, the moral reckoning. If you loved Labatut\u2019s dramatization of scientific genius, this is the real thing, Pulitzer-winning and equally gripping.",
        synopsis: "Richard Rhodes traces the development of the atomic bomb from the discovery of nuclear fission in 1938 through Hiroshima, interweaving the physics that made it possible with the personalities--Bohr, Oppenheimer, Fermi, Szilard, Teller--who built it. Part physics textbook, part thriller, part moral reckoning with the most consequential invention in human history."
      },
      {
        title: "The Power Broker",
        author: "Robert Caro",
        pages: 1336,
        year: 1974,
        coverUrl: "https://covers.openlibrary.org/b/id/253659-M.jpg",
        reason: "You finished Better Angels (832 pages), Seveneves (872 pages), and the full Three-Body trilogy. You don\u2019t fear length. Caro\u2019s biography of Robert Moses is the greatest study of power ever written--how one unelected man reshaped New York City and destroyed neighborhoods. Matches your love of institutional non-fiction (Legacy of Ashes, Cable Cowboy).",
        synopsis: "Robert Moses never held elected office, yet for forty years he shaped New York more than any mayor or governor. He built 13 bridges, 416 miles of parkways, 658 playgrounds, and entire neighborhoods--while demolishing others, displacing hundreds of thousands of people, and amassing power through bond authorities and bureaucratic manipulation. Caro reveals how democracy can be subverted by a single visionary with no accountability."
      },
      {
        title: "The Innovators",
        author: "Walter Isaacson",
        pages: 542,
        year: 2014,
        coverUrl: "https://covers.openlibrary.org/b/id/7313659-M.jpg",
        reason: "You have Isaacson\u2019s Elon Musk on your currently-reading list and gave the Vance biography 5 stars. The Innovators traces the entire digital revolution from Ada Lovelace to Google--the collaborative genius behind every breakthrough. Same author, broader canvas.",
        synopsis: "Walter Isaacson traces the digital revolution from Ada Lovelace\u2019s 1840s vision of a general-purpose computing machine through Alan Turing, the transistor inventors, the internet\u2019s creators, and the founders of Google. The connecting thread: every breakthrough required collaboration between visionaries and engineers, dreamers and doers."
      },
      {
        title: "The Gene: An Intimate History",
        author: "Siddhartha Mukherjee",
        pages: 592,
        year: 2016,
        coverUrl: "https://covers.openlibrary.org/b/id/11320163-M.jpg",
        reason: "You gave Emperor of All Maladies 5 stars. Mukherjee\u2019s follow-up does for genetics what that book did for cancer--a sweeping history from Mendel to CRISPR, threaded through his own family\u2019s history of mental illness. Same author, same brilliance.",
        synopsis: "Siddhartha Mukherjee traces the history of the gene from Gregor Mendel\u2019s pea garden through the eugenics horrors of the 20th century to the CRISPR revolution, interweaving the science with his own family\u2019s multigenerational struggle with severe mental illness. He asks: if we can read and edit the code of life, should we?"
      },
      {
        title: "Liar\u2019s Poker",
        author: "Michael Lewis",
        pages: 256,
        year: 1989,
        coverUrl: "https://covers.openlibrary.org/b/id/204556-M.jpg",
        reason: "You 5-starred Moneyball and clearly love Michael Lewis. If you haven\u2019t read his first book--his inside account of Salomon Brothers in the 1980s--it\u2019s where his legendary style began. Matches your interest in finance (Fortune\u2019s Formula, When Genius Failed, Buffett).",
        synopsis: "Fresh out of Princeton and the London School of Economics, 24-year-old Michael Lewis stumbles into a job at Salomon Brothers and witnesses the invention of the mortgage bond market that would eventually destroy the global economy. A wickedly funny insider account of Wall Street\u2019s greed, absurdity, and the young traders who bet billions on gut instinct."
      }
    ]
  },
  {
    name: "Endurance & Human Performance",
    icon: "runner",
    color: genreColors[5],
    analysis: "A niche but intense passion. You 5-starred Born to Run and Two Hours, read Finding Ultra and Out There, and have Can\u2019t Hurt Me and Extreme Ownership on your list. You\u2019re clearly a runner or endurance athlete who reads about the outer limits of human physical performance.",
    books: [
      {
        title: "North: Finding My Way While Running the Appalachian Trail",
        author: "Scott Jurek",
        pages: 288,
        year: 2018,
        coverUrl: "https://covers.openlibrary.org/b/id/8804494-M.jpg",
        reason: "You 5-starred Born to Run, where Jurek is a central character. North is his attempt to break the Appalachian Trail speed record at age 41--his body breaking down, his marriage tested, his identity as an ultrarunner in crisis.",
        synopsis: "At 41, legendary ultrarunner Scott Jurek attempts to break the speed record on the Appalachian Trail--2,189 miles from Georgia to Maine. Running 50+ miles a day through rain, injury, and Lyme disease, Jurek confronts what happens when the body and mind that defined his identity start to fail. His wife documents the journey alongside him."
      },
      {
        title: "The Perfect Mile",
        author: "Neal Bascomb",
        pages: 332,
        year: 2004,
        coverUrl: "https://covers.openlibrary.org/b/id/1471969-M.jpg",
        reason: "You 5-starred Two Hours (about the marathon barrier) and loved Boys in the Boat. The Perfect Mile applies the same formula to 1954--three runners on three continents racing to break the 4-minute mile. Same obsessive-athletic narrative you crave.",
        synopsis: "In 1954, three men on three continents each trained to break the four-minute mile--a barrier that doctors said would kill any runner who attempted it. Roger Bannister in England, John Landy in Australia, and Wes Santee in America pushed their bodies to the absolute limit. Bascomb reconstructs the parallel quests with the pacing of a thriller."
      },
      {
        title: "Let Your Mind Run",
        author: "Deena Kastor",
        pages: 288,
        year: 2018,
        coverUrl: "https://covers.openlibrary.org/b/id/8807470-M.jpg",
        reason: "You\u2019ve read several books on mental frameworks (Ego Is the Enemy, You Are a Badass, Alcohol Explained). Kastor\u2019s memoir is unique--America\u2019s greatest female marathoner explains how she rewired her psychology to transform from a talented dropout to an Olympic medalist. Performance psychology meets running narrative.",
        synopsis: "Deena Kastor was burning out, plagued by negative self-talk and injuries. A new coach taught her to replace every critical thought with a constructive one--in training, racing, and life. The result: an American marathon record, an Olympic bronze medal, and a complete transformation of how she experienced running, pain, and competition."
      }
    ]
  },
  {
    name: "International & Translated Fiction",
    icon: "globe",
    color: genreColors[6],
    analysis: "An underrated thread in your library. You 5-starred Pachinko, Siddhartha, The Shadow of the Wind, and The Three-Body Problem (translated from Chinese). You gave 4 stars to The White Tiger and Factory Girls. You\u2019re drawn to stories that illuminate unfamiliar cultures with the sweep of epic fiction.",
    books: [
      {
        title: "The Wind-Up Bird Chronicle",
        author: "Haruki Murakami",
        pages: 607,
        year: 1994,
        coverUrl: "https://covers.openlibrary.org/b/id/12976127-M.jpg",
        reason: "You rated 1Q84 only 2 stars--too bloated. Wind-Up Bird is Murakami\u2019s masterpiece and half the length. Surreal Tokyo life collides with WWII Manchuria in a labyrinthine mystery. The Japan-set fiction you want from Murakami without the excess.",
        synopsis: "Toru Okada\u2019s cat disappears. Then his wife disappears. Searching for both, he descends into a well, encounters psychics and war veterans, and drifts between present-day Tokyo and the horrifying Japanese occupation of Manchuria. What begins as suburban ennui becomes an exploration of violence, memory, and the hidden darkness beneath ordinary life."
      },
      {
        title: "My Brilliant Friend",
        author: "Elena Ferrante",
        pages: 331,
        year: 2011,
        coverUrl: "https://covers.openlibrary.org/b/id/13772133-M.jpg",
        reason: "You 5-starred Pachinko and A Little Life--multi-decade sagas of identity and survival in specific cultural contexts. Ferrante\u2019s Neapolitan novels track two women from 1950s Naples through sixty years of friendship, rivalry, and transformation.",
        synopsis: "In a violent, poor neighborhood of 1950s Naples, two girls--brilliant, studious Elena and fierce, unpredictable Lila--form an intense friendship that will shape their entire lives. One escapes through education; the other is trapped by marriage at sixteen. Their intertwined fates mirror Italy\u2019s transformation across six decades."
      },
      {
        title: "Tai-Pan",
        author: "James Clavell",
        pages: 732,
        year: 1966,
        coverUrl: "https://covers.openlibrary.org/b/id/1004316-M.jpg",
        reason: "You already 5-starred Shogun! Tai-Pan is the next in Clavell\u2019s Asian Saga--the founding of Hong Kong. Same sweeping historical fiction, new setting, new century. If Shogun was feudal Japan, this is the birth of British colonial trade in China.",
        synopsis: "In 1841, Dowd Doirk Doirk--the \u2018Dowd Doirk\u2019 or supreme trader--establishes the British colony of Hong Kong after the First Opium War. Caught between rival trading houses, Chinese secret societies, typhoons, and political intrigue, he must build an empire from a barren rock while navigating love, betrayal, and the collision of Eastern and Western civilizations."
      },
      {
        title: "The Vegetarian",
        author: "Han Kang",
        pages: 183,
        year: 2007,
        coverUrl: "https://covers.openlibrary.org/b/id/15182525-M.jpg",
        reason: "You loved Pachinko\u2019s Korean setting and My Sister the Serial Killer\u2019s darkly compressed prose. Han Kang\u2019s Booker Prize winner is a slim, disturbing novella about a woman who stops eating meat--and the violent reactions of the men around her. Short, sharp, and unforgettable.",
        synopsis: "An ordinary Seoul housewife announces she will no longer eat meat after a series of violent, bloody dreams. Her husband is embarrassed. Her father force-feeds her. Her brother-in-law becomes sexually obsessed with her. As she moves toward something inhuman and plant-like, the men around her react with escalating cruelty. A fable about autonomy, desire, and what happens when a woman refuses to comply."
      }
    ]
  }
];

const iconMap: Record<string, string> = {
  rocket: "\u{1F680}",
  scroll: "\u{1F4DC}",
  book: "\u{1F4D6}",
  detective: "\u{1F575}\uFE0F",
  brain: "\u{1F9E0}",
  runner: "\u{1F3C3}",
  globe: "\u{1F30D}",
};

function Tooltip({ text }: { text: string }) {
  return (
    <div className="absolute z-50 bottom-full left-0 right-0 mb-2 p-4 bg-white border border-[#e8e6dc] rounded-xl shadow-lg text-[#141413] text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-lg">
      {text}
      <div className="absolute top-full left-8 w-3 h-3 bg-white border-b border-r border-[#e8e6dc] transform rotate-45 -translate-y-1.5" />
    </div>
  );
}

export default function RecommendationsPage() {
  const [expandedGenre, setExpandedGenre] = useState<string | null>(genres[0].name);

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <header className="bg-white border-b border-[#e8e6dc]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#141413]" style={{fontFamily: 'var(--font-heading)'}}>Your Reading DNA</h1>
              <p className="text-sm text-[#b0aea5] mt-1">Analysis of 160+ rated books &middot; Personalized recommendations</p>
            </div>
            <div className="flex gap-2">
              <a href="/" className="brand-btn px-4 py-2 bg-white border border-[#e8e6dc] text-[#141413] text-sm">Dashboard</a>
              <a href="/screen" className="brand-btn px-4 py-2 bg-white border border-[#e8e6dc] text-[#141413] text-sm">Edit Library</a>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="brand-card p-5">
              <p className="text-xs text-[#788c5d] uppercase tracking-wide" style={{fontFamily: 'var(--font-heading)'}}>Your Identity</p>
              <p className="text-sm text-[#141413] mt-2">You&apos;re a <strong className="text-[#d97757]">hard sci-fi loyalist</strong> who also devours narrative non-fiction about extreme human endurance. You finish 800+ page novels and rate demanding literary fiction highly.</p>
            </div>
            <div className="brand-card p-5">
              <p className="text-xs text-[#d97757] uppercase tracking-wide" style={{fontFamily: 'var(--font-heading)'}}>Your Sweet Spot</p>
              <p className="text-sm text-[#141413] mt-2">Books that combine <strong className="text-[#d97757]">intellectual rigor with propulsive narrative</strong>. You rate &ldquo;smart page-turners&rdquo; highest--whether that&apos;s Three-Body Problem, Devil in the White City, or le Carre. You punish bloat (1Q84: 2 stars).</p>
            </div>
            <div className="brand-card p-5">
              <p className="text-xs text-[#6a9bcc] uppercase tracking-wide" style={{fontFamily: 'var(--font-heading)'}}>Blind Spot</p>
              <p className="text-sm text-[#141413] mt-2">Almost <strong className="text-[#d97757]">no translated fiction</strong> beyond Murakami and Liu Cixin, and limited contemporary literary fiction post-2020. Your biggest growth opportunity is international literature and modern prize-winners.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {genres.map((genre) => {
          const isExpanded = expandedGenre === genre.name;
          return (
            <div key={genre.name} className="brand-card overflow-hidden">
              <button
                onClick={() => setExpandedGenre(isExpanded ? null : genre.name)}
                className="w-full px-6 py-5 flex items-center gap-4 hover:bg-[#faf9f5] transition text-left"
              >
                <span className="text-3xl">{iconMap[genre.icon] || genre.icon}</span>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-[#141413]" style={{fontFamily: 'var(--font-heading)'}}>{genre.name}</h2>
                  <p className="text-sm text-[#b0aea5] mt-1">{genre.books.length} recommendations</p>
                </div>
                <span className={`text-[#b0aea5] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  &#9660;
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-[#e8e6dc]">
                  <div className={`mx-6 mt-4 mb-6 p-4 ${genre.color} rounded-lg`}>
                    <p className="text-xs uppercase tracking-wide text-white opacity-80 mb-1" style={{fontFamily: 'var(--font-heading)'}}>Why This Genre Fits You</p>
                    <p className="text-sm leading-relaxed text-white opacity-95">{genre.analysis}</p>
                  </div>

                  <div className="px-6 pb-6 space-y-4">
                    {genre.books.map((book, i) => (
                      <div key={i} className="group relative border border-[#e8e6dc] bg-white rounded-lg p-4 hover:border-[#b0aea5] hover:shadow-sm transition">
                        <Tooltip text={book.synopsis} />
                        <div className="flex gap-4">
                          <img src={book.coverUrl} alt={book.title} className="w-16 h-24 rounded-md object-cover shrink-0 shadow-sm bg-[#e8e6dc]" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#141413]">{book.title}</h3>
                                <p className="text-sm text-[#b0aea5]">{book.author} &middot; {book.year} &middot; {book.pages} pages</p>
                              </div>
                              <span className="text-xs text-[#b0aea5] bg-[#faf9f5] px-2 py-1 border border-[#e8e6dc] rounded shrink-0 ml-3">
                                hover for synopsis
                              </span>
                            </div>
                            <p className="text-sm text-[#141413] mt-3 leading-relaxed opacity-80">
                              <span className="font-bold text-[#d97757]">Why you&apos;ll love it: </span>
                              {book.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
