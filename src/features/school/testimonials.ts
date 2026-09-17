export type Testimonial = {
  id: string;
  quote: string;
  /** Absent when the historical page published the comment anonymously. */
  author?: string;
  /** Shown in the home-page teaser. */
  featured?: boolean;
};

/**
 * Participant comments reproduced from the historical MHP avis page, in full
 * and in reading order. Quotes stay in the original French on every locale.
 */
export const testimonials: readonly Testimonial[] = [
  {
    id: "sdf",
    quote: "La formation a correspondu exactement à ce que j’attendais.",
    author: "S. D. F.",
  },
  {
    id: "tg",
    quote:
      "Vraiment merci à Gregory qui a été super du début à la fin! C’était 2 semaines incroyables qui resteront gravées quoi qu’il arrive!",
    author: "T. G.",
  },
  {
    id: "bm",
    quote:
      "Excellente organisation, accueil et suivi. Professionnalisme et humanité. Bravo et merci!",
    author: "B.M.",
  },
  {
    id: "chloe",
    quote:
      "Super intervenante, groupe super sympa, esprit bienveillant de tout le monde. J’ai particulièrement apprécié les ateliers, où l’on a pu beaucoup pratiquer et prendre confiance.",
    author: "Chloé",
    featured: true,
  },
  {
    id: "manon",
    quote:
      "Je connaissais déjà l’hypnose et ma « lecture » a été différente, c’est un réel bonheur d’avoir pu rencontrer Marta. Sa façon de transmettre est vraiment super. Je suis comblée dans mes attentes",
    author: "Manon",
    featured: true,
  },
  {
    id: "ag",
    quote:
      "Les explications par le formateur des techniques et mise en pratique et la présentation des vidéos sur l’hypnose ont été les meilleurs moments du cours. Je remercie Marta pour ses compétences, sa disponibilité, son attention.",
    author: "A.G.",
  },
  {
    id: "fb",
    quote:
      "Formation très riche personnellement et professionnellement. Un changement bénéfique et bienfaisant. Un énorme merci à Marta.",
    author: "F.B.",
  },
  {
    id: "pascal-1",
    quote:
      "J’ai tout simplement adoré l’ensemble du cours (très percutant). Je tiens à remercier tout particulièrement Marta. Merveilleuse, magnifique état d’esprit.",
    author: "Pascal",
  },
  {
    id: "anon",
    quote:
      "Rien est à changer puisque tout est fait avec le cœur dans l’esprit du partage et de la convivialité et de toute évidence beaucoup d’expérience à la clef. Formation très utile et idéale pour completer mes diverses formations Je repars en étant certain de pouvoir déjà en faire quelque chose de bien. Un grand merci!",
  },
  {
    id: "chjz",
    quote:
      "Mes grands remerciements à l’instructrice qui a donné avec humanisme, professionnalisme et générosité son savoir et j’ai appris avec grand plaisir son enseignement parfait. Merci Tous les moments du cours ont été parfaits, généreux et très enrichissants.",
    author: "CH.J.Z.",
  },
  {
    id: "mv",
    quote:
      "Mme Python Marta sait utiliser tous les outils de l’hypnose et du coaching pour faire évoluer la personne. Après cette formation on se sent plus fort encore - Merci pour tout !",
    author: "M.V.",
  },
  {
    id: "wn",
    quote:
      "Marta est une excellente instructrice, elle nous soutient et c’est très rassurant. Elle a une énergie qui nous booste et on sent qu’elle aime communiquer et nous apprendre et nous transmettre ses connaissances. Merci!",
    author: "W.N.",
  },
  {
    id: "gp",
    quote:
      "J’avais déjà participé à d’autres cours d’hypnose. Mais celui-ci est le premier qui m’a pleinement satisfait! Une expérience extraordinaire! On ne peut mieux faire.",
    author: "G.P.",
  },
  {
    id: "anon-2",
    quote:
      "Les meilleurs moments : Chaque moment était magique. Merci à Marta pour son Amour, sa gentillesse, son partage d’expérience de vie !",
  },
  {
    id: "anon-3",
    quote:
      "Les meilleurs moments du cours : La force et l’enthousiame de partager les connaissances ainsi que la façon de le faire. Vraiment excellent. Etant néophyte en hypnose je suis heureuse de toutes les connaissances apprises durant ce cours. Je vais oser pratiquer en toute confiance, car j’ai été vraiment stimulée et encouragée très efficacement. MERCI",
  },
  {
    id: "anon-4",
    quote:
      "Merci! J’ai vécu des moments très révélateurs ! Libérateurs ! Ce cours met un jalon dans ma vie : il y a un avant et un après ! J’ai saisi soudain en « Ultra » tant de messages bienfaisants ! Je me réjouis à l’idée de partager des expériences professionnelles avec toi et des conversations de vie sympathiques",
  },
  {
    id: "h-b",
    quote:
      "Tout le cours , vraiment tout le cours, de l’accueil à la fin était un et unique formidable moment. J’ai envie, il me tarde de pratiquer tout ce que j’ai appris…C’était vraiment top. Madame Marta Hegyaljai Python est une excellente formatrice. Elle maitrise à la perfection son enseignement et a un don formidable pour transmettre son savoir. En plus de ces merveilleuses qualités d’enseignante, elle est très attentive et à l’écoute de chacun de ses élèves. Elle cerne immédiatement les besoins de tous les participants et apporte avec douceur et à chacun, ce qui lui est nécessaire pour progresser. Elle sait moduler ou adapter son cours afin que tous soient satisfaits et évoluent dans la joie et la confiance. Avec une grande générosité, elle nous prodigue multiples conseils et soutiens pour réussir. Une formation intense, passionnante et « hypnotisante » ! Un immense et profond MERCI à Marta, une coach exceptionnelle",
    author: "H.B.",
  },
  {
    id: "anon-5",
    quote:
      "Si j’ai envie de remercier une personne en cette fin d’année, c’est bien Vous . Votre gentillesse et votre disponibilité m’ont beaucoup touchée. Votre professionnalisme et votre expérience m’ont apporté un grand soutien pour traverser cette douloureuse période. Merci du fond du cœur. Aujourd’hui j’ai enfin l’espoir d’un avenir meilleur et de nuits paisibles.",
  },
  {
    id: "anon-6",
    quote:
      "J’ai réussi! Un énorme merci pour votre aide précieuse sans laquelle je n’aurais pas pu relever cet énorme défi! Le cours m’accompagne chaque jour, comme vos conseils judicieux. Pas après pas je me rapproche de mon indépendance et je reprends peu à peu possession de ma vie. Vous êtes une personne extraordinaire et je suis heureuse d’avoir pu bénéficier de votre incroyable soutien",
  },
  {
    id: "anon-7",
    quote: "Retrouver la confiance en soi pour pratiquer l’hypnose !",
  },
  {
    id: "anon-8",
    quote:
      "Félicitations et Merci. J’ai été enchanté et ravis. Ce cours m’a apporté des compétences supplémentaires et je vais pouvoir apporter de l’aide concrète à des personnes.",
  },
  {
    id: "mm",
    quote: "Tous les moments ont été excellents ! FANTASTICO",
    author: "M.M.",
  },
  {
    id: "ve",
    quote:
      "Meilleurs moments : les expériences de l’intérieur et le partage entre les apprenants et l’instructrice. J’ai adoré et me sens enrichie… en tout point de vue.",
    author: "V.E.",
  },
  {
    id: "anon-9",
    quote:
      "Les meilleurs moments du cours : L’enseignement, l’attention personnalisée et l’engagement total de l’instructrice. Je suis fière d’avoir passé ce diplôme OMNI. Je souhaite vous remercier, c’est un cadeau dans la vie d’une thérapeute – Merci –",
  },
  {
    id: "dy",
    quote:
      "Pour moi les mises en pratique ont été des moments d’apprentissage et de pur Bonheur !",
    author: "D.Y.",
  },
  {
    id: "jk",
    quote:
      "Ce cours m’a vraiment plu et Mme Marta Hegyaljai Python est non seulement un professeur de qualité, elle est aussi d’une énorme grandeur d’âme, nous respecte et est respectée. Je lui dis un grand merci pour cela.",
    author: "J.K.",
  },
  {
    id: "anon-10",
    quote: "Tout le cours était des moments magnifique !",
  },
  {
    id: "anon-11",
    quote:
      "De ce fait, le reste suit, c’est-à-dire que j’ai repris confiance en l’existence et que mes angoisses ont, comme par enchantement, disparu ! Quel soulagement ! Hasard du calendrier, conjonction des astres ou simple coïncidence, je ne sais, mais je suis certain que vos séances, et la façon dont vous avez envisagé une situation que je pensais désespérée, ont joué un rôle prépondérant dans l’évolution de mon cas. Merci donc à votre lucidité et à votre perspicacité ! ... en vous remerciant de l’espoir singulièrement réconfortant que vous m’avez donnée, ....",
  },
  {
    id: "anon-12",
    quote:
      "Tout le cours , vraiment tt le cours, de l’accueil à la fin était un et unique formidable moment. J’ai envie, il me tarde de pratiquer tout ce que j’ai appris…C’était vraiment top. Madame Marta Hegyaljai Python est une excellente formatrice. Elle maitrise à la perfection son enseignement et a un don formidable pour transmettre son savoir. En plus de ces merveilleuses qualités d’enseignante, elle est très attentive et à l’écoute de chacun de ses élèves. Elle cerne immédiatement les besoins de tous les participants et apporte avec douceur et à chacun, ce qui lui est nécessaire pour progresser. Elle sait moduler ou adapter son cours afin que tous soient satisfaits et évoluent dans la joie et la confiance. Avec une grande générosité, elle nous prodigue multiples conseils et soutiens pour réussir. Une formation intense, passionnante et « hypnotisante » ! Un immense et profond MERCI à Marta, une coach exceptionnelle",
  },
  {
    id: "anon-13",
    quote:
      "Tout le cours en général, malgré les pauses entre les différents weekend, la même énergie était présente.",
  },
  {
    id: "anon-14",
    quote:
      "Tout semble simple, agréable et facile et accessible ! Tu rends l’hypnothérapie accessible. Super ! Merci",
  },
  {
    id: "anon-15",
    quote:
      "Marta tu es une personne incroyablement humaine. Et tu m’a fait évoluer lors des 10 jours. Ne change riens, reste comme tu es.",
  },
  {
    id: "anon-16",
    quote:
      "J’ai jamais rencontré une personne autant dynamique et captivante que Marta. Sa passion pour l’hypnose est extrêmement contagieuse. Vive les hypno-junkee ! Meilleurs moments : Toutes les phases pratiques avec les autres étudiants et personnes externes au cours.",
  },
  {
    id: "bz",
    quote: "Indéfinissable. Tout était fantastique. MERCI !",
    author: "B.Z.",
  },
  {
    id: "anon-17",
    quote: "Alternance théorie/pratique parfaite",
  },
  {
    id: "anon-18",
    quote:
      "Les moments de pratiques et les échanges avec Marta et les autres élèves ont été les meilleurs moments du cours.",
  },
  {
    id: "delphine",
    quote:
      "J’ai particulièrement apprécié les exercices ainsi que la densité, l’exigence et la bienveillance.",
    author: "Delphine",
  },
  {
    id: "celine",
    quote: "Merci. Ce cours change ma vie et me …. Dans le bon sens du terme",
    author: "Céline",
  },
  {
    id: "anne-michelle",
    quote:
      "Bon rythme, bonne dynamique, intense et dense. Immersion totale très valable. Les meilleurs moments du cours ont été la pratique, le climat de confiance.",
    author: "Anne-Michelle",
    featured: true,
  },
  {
    id: "anon-19",
    quote:
      "Toute la formation a été riche en apprentissages en tous points. Et les très grandes qualités humaines et les capacités d’enseignements de la part de Marta. Les tout parfaitement coordonné par ses deux assistantes. C’est un succès retentissant ! Félicitations et un grand MERCI",
  },
  {
    id: "nathalie",
    quote:
      "Merci merci , c’était un vrai bonheur cette formation, un pas en avant ! Je n’ai jamais été aussi en forme dans une formation. Il faudrait intégrer des moments d’hypnose en groupe à l’école, à bientôt !",
    author: "Nathalie",
  },
  {
    id: "rosine",
    quote:
      "Triste que ça se termine déjà, l’esprit de groupe est très soudé. Je suis arrivée ici en fleur en bourgeon et me voilà en train d’éclore, merveilleux! Merci infiniment",
    author: "Rosine",
  },
  {
    id: "anon-20",
    quote:
      "J’ai beaucoup aimé le haut professionnalisme de Marta et tout son équipe ! Aussi la ponctualité à été bien apprécié, la patience de Marta d’expliquer chaque détail et donner pleins des exemples. Merci beaucoup !!! 👍😁",
  },
  {
    id: "marlyn",
    quote: "Excellente ambiance, team très pro et sympa. Grande disponibilité.",
    author: "Marlyn",
  },
  {
    id: "pascal-2",
    quote:
      "Excellente formation. Excellente ambiance de cours. Excellente formatrice. Formation à recommander!",
    author: "Pascal",
  },
  {
    id: "anon-21",
    quote:
      "J’ai passé 10 jours qui ont changé ma vision de la vie et vont laisser des marques à vie. Un réel plaisir à vous rencontrer, et à rencontrer tout le reste du groupe",
  },
  {
    id: "anon-22",
    quote:
      "Excellente énergie et j’ai apprécié le professionnalisme de l’équipe !",
  },
  {
    id: "anon-23",
    quote:
      "Merci beaucoup à Marta et son équipe. J’ai beaucoup appris et ça m’a fait prendre confiance.",
  },
  {
    id: "olivier",
    quote:
      "Top, équipe fun, dispo, beaux échanges, et plein de 2 au 10e degré. Lieu de formation facile d’accès. Et je me réjouis de pouvoir revenir comme assistant, aux prochaines formations 😀",
    author: "Olivier",
  },
  {
    id: "katia",
    quote: "Très belle formation simple à pratiquer et très puissante",
    author: "Katia",
  },
  {
    id: "philippe",
    quote: "The best training ever !",
    author: "Philippe",
  },
  {
    id: "marco",
    quote:
      "Vivement la suite avec les autres modules de perfectionnements à thème.",
    author: "Marco",
  },
  {
    id: "anne",
    quote: "Intense et riche en connaissance et applications",
    author: "Anne",
  },
  {
    id: "abdelhalim",
    quote:
      "Merci à vous Marta, vous m’avez apporté beaucoup dans cette formation. Un mot: Respect. Merci à toute l’équipe Anne et Annick. C’est Top!",
    author: "Abdelhalim",
  },
  {
    id: "catherine",
    quote: "A très vite pour la suite :-))",
    author: "Catherine",
  },
  {
    id: "angelina-2",
    quote:
      "Bon dynamisme de l’instructeur, la présence de Marta vient apporter la touche finale à cette belle formation. Merci à vous.",
    author: "Angelina",
  },
  {
    id: "anon-31-2",
    quote:
      "Grand professionnalisme ; interactions et pratique ; très agréable et intéressant à voir eu la chance d’entendre à la fois notre instructeur et Marta",
  },
  {
    id: "mickael-2",
    quote: "Merci beaucoup à Grégory, Marta et Léa (pour l’administratif)",
    author: "Mickaël",
  },
  {
    id: "joel-ambiance",
    quote:
      "Excellente ambiance. Formations très agréable. Très bonne sélection des stagiaires",
    author: "Joël",
  },
  {
    id: "karl",
    quote:
      "Très bonne ambiance La présence de Martha est très bénéfique également à partir de la deuxième semaine",
    author: "Karl",
  },
  {
    id: "emilie",
    quote:
      "Un merci particulier à notre formatrice! Un plaisir de la retrouver les matins de formation avec son sourire et son énergie positive! Le soin qu’elle porte à ce qu’elle nous transmet était particulièrement appréciable! Merci également aux assistants qui nous ont tous accompagnés avec humour et bienveillance!!",
    author: "Emilie",
  },
  {
    id: "marie",
    quote:
      "Une instructrice fantastique qui donne envie de devenir hypnothérapeute. Merci à elle pour cette magnifique énergie qui s’est transmise sur nous. Une super organisation et formation qui me fait me sentir pleinement satisfaite. De belles rencontres qui resteront gravées!",
    author: "Marie",
  },
  {
    id: "monica",
    quote:
      "Merci pour les bons petits snack , l’eau, le café, les Blocher notes, chocolats, stylos, etc... c’est appréciable. Instructrice top!!!",
    author: "Monica",
  },
  {
    id: "frederique",
    quote:
      "Merci de nous avoir accompagnés, pas à pas, sur ce chemin différent... Techniques et principes à investir rapidement dans mon milieu professionnel....",
    author: "Frederique",
  },
  {
    id: "andree",
    quote:
      "J’ai beaucoup apprécié la personnalité de Nelcy, ses compétences, la manière dont elle mène le groupe (respect, autorité, ...)",
    author: "Andrée",
  },
  {
    id: "anon-25",
    quote:
      "De très belles rencontres et découvertes. Merci pour cette expérience incroyable.",
  },
  {
    id: "anon-26",
    quote: "MERCI! Bluffée par cette formation intense.",
  },
  {
    id: "anon-27",
    quote:
      "J’ai beaucoup aimé cette formation mais j’aurais eu besoin de quelque chose plus en lien avec ma pratique hospitalière. Le charisme de Marta apporte beaucoup à cette formation et donne envie de lui envoyer beaucoup de monde. Merci pour tous ces agréables moments et merci aussi à Annick pour son écoute et sa bonne humeur.",
  },
  {
    id: "anon-28",
    quote:
      "C’était vraiment une formation top! Première fois que je ne m ennuie pas une minute pendant 1 formation. En plus hyper instructif pour soi même.",
  },
  {
    id: "anon-29",
    quote: "Super chouette 🌞🙏🏼",
  },
  {
    id: "anon-30",
    quote:
      "Très bon niveau de formation, très pratique , bons supports ....bonne ambiance et bon accueil ;0) Merci beaucoup pour cette très belle découverte",
  },
  {
    id: "joelle",
    quote:
      "J’ai beaucoup aimé le cadre de cette formation, la qualité de l’enseignement, la variété des exemples.",
    author: "Joelle",
  },
  {
    id: "anne-claire",
    quote:
      "Très bien organisé. Bon accompagnement et supervision. Merci beaucoup d’avoir répondu à toutes les questions.",
    author: "Anne Claire",
  },
  {
    id: "maeva",
    quote:
      "J’ai eu énormément de plaisir à suivre et vivre cette formation. Il y a effectivement un avant après déjà à la fin du 1er jour. Merci pour ce partage de connaissances et humains.",
    author: "Maeva",
  },
  {
    id: "eric-2",
    quote:
      "Un grand merci a Marta et Annick pour ces jours de formation cela a été incroyable",
    author: "Eric",
  },
  {
    id: "anais",
    quote:
      "Un grand merci à toute les deux pour votre énergie, votre professionnalisme, votre disponibilité, votre humour.",
    author: "Anaïs",
  },
  {
    id: "julien",
    quote: "Je suis impatient d’exercer 👍🏻😀",
    author: "Julien",
  },
  {
    id: "lucas",
    quote:
      "Cours extraordinaire et presse de continuer pour d autres formations.",
    author: "Lucas",
  },
  {
    id: "xavier",
    quote:
      "La disponibilité de l’experte, la bonne humeur, la joie, la bonne entente et l’écoute active ainsi que la considération des questions posées et des réponses apportées. Restez comme vous êtes! Topissime",
    author: "Xavier",
  },
  {
    id: "aline",
    quote: "Très professionnel",
    author: "Aline",
  },
  {
    id: "jean-daniel",
    quote:
      "Très bonne répartition court / exercice. Inductions qui m’ont beaucoup apporté, et des exemples de Marta très intéressants. Merci pour la formation",
    author: "Jean-Daniel",
  },
  {
    id: "caroline",
    quote:
      "Bravo bravo ! Cette formation m’a fait du bien personnellement (apaisement et confiance) et me conforte dans l’idée que je veux pratiquer. C’est passionnant, magique, puissant ! Quelle énergie Marta et bienveillance ! Merci beaucoup",
    author: "Caroline",
  },
  {
    id: "marie-anne",
    quote:
      "Très bonne formation très enrichissante, professionnelle et pratique. Ça me donne beaucoup de nouveaux outils",
    author: "Marie-Anne",
  },
  {
    id: "anon-32",
    quote:
      "Super dynamique de groupe. On se sent à l’aise et en confiance tout de suite. Ça nous fait sortir de notre zone de confort mais avec un accompagnement très professionnel et bienveillant. Merci beaucoup j’ai beaucoup aimé.",
  },
  {
    id: "ekaterina",
    quote: "Merci beaucoup, la formation est top! Très professionnelle!",
    author: "Ekaterina",
  },
  {
    id: "brooke",
    quote: "Merci, thank you for everything.",
    author: "Brooke",
  },
  {
    id: "anon-33",
    quote:
      "J’ai réellement trouvé ce que je voulais faire dans ma vie ! Je reviens très prochainement pour les formations continues dans le but d’être maître prat :)",
  },
  {
    id: "sandra",
    quote:
      "Merci de tout cœur pour cette belle formation qui m’a apportée beaucoup. Très pro merci.",
    author: "Sandra",
  },
  {
    id: "jean-pierre",
    quote:
      "Je suis impressionné et inspiré par la personnalité de Marta, ainsi que par le potentiel de l’organisation mhp.",
    author: "Jean Pierre",
  },
  {
    id: "jean-pierre-2",
    quote:
      "Bravo à vous tous chez mhp. Continuez comme ça et vivement que vous ouvrez aussi à Berne. C‘est de plus en plus „welche“. On se voit très bientôt pour une formation",
    author: "Jean Pierre",
  },
  {
    id: "julien-2",
    quote: "Merci pour cette formation. Beaucoup de professionnalisme",
    author: "Julien",
  },
  {
    id: "emmanuel",
    quote:
      "Certainement une des meilleures formations que j’ai suivie. Merci infiniment.",
    author: "Emmanuel",
  },
  {
    id: "annamaria",
    quote: "J’ai atteints mes objectifs et plus encore. Merci",
    author: "Annamaria",
  },
  {
    id: "anon-34",
    quote:
      "Un grand merci pour le partage de connaissances. Ces 7 jours étaient passionnants et plaisants à vivre.",
  },
  {
    id: "frederic",
    quote: "Bravo sincèrement à toute l équipe et à sa bienveillance",
    author: "Frederic",
  },
  {
    id: "david",
    quote:
      "Je pense qu’il y a un avant et après l’information par rapport à nous-mêmes",
    author: "David",
  },
  {
    id: "simon",
    quote: "Excellente formation concrète!",
    author: "Simon",
  },
  {
    id: "anon-35",
    quote:
      "Vraiment trop génial !!! Le dynamisme de Martha est entraînant et motivant!! Et nous montre qu’on est humain avant tout.",
  },
  {
    id: "anon-36",
    quote:
      "Toute la formation est de très haut niveau, Marta est une personne exceptionnelle en compétences techniques et humaines.",
  },
  {
    id: "anon-37",
    quote:
      "Une très bonne ambiance de groupe nous a permis de vivre pleinement cette formation.",
  },
  {
    id: "pauline-1",
    quote:
      "C’était une belle formation, l’enseignante était très qualifiée et a pu régulièrement parler de son expérience professionnelle. Merci pour ces savoirs transmis !!",
    author: "Pauline",
  },
  {
    id: "alexandre",
    quote:
      "Marta est EXCELLENTE, autant dans son attitude que dans sa manière de transmettre son savoir. Elle est une excellente pédagogue. Un grand merci à Marta et à sa fille Annick qui ont fait un travail extraordinaire.",
    author: "Alexandre",
  },
  {
    id: "anon-38",
    quote: "Merci !",
  },
  {
    id: "marie-andree",
    quote: "Merci mille fois pour cette superbe expérience!",
    author: "Marie-Andrée",
  },
  {
    id: "anon-39",
    quote:
      "J’ai adoré cette formation, la clarté des concepts, la bienveillance de la formatrice et sa personnalité. Très préparée et engagée, j’ai aimé sa façon de parler de ses cas avec passion. J’ai adoré la présence aimable de sa fille aussi.",
  },
  {
    id: "francois",
    quote:
      "C’est à tout point de vue créatif, constructif, bénéfique et encourageant. Formation très professionnelle. Merci pour cette qualité!",
    author: "François",
  },
  {
    id: "sarah",
    quote:
      "Très bonne formation avec explications, contenu, organisation, disponibilité.",
    author: "Sarah",
  },
  {
    id: "anon-40",
    quote:
      "Cette formation répond parfaitement à mes attentes. Elle m’a donné les outils dont j’avais besoin, et je peux les utiliser immédiatement.",
  },
  {
    id: "pauline-2",
    quote:
      "J’ai adoré Marta, son énergie, son expérience, ses histoires et sa puissance.",
    author: "Pauline",
  },
  {
    id: "vanessa",
    quote:
      "Merci à Marta et Annick vous êtes vraiment supers. Cette formation a changé ma vie avant même de commencer une nouvelle vie professionnelle. Un grand merci",
    author: "Vanessa",
  },
  {
    id: "gaelle",
    quote:
      "J ai eu énormément de plaisir à découvrir l’hypnose et j’ai beaucoup aimé la dynamique et découvrir les multiples personnalités des personnes intéressées.",
    author: "Gaëlle",
  },
  {
    id: "closing",
    quote:
      "J’ai adoré cette formation, une vraie découverte, non seulement j’ai tous les outils pour être une excellente hypnothérapeute mais j’ai aussi observé un réel changement au fond de moi-même! Merci",
  },
  {
    id: "eric",
    quote:
      "Ayant fait plusieurs formations, celle-ci est la plus complète avec de réels outils. Tout était bien. Aussi bien la théorie que la pratique",
    author: "Eric",
    featured: true,
  },
];

export const featuredTestimonials = testimonials.filter(
  (entry) => entry.featured,
);
